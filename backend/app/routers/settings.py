from fastapi import APIRouter, Depends

from ..config import get_settings
from ..deps import ai_provider_configured, get_current_user
from ..models import User

router = APIRouter(prefix="/settings", tags=["settings"])


@router.get("/ai-status")
async def ai_status(_: User = Depends(get_current_user)) -> dict:
    settings = get_settings()
    model = settings.groq_model if settings.ai_provider == "groq" else settings.anthropic_model
    return {"provider": settings.ai_provider, "model": model, "configured": ai_provider_configured(settings)}
