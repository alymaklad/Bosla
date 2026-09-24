from fastapi import APIRouter, Depends

from ..config import get_settings
from ..deps import ai_provider_configured, get_current_user
from ..models import User

router = APIRouter(prefix="/settings", tags=["settings"])


@router.get("/ai-status")
async def ai_status(_: User = Depends(get_current_user)) -> dict:
    settings = get_settings()
    model = settings.groq_model if settings.ai_provider == "groq" else settings.anthropic_model
    fallback_models = (
        [item.strip() for item in settings.groq_fallback_models.split(",") if item.strip()]
        or ["llama-3.3-70b-versatile"]
        if settings.ai_provider == "groq"
        else []
    )
    return {
        "provider": settings.ai_provider,
        # Keep `model` for older clients while making the routing roles explicit.
        "model": model,
        "primary_model": model,
        "fallback_models": fallback_models,
        "configured": ai_provider_configured(settings),
    }
