from fastapi import Cookie, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from .ai.base import AiClient
from .ai.client import AnthropicAiClient
from .ai.groq_client import GroqAiClient
from .config import Settings, get_settings
from .db import get_db
from .models import User


async def get_current_user(
    bosla_user: str | None = Cookie(default=None), db: AsyncSession = Depends(get_db)
) -> User:
    if not bosla_user:
        raise HTTPException(401, "Not signed in")
    user = await db.get(User, bosla_user)
    if user is None:
        raise HTTPException(401, "Not signed in")
    return user


def ai_provider_configured(settings: Settings) -> bool:
    if settings.ai_provider == "groq":
        return bool(settings.groq_api_key)
    return bool(settings.anthropic_api_key)


def get_ai_client() -> AiClient:
    settings = get_settings()
    if settings.ai_provider == "groq":
        if not settings.groq_api_key:
            raise HTTPException(
                503,
                "Groq AI is not configured. Add a valid GROQ_API_KEY in Vercel Environment Variables, then redeploy.",
            )
        return GroqAiClient(api_key=settings.groq_api_key, model=settings.groq_model, research_model=settings.groq_research_model)
    if not settings.anthropic_api_key:
        raise HTTPException(500, "ANTHROPIC_API_KEY is not configured on the server.")
    return AnthropicAiClient(api_key=settings.anthropic_api_key, model=settings.anthropic_model)
