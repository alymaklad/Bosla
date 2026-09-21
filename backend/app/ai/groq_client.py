"""Python port of bosla-services/src/goal-planner/groqClient.ts (research/structured/
fetch_page/judge_relevance) plus bosla-services/src/career-discovery/providers/
openaiCompatible.ts (stream_chat) - Groq behind the same `AiClient` protocol (base.py)
the Anthropic backend implements, so goal_planner.py and career_discovery.py never need
to know which provider is configured.

Two differences from Anthropic are absorbed here so the rest of the app never sees them:
 - research uses Groq's `compound` system (server-side search), falling back to
   `compound-mini` and then the plan model with no search at all;
 - there is no web-fetch tool, so link verification is a plain HTTP GET.
"""

from __future__ import annotations

import asyncio
import json
import re
from collections.abc import AsyncGenerator
from typing import TypeVar

import httpx
from pydantic import BaseModel

from .base import AiError, AiErrorKind, EXCERPT_CHARS, FetchedPage, PageToJudge

BASE = "https://api.groq.com/openai/v1"

GROQ_RESEARCH_MODEL = "groq/compound"
GROQ_RESEARCH_FALLBACK_MODEL = "groq/compound-mini"
GROQ_DEFAULT_MODEL = "openai/gpt-oss-120b"

# Groq's free tier caps tokens per request and per minute far below Anthropic's, and a
# request that would exceed the per-request cap is refused outright (413).
MAX_OUTPUT = {"research": 1500, "plan": 4000, "critique": 800, "relevance": 400}
MIN_OUTPUT = 700
MAX_RATE_LIMIT_RETRIES = 3
MAX_WAIT_MS = 25_000

T = TypeVar("T", bound=BaseModel)


def _patch_for_strict_mode(node: object) -> None:
    """Every object schema needs `additionalProperties: false` and every property listed
    in `required` for Groq/OpenAI strict JSON-schema mode - pydantic's default output
    doesn't set either (optional fields with defaults are simply omitted from `required`).
    Numeric bounds are dropped too, matching the zod->JSON-schema conversion this mirrors."""
    if isinstance(node, dict):
        node.pop("$schema", None)
        node.pop("default", None)  # not a supported keyword in OpenAI/Groq strict mode
        if node.get("type") in ("integer", "number"):
            node.pop("minimum", None)
            node.pop("maximum", None)
        if isinstance(node.get("properties"), dict):
            node["additionalProperties"] = False
            node["required"] = list(node["properties"].keys())
        for v in node.values():
            _patch_for_strict_mode(v)
    elif isinstance(node, list):
        for v in node:
            _patch_for_strict_mode(v)


def to_strict_schema(model: type[BaseModel]) -> dict:
    schema = model.model_json_schema()
    _patch_for_strict_mode(schema)
    return schema


def _extract_json(text: str) -> object:
    trimmed = text.strip()
    try:
        return json.loads(trimmed)
    except json.JSONDecodeError:
        pass
    m = re.search(r"```(?:json)?\s*([\s\S]*?)```", trimmed)
    if m:
        return json.loads(m.group(1))
    start = trimmed.find("{")
    end = trimmed.rfind("}")
    if start >= 0 and end > start:
        return json.loads(trimmed[start : end + 1])
    raise AiError("The model did not return JSON.", "malformed")


def _title_of(html: str) -> str | None:
    m = re.search(r"<title[^>]*>([\s\S]*?)</title>", html, re.I)
    if not m:
        return None
    title = re.sub(r"\s+", " ", m.group(1)).strip()
    return title or None


def _text_of(html: str) -> str:
    html = re.sub(r"<head[\s\S]*?</head>", " ", html, flags=re.I)
    html = re.sub(r"<script[\s\S]*?</script>", " ", html, flags=re.I)
    html = re.sub(r"<style[\s\S]*?</style>", " ", html, flags=re.I)
    html = re.sub(r"<[^>]+>", " ", html)
    html = html.replace("&nbsp;", " ")
    return re.sub(r"\s+", " ", html).strip()


def _translate_openai(err: Exception) -> AiError:
    import openai

    if isinstance(err, AiError):
        return err
    if isinstance(err, openai.AuthenticationError):
        return AiError("Groq rejected the API key. Check it in Settings.", "auth")
    if isinstance(err, openai.RateLimitError):
        return AiError("Groq is rate-limiting requests. Try again shortly.", "rate_limit")
    if isinstance(err, openai.APIConnectionError):
        return AiError("Could not reach Groq. Check the connection.", "network")
    if isinstance(err, openai.APIStatusError):
        return AiError(f"Groq error {err.status_code}: {err.message}", "other", status=err.status_code)
    return AiError(str(err), "other")


class GroqAiClient:
    def __init__(self, api_key: str, model: str | None = None, research_model: str | None = None):
        self.api_key = api_key
        self.model = model or GROQ_DEFAULT_MODEL
        self.research_model = research_model or GROQ_RESEARCH_MODEL
        self._http = httpx.AsyncClient(timeout=60.0)

    @staticmethod
    def _reasoning_params(for_model: str) -> dict:
        # gpt-oss models reason before answering and the reasoning spends the same output
        # budget as the answer - keep it light, the Reflexion loop supplies the second thoughts.
        return {"reasoning_effort": "low", "include_reasoning": False} if re.search(r"gpt-oss", for_model, re.I) else {}

    async def _chat(self, request: dict, *, allow_truncated: bool = False) -> str:
        body = {**self._reasoning_params(str(request["model"])), **request}
        shrunk = False
        attempt = 0

        while True:
            try:
                res = await self._http.post(
                    f"{BASE}/chat/completions",
                    headers={"authorization": f"Bearer {self.api_key}", "content-type": "application/json"},
                    json=body,
                )
            except httpx.HTTPError as err:
                raise AiError("Could not reach Groq. Check the connection.", "network") from err

            if res.status_code in (401, 403):
                raise AiError("Groq rejected the API key. Check it in Settings.", "auth")

            if res.status_code == 429 or res.status_code >= 500:
                retry_after = res.headers.get("retry-after")
                try:
                    ms = float(retry_after) * 1000 if retry_after else (2**attempt) * 1500
                except ValueError:
                    ms = (2**attempt) * 1500
                if attempt < MAX_RATE_LIMIT_RETRIES and ms <= MAX_WAIT_MS:
                    await asyncio.sleep(ms / 1000)
                    attempt += 1
                    continue
                if res.status_code == 429:
                    raise AiError(
                        "Groq is rate-limiting requests. Free-tier limits are per minute — wait a "
                        "minute and try again, or pick a smaller model.",
                        "rate_limit",
                    )

            if res.status_code == 413:
                try:
                    data = res.json()
                except Exception:
                    data = {}
                message = (data.get("error") or {}).get("message") or res.text or ""
                m = re.search(r"Limit\s+(\d+)[^\d]+Requested\s+(\d+)", message, re.I)
                cap = body.get("max_tokens")
                if m and cap is not None and not shrunk:
                    limit, requested = int(m.group(1)), int(m.group(2))
                    prompt_tokens = requested - cap
                    room = limit - prompt_tokens - 100
                    if room >= MIN_OUTPUT:
                        shrunk = True
                        body = {**body, "max_tokens": room}
                        continue
                    raise AiError(
                        f"Groq allows about {limit} tokens per request for this model on your plan, but the "
                        f"prompt alone is ~{prompt_tokens}. Shorten the goal description, or pick a model "
                        "with a larger limit.",
                        "other",
                    )
                raise AiError(
                    f"Groq refused the request as too large for this model or plan"
                    f"{f' ({message[:200]})' if message else ''}. Shorten the goal description, or pick a "
                    "model with a larger request limit.",
                    "other",
                )

            try:
                data = res.json()
            except Exception:
                data = {}
            if res.status_code >= 400:
                detail = (data.get("error") or {}).get("message") or f"HTTP {res.status_code}"
                raise AiError(f"Groq error: {detail}", "other", status=res.status_code)

            choices = data.get("choices") or []
            choice = choices[0] if choices else {}
            content = (choice.get("message") or {}).get("content")
            if choice.get("finish_reason") == "length" and not (allow_truncated and content):
                raise AiError("The response was cut off before it finished.", "malformed")
            if not content:
                raise AiError("Groq returned an empty response.", "malformed")
            return content

    async def _structured_named(self, system: str, user: str, output_format: type[T], name: str, max_tokens: int) -> T:
        json_schema = to_strict_schema(output_format)
        try:
            text = await self._chat({
                "model": self.model,
                "messages": [{"role": "system", "content": system}, {"role": "user", "content": user}],
                "max_tokens": max_tokens,
                "temperature": 0.4,
                "response_format": {"type": "json_schema", "json_schema": {"name": name, "strict": True, "schema": json_schema}},
            })
        except AiError as err:
            if err.kind != "other" or err.status != 400:
                raise
            # This model/plan doesn't support strict mode - fall back to JSON-object mode
            # with the schema spelled out in the prompt; pydantic validation below is what
            # actually guarantees the shape either way.
            text = await self._chat({
                "model": self.model,
                "messages": [
                    {
                        "role": "system",
                        "content": f"{system}\n\nRespond with a single JSON object matching this JSON Schema and nothing else:\n{json.dumps(json_schema)}",
                    },
                    {"role": "user", "content": user},
                ],
                "max_tokens": max_tokens,
                "temperature": 0.4,
                "response_format": {"type": "json_object"},
            })

        try:
            return output_format.model_validate(_extract_json(text))
        except Exception as err:
            raise AiError(f"The model's JSON did not match the expected shape: {err}", "malformed") from err

    # ------------------------------------------------------------------ AiClient protocol

    async def research(self, system: str, user: str) -> str:
        candidates = list(dict.fromkeys([self.research_model, GROQ_RESEARCH_FALLBACK_MODEL, self.model]))
        failures: list[str] = []
        last_kind: AiErrorKind = "other"

        for candidate in candidates:
            searchless = candidate == self.model
            sys_prompt = (
                f"{system}\n\nYou do not have web access for this request. Draw on what you know; only give "
                "a URL when you are confident the page exists at exactly that address, otherwise describe "
                "what to search for instead."
                if searchless
                else system
            )
            try:
                text = await self._chat(
                    {
                        "model": candidate,
                        "messages": [{"role": "system", "content": sys_prompt}, {"role": "user", "content": user}],
                        "max_tokens": MAX_OUTPUT["research"],
                    },
                    allow_truncated=True,
                )
                if not text.strip():
                    raise AiError("The research step returned no findings.", "malformed")
                return (
                    f"(Researched without web search — links come from the model's memory and will be verified.)\n\n{text}"
                    if searchless
                    else text
                )
            except AiError as err:
                if err.kind in ("auth", "rate_limit"):
                    raise
                failures.append(f"{candidate}: {err}")
                last_kind = err.kind

        raise AiError(f"Research failed on every Groq model tried — {' · '.join(failures)}", last_kind)

    async def structured(self, system: str, user: str, output_format: type[T], max_tokens: int = 16000) -> T:
        # Groq's free-tier per-request cap is far below Anthropic's; clamp to what the
        # largest known caller (the goal plan draft) can fit rather than trusting a
        # generic default meant for Anthropic.
        capped = min(max_tokens, MAX_OUTPUT["plan"])
        return await self._structured_named(system, user, output_format, output_format.__name__, capped)

    async def fetch_page(self, url: str) -> FetchedPage:
        try:
            res = await self._http.get(
                url,
                follow_redirects=True,
                headers={"user-agent": "BoslaGoalPlanner/1.0 (link check)", "accept": "text/html,*/*;q=0.5"},
                timeout=10.0,
            )
            if res.status_code >= 400:
                return FetchedPage(ok=False, title=None, excerpt="", error=f"http_{res.status_code}")
            content_type = res.headers.get("content-type", "")
            if not re.search(r"html|text|xml", content_type, re.I):
                return FetchedPage(ok=True, title=None, excerpt="(non-HTML document)", error=None)
            html = res.text[:200_000]
            return FetchedPage(ok=True, title=_title_of(html), excerpt=_text_of(html)[:EXCERPT_CHARS], error=None)
        except httpx.TimeoutException:
            return FetchedPage(ok=False, title=None, excerpt="", error="timeout")
        except Exception:
            return FetchedPage(ok=False, title=None, excerpt="", error="url_not_accessible")

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

            out = await self._structured_named(system, user, RelevanceOutput, "relevance", MAX_OUTPUT["relevance"])
            by_url = {v.url: v.relevant for v in out.verdicts}
            return [by_url.get(p.url, True) for p in pages]
        except AiError as err:
            if err.kind in ("auth", "rate_limit"):
                raise
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
        import openai

        client = openai.AsyncOpenAI(api_key=self.api_key, base_url=BASE)
        try:
            kwargs: dict = dict(
                model=self.model,
                messages=[{"role": "system", "content": system}, *messages],
                stream=True,
                temperature=temperature,
                max_tokens=max_tokens,
            )
            if stop:
                kwargs["stop"] = stop
            stream = await client.chat.completions.create(**kwargs)
            async for chunk in stream:
                delta = chunk.choices[0].delta.content if chunk.choices else None
                if delta:
                    yield delta
        except Exception as err:
            raise _translate_openai(err) from err
