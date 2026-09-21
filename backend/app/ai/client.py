"""Python port of bosla-services/src/goal-planner/anthropicClient.ts.

One shape of call per role:
 - research        - free-form, with the server-side web_search tool. Returns text.
 - structured       - no tools, structured output locked to a pydantic model.
 - fetch_page       - the Intervenor's own fetch of one URL. No judgement, just the page.
 - judge_relevance  - one call deciding which of the fetched pages are on topic.
 - stream_chat      - free-form streaming turn, used by the career-discovery pipeline.

See groq_client.py for the alternate provider backend implementing the same
`AiClient` protocol (base.py) - which one `deps.get_ai_client()` returns is driven by
`Settings.ai_provider`.
"""

from __future__ import annotations

from collections.abc import AsyncGenerator
from typing import TypeVar

import anthropic
from pydantic import BaseModel

from .base import AiError, FetchedPage, PageToJudge

DEFAULT_MODEL = "claude-opus-5"
EXCERPT_CHARS = 700
MAX_SEARCH_USES = 6
MAX_CONTINUATIONS = 4

T = TypeVar("T", bound=BaseModel)


def _translate(err: Exception) -> AiError:
    if isinstance(err, AiError):
        return err
    if isinstance(err, anthropic.AuthenticationError):
        return AiError("The AI provider rejected the API key. Check it in Settings.", "auth")
    if isinstance(err, anthropic.RateLimitError):
        return AiError("The AI provider is rate-limiting requests. Try again in a minute.", "rate_limit")
    if isinstance(err, anthropic.APIConnectionError):
        return AiError("Could not reach the AI provider. Check the connection.", "network")
    if isinstance(err, anthropic.APIStatusError):
        return AiError(f"AI provider error {err.status_code}: {err.message}", "other", status=err.status_code)
    return AiError(str(err), "other")


def _text_of(content) -> str:
    return "\n".join(b.text for b in content if getattr(b, "type", None) == "text")


class AnthropicAiClient:
    def __init__(self, api_key: str, model: str | None = None):
        self.client = anthropic.AsyncAnthropic(api_key=api_key)
        self.model = model or DEFAULT_MODEL

    async def research(self, system: str, user: str) -> str:
        try:
            messages: list[dict] = [{"role": "user", "content": user}]
            transcript: list[str] = []

            round_i = 0
            while True:
                res = await self.client.messages.create(
                    model=self.model,
                    max_tokens=16000,
                    system=system,
                    tools=[{"type": "web_search_20260209", "name": "web_search", "max_uses": MAX_SEARCH_USES}],
                    messages=messages,
                )
                if res.stop_reason == "refusal":
                    raise AiError("The AI provider declined to research this goal.", "refusal")

                transcript.append(_text_of(res.content))

                if res.stop_reason == "pause_turn" and round_i < MAX_CONTINUATIONS:
                    messages.append({"role": "assistant", "content": res.content})
                    round_i += 1
                    continue
                break

            findings = "\n\n".join(t for t in transcript if t)
            if not findings.strip():
                raise AiError("The research step returned no findings.", "malformed")
            return findings
        except Exception as err:
            raise _translate(err) from err

    async def structured(self, system: str, user: str, output_format: type[T], max_tokens: int = 16000) -> T:
        try:
            res = await self.client.messages.parse(
                model=self.model,
                max_tokens=max_tokens,
                system=system,
                messages=[{"role": "user", "content": user}],
                output_format=output_format,
            )
            if res.stop_reason == "refusal":
                raise AiError("The AI provider declined to respond.", "refusal")
            if res.stop_reason == "max_tokens":
                raise AiError("The response was cut off before it finished.", "malformed")
            if res.parsed_output is None:
                raise AiError("The response did not match the expected shape.", "malformed")
            return res.parsed_output
        except Exception as err:
            raise _translate(err) from err

    async def fetch_page(self, url: str) -> FetchedPage:
        try:
            res = await self.client.messages.create(
                model=self.model,
                max_tokens=200,
                system='Fetch the URL with the web_fetch tool, then reply with the single word "done".',
                tools=[{"type": "web_fetch_20260209", "name": "web_fetch", "max_uses": 1, "max_content_tokens": 2000}],
                messages=[{"role": "user", "content": f"URL: {url}"}],
            )
            result = next((b for b in res.content if getattr(b, "type", None) == "web_fetch_tool_result"), None)
            if result is None:
                return FetchedPage(ok=False, title=None, excerpt="", error="not_fetched")
            content = result.content
            if getattr(content, "type", None) == "web_fetch_tool_result_error":
                return FetchedPage(ok=False, title=None, excerpt="", error=content.error_code)
            doc = content.content
            source = doc.source
            excerpt = source.data[:EXCERPT_CHARS] if getattr(source, "type", None) == "text" else ""
            return FetchedPage(ok=True, title=doc.title, excerpt=excerpt, error=None)
        except Exception as err:
            e = _translate(err)
            if e.kind in ("auth", "rate_limit"):
                raise e
            return FetchedPage(ok=False, title=None, excerpt="", error=str(e))

    async def judge_relevance(self, pages: list[PageToJudge], topic: str) -> list[bool]:
        if not pages:
            return []
        try:
            from .goal_planner import RelevanceOutput

            system = (
                "You check whether web pages are genuinely about a topic. For each page you are given "
                "its URL, title and the start of its text. Return one verdict per URL, in the same "
                "order, with relevant true only if the page is actually about the topic — a parked "
                "domain, an error page, a login wall or an unrelated article is false."
            )
            lines = [f"Topic: {topic}", ""]
            for i, p in enumerate(pages):
                lines.append(f"{i + 1}. URL: {p.url}\n   Title: {p.title or '(none)'}\n   Text: {p.excerpt[:EXCERPT_CHARS]}")
            user = "\n".join(lines)

            out = await self.structured(system, user, RelevanceOutput, max_tokens=1000)
            by_url = {v.url: v.relevant for v in out.verdicts}
            return [by_url.get(p.url, True) for p in pages]
        except Exception as err:
            e = _translate(err)
            if e.kind in ("auth", "rate_limit"):
                raise e
            return [True for _ in pages]

    async def stream_chat(
        self,
        system: str,
        messages: list[dict],
        *,
        stop: list[str] | None = None,
        temperature: float = 0.7,
        max_tokens: int = 2000,
    ) -> AsyncGenerator[str, None]:
        try:
            kwargs: dict = dict(
                model=self.model,
                max_tokens=max_tokens,
                system=system,
                messages=messages,
                temperature=temperature,
            )
            if stop:
                kwargs["stop_sequences"] = stop
            async with self.client.messages.stream(**kwargs) as stream:
                async for text in stream.text_stream:
                    yield text
        except Exception as err:
            raise _translate(err) from err
