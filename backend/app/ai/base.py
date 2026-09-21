"""Shared types every AI provider backend implements, so `goal_planner.py` and
`career_discovery.py` work unchanged regardless of which provider is configured.
Mirrors bosla-services' `AiClient` interface (goal-planner/anthropicClient.ts) being
implemented by both anthropicClient.ts and groqClient.ts.
"""

from __future__ import annotations

from collections.abc import AsyncGenerator
from dataclasses import dataclass
from typing import Literal, Protocol, TypeVar, runtime_checkable

from pydantic import BaseModel

EXCERPT_CHARS = 700

AiErrorKind = Literal["auth", "rate_limit", "refusal", "network", "malformed", "other"]

T = TypeVar("T", bound=BaseModel)


class AiError(Exception):
    def __init__(self, message: str, kind: AiErrorKind, status: int | None = None):
        super().__init__(message)
        self.kind = kind
        self.status = status


@dataclass
class FetchedPage:
    ok: bool
    title: str | None
    excerpt: str
    error: str | None


@dataclass
class PageToJudge:
    url: str
    title: str | None
    excerpt: str


@runtime_checkable
class AiClient(Protocol):
    """One shape of call per role — see bosla-services/src/goal-planner/anthropicClient.ts
    for the original interface. `research`/`fetch_page`/`judge_relevance` back the goal
    planner; `stream_chat` backs the career-discovery pipeline's chat turns; `structured`
    backs both."""

    async def research(self, system: str, user: str) -> str: ...

    async def structured(self, system: str, user: str, output_format: type[T], max_tokens: int = 16000) -> T: ...

    async def fetch_page(self, url: str) -> FetchedPage: ...

    async def judge_relevance(self, pages: list[PageToJudge], topic: str) -> list[bool]: ...

    def stream_chat(
        self, system: str, messages: list[dict], *, stop: list[str] | None = None, temperature: float = 0.7, max_tokens: int = 2000
    ) -> AsyncGenerator[str, None]: ...
