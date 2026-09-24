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
        return bool(_provider_keys(settings.groq_api_key, settings.groq_api_keys))
    return bool(settings.anthropic_api_key)


def _provider_keys(primary: str, backups: str) -> list[str]:
    """Return unique keys in priority order without logging their values."""
    keys = [primary, *(backups.split(",") if backups else [])]
    return list(dict.fromkeys(key.strip() for key in keys if key.strip()))


def get_ai_client() -> AiClient:
    settings = get_settings()
    if settings.ai_provider == "groq":
        api_keys = _provider_keys(settings.groq_api_key, settings.groq_api_keys)
        if not api_keys:
            raise HTTPException(
                503,
                "Credit limit reached. Please try again later.",
            )
        fallback_models = [model.strip() for model in settings.groq_fallback_models.split(",") if model.strip()] or [
            "llama-3.3-70b-versatile"
        ]
        return GroqAiClient(
            api_keys=api_keys,
            model=settings.groq_model,
            fallback_models=fallback_models,
            research_model=settings.groq_research_model,
        )
    if not settings.anthropic_api_key:
        raise HTTPException(503, "Credit limit reached. Please try again later.")
    return AnthropicAiClient(api_key=settings.anthropic_api_key, model=settings.anthropic_model)


def ai_error_message(_: Exception) -> str:
    """Keep provider credentials/details out of user-visible streaming errors."""
    return "AI service is temporarily unavailable or out of credits. Please retry shortly or recharge the configured provider."
