"""Python port of bosla-services/src/goal-planner/groqClient.ts (research/structured/
fetch_page/judge_relevance) plus bosla-services/src/career-discovery/providers/
openaiCompatible.ts (stream_chat) - Groq behind the same `AiClient` protocol (base.py)
the Anthropic backend implements, so goal_planner.py and career_discovery.py never need
to know which provider is configured.

Two differences from Anthropic are absorbed here so the rest of the app never sees them:
 - research uses Groq's `compound` system (server-side search) when the project has it,
   otherwise the plan model with no search at all;
 - there is no web-fetch tool, so link verification is a plain HTTP GET.

Free-tier limits are per model and per organization (keys in one org share them), so on a
429 the client moves straight to the next configured model instead of sleeping on the same one.
"""

from __future__ import annotations

import asyncio
import json
import re
from collections.abc import AsyncGenerator
from typing import TypeVar

import httpx
from pydantic import BaseModel

from .base import AiError, EXCERPT_CHARS, FetchedPage, PageToJudge

BASE = "https://api.groq.com/openai/v1"

GROQ_RESEARCH_MODEL = "groq/compound"
GROQ_DEFAULT_MODEL = "openai/gpt-oss-120b"
GROQ_DEFAULT_FALLBACK_MODELS = ("openai/gpt-oss-20b", "qwen/qwen3.8-27b")

# Groq's free tier caps tokens per request and per minute far below Anthropic's, and a
# request that would exceed the per-request cap is refused outright (413).
MAX_OUTPUT = {"research": 1500, "plan": 4000, "critique": 800, "relevance": 400}
MIN_OUTPUT = 700
# After every model is rate limited, wait once if Groq says capacity returns this soon;
# longer waits would outlast the serverless request, so fail fast with a clear message.
RATE_LIMIT_PATIENCE_S = 8.0

BUSY_MESSAGE = "Bosla's AI is busy right now. Please try again in a minute."
UNAVAILABLE_MESSAGE = "Bosla's AI service is unavailable right now. Please try again later."

# Models this Groq project cannot use (404). Remembered per process so each request does
# not pay for the same failed call again.
_UNAVAILABLE_MODELS: set[str] = set()


def _retry_after_seconds(headers: httpx.Headers | dict | None) -> float | None:
    value = (headers or {}).get("retry-after")
    try:
        return float(value) if value is not None else None
    except ValueError:
        return None


def _rate_limited(retry_after: float | None) -> AiError:
    error = AiError(BUSY_MESSAGE, "rate_limit", status=429)
    error.retry_after = retry_after  # type: ignore[attr-defined]
    return error


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
    if isinstance(err, (openai.AuthenticationError, openai.PermissionDeniedError)):
        return AiError(UNAVAILABLE_MESSAGE, "auth")
    if isinstance(err, openai.RateLimitError):
        return _rate_limited(_retry_after_seconds(err.response.headers if err.response is not None else None))
    if isinstance(err, openai.NotFoundError):
        return AiError(f"Groq model not available: {err.message}", "other", status=404)
    if isinstance(err, openai.APIConnectionError):
        return AiError("Could not reach Groq. Check the connection.", "network")
    if isinstance(err, openai.APIStatusError):
        return AiError(f"Groq error {err.status_code}: {err.message}", "other", status=err.status_code)
    return AiError(str(err), "other")


class GroqAiClient:
    def __init__(
        self, api_keys: list[str], model: str | None = None, fallback_models: list[str] | None = None,
        research_model: str | None = None,
    ):
        self.api_keys = api_keys
        self.model = model or GROQ_DEFAULT_MODEL
        self.fallback_models = list(GROQ_DEFAULT_FALLBACK_MODELS) if fallback_models is None else fallback_models
        self.research_model = research_model or GROQ_RESEARCH_MODEL
        self._http = httpx.AsyncClient(timeout=60.0)

    @staticmethod
    def _reasoning_params(for_model: str) -> dict:
        # Reasoning spends the same output budget as the answer. gpt-oss cannot turn it off,
        # so keep it light and hidden; Qwen 3 answers well without it.
        if re.search(r"gpt-oss", for_model, re.I):
            return {"reasoning_effort": "low", "include_reasoning": False}
        if re.search(r"qwen3", for_model, re.I):
            return {"reasoning_effort": "none"}
        return {}

    def _models(self, first: str, *, fallback: bool = True) -> list[str]:
        chain = [first, *self.fallback_models] if fallback else [first]
        return [model for model in dict.fromkeys(chain) if model not in _UNAVAILABLE_MODELS]

    @staticmethod
    def _patience(failures: list[AiError]) -> float | None:
        """Seconds to wait before one more pass, only when every failure was a short rate limit."""
        if not failures or any(f.kind != "rate_limit" for f in failures):
            return None
        waits = [getattr(f, "retry_after", None) for f in failures]
        if any(w is None for w in waits):
            return None
        wait = min(waits)
        return wait if wait <= RATE_LIMIT_PATIENCE_S else None

    @staticmethod
    def _exhausted(failures: list[AiError]) -> AiError:
        if failures and all(f.kind == "auth" for f in failures):
            return AiError(UNAVAILABLE_MESSAGE, "auth")
        if any(f.kind == "rate_limit" for f in failures):
            return AiError(BUSY_MESSAGE, "rate_limit", status=429)
        return AiError(UNAVAILABLE_MESSAGE, failures[-1].kind if failures else "other")

    async def _chat_for_key(self, api_key: str, request: dict, *, allow_truncated: bool = False) -> str:
        body = {**self._reasoning_params(str(request["model"])), **request}
        shrunk = False

        while True:
            try:
                res = await self._http.post(
                    f"{BASE}/chat/completions",
                    headers={"authorization": f"Bearer {api_key}", "content-type": "application/json"},
                    json=body,
                )
            except httpx.HTTPError as err:
                raise AiError("Could not reach Groq. Check the connection.", "network") from err

            if res.status_code in (401, 403):
                raise AiError(UNAVAILABLE_MESSAGE, "auth")
            if res.status_code == 429:
                # Sleeping here would hold the request on a model whose minute budget is spent;
                # the caller moves on to the next model, which has its own budget.
                raise _rate_limited(_retry_after_seconds(res.headers))
            if res.status_code == 404:
                _UNAVAILABLE_MODELS.add(str(body["model"]))
                raise AiError(f"Groq model not available: {body['model']}", "other", status=404)

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

    @staticmethod
    def _can_fail_over(error: AiError) -> bool:
        return error.kind in {"auth", "rate_limit", "network"} or (error.status is not None and (error.status >= 500 or error.status == 404))

    async def _chat(self, request: dict, *, allow_truncated: bool = False, fallback: bool = True) -> str:
        """Try each model (each has its own rate budget) with each key, then wait once if that is quick."""
        failures: list[AiError] = []
        for attempt in range(2):
            failures = []
            for model in self._models(str(request["model"]), fallback=fallback):
                for api_key in self.api_keys:
                    try:
                        return await self._chat_for_key(api_key, {**request, "model": model}, allow_truncated=allow_truncated)
                    except AiError as error:
                        if not self._can_fail_over(error):
                            raise
                        failures.append(error)
                        if error.status == 404:
                            break  # the model is missing for every key in this project
            wait = self._patience(failures) if attempt == 0 else None
            if wait is None:
                break
            await asyncio.sleep(wait)
        raise self._exhausted(failures)

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
        if self.research_model != self.model and self.research_model not in _UNAVAILABLE_MODELS:
            try:
                text = await self._chat(
                    {
                        "model": self.research_model,
                        "messages": [{"role": "system", "content": system}, {"role": "user", "content": user}],
                        "max_tokens": MAX_OUTPUT["research"],
                    },
                    allow_truncated=True,
                    fallback=False,  # the plain chat models cannot search, so they get the searchless prompt below
                )
                if text.strip():
                    return text
            except AiError as err:
                if err.kind == "auth":
                    raise

        searchless_system = (
            f"{system}\n\nYou do not have web access for this request. Draw on what you know; only give "
            "a URL when you are confident the page exists at exactly that address, otherwise describe "
            "what to search for instead."
        )
        text = await self._chat(
            {
                "model": self.model,
                "messages": [{"role": "system", "content": searchless_system}, {"role": "user", "content": user}],
                "max_tokens": MAX_OUTPUT["research"],
            },
            allow_truncated=True,
        )
        if not text.strip():
            raise AiError("The research step returned no findings.", "malformed")
        return f"(Researched without web search — links come from the model's memory and will be verified.)\n\n{text}"

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

        base: dict = dict(
            messages=[{"role": "system", "content": system}, *messages],
            stream=True,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        if stop:
            # Groq rejects more than 4 stop sequences with a 400; callers still filter the full list client-side.
            base["stop"] = stop[:4]

        failures: list[AiError] = []
        for attempt in range(2):
            failures = []
            for model in self._models(self.model):
                reasoning = self._reasoning_params(model)
                kwargs = {**base, "model": model, **{k: v for k, v in reasoning.items() if k != "include_reasoning"}}
                if "include_reasoning" in reasoning:
                    kwargs["extra_body"] = {"include_reasoning": reasoning["include_reasoning"]}
                for api_key in self.api_keys:
                    # The SDK's own retries would sleep on a spent model; failover is handled here.
                    client = openai.AsyncOpenAI(api_key=api_key, base_url=BASE, max_retries=0)
                    emitted = False
                    try:
                        stream = await client.chat.completions.create(**kwargs)
                        async for chunk in stream:
                            delta = chunk.choices[0].delta.content if chunk.choices else None
                            if delta:
                                emitted = True
                                yield delta
                        return
                    except Exception as err:
                        error = _translate_openai(err)
                        # A retry after output would duplicate a partial reply for the user.
                        if emitted or not self._can_fail_over(error):
                            raise error from err
                        failures.append(error)
                        if error.status == 404:
                            _UNAVAILABLE_MODELS.add(model)
                            break
                    finally:
                        await client.close()
            wait = self._patience(failures) if attempt == 0 else None
            if wait is None:
                break
            await asyncio.sleep(wait)
        raise self._exhausted(failures)
