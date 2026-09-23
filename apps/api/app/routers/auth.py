import hashlib
import hmac
import secrets
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from fastapi.responses import RedirectResponse
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..db import get_db
from ..config import get_settings
from ..deps import get_current_user
from ..models import Assessment, CareerMatch, CvUpload, DiscoveryMessage, DiscoveryProfile, DocumentChunk, Goal, GoogleIntegration, GoogleSyncLink, Habit, MentorMessage, Occurrence, Roadmap, User, UserDocument
from ..schemas import ConsentRequest, RegisterRequest, SignInRequest, UserOut

router = APIRouter(prefix="/auth", tags=["auth"])
SESSION_AGE = 60 * 60 * 24 * 30


def _hash_password(password: str, salt: str | None = None) -> str:
    """PBKDF2 is stdlib-only and keeps local MVP auth runnable without extra packages."""
    salt = salt or secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 600_000).hex()
    return f"pbkdf2_sha256${salt}${digest}"


def _valid_password(password: str, encoded: str | None) -> bool:
    if not encoded:
        return False
    try:
        _, salt, digest = encoded.split("$", 2)
    except ValueError:
        return False
    return hmac.compare_digest(_hash_password(password, salt), encoded)


def _set_session(response: Response, user: User) -> None:
    response.set_cookie(
        "bosla_user", user.id, httponly=True, samesite=get_settings().session_cookie_samesite,
        secure=get_settings().session_cookie_secure,
        max_age=SESSION_AGE,
    )


@router.post("/register", response_model=UserOut, status_code=201)
async def register(body: RegisterRequest, response: Response, db: AsyncSession = Depends(get_db)) -> User:
    if len(body.password) < 8:
        raise HTTPException(422, "Password must contain at least 8 characters.")
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()
    if user is not None:
        raise HTTPException(409, "An account already exists for this email. Sign in instead.")
    user = User(email=body.email.lower().strip(), name=body.name.strip() or body.email.split("@")[0], password_hash=_hash_password(body.password))
    db.add(user)
    await db.commit()
    await db.refresh(user)
    _set_session(response, user)
    return user


@router.post("/signin", response_model=UserOut)
async def sign_in(body: SignInRequest, response: Response, db: AsyncSession = Depends(get_db)) -> User:
    result = await db.execute(select(User).where(User.email == body.email.lower().strip()))
    user = result.scalar_one_or_none()
    if user is None or user.auth_provider != "password" or not _valid_password(body.password, user.password_hash):
        raise HTTPException(401, "Invalid email or password.")
    _set_session(response, user)
    return user


@router.get("/google/start")
async def google_start() -> RedirectResponse:
    settings = get_settings()
    if not settings.google_client_id or not settings.google_client_secret:
        raise HTTPException(503, "Google sign-in is not configured on this server.")
    state = secrets.token_urlsafe(32)
    query = urlencode({"client_id": settings.google_client_id, "redirect_uri": settings.google_redirect_uri, "response_type": "code", "scope": "openid email profile", "state": state, "access_type": "offline", "prompt": "select_account"})
    response = RedirectResponse(f"https://accounts.google.com/o/oauth2/v2/auth?{query}")
    response.set_cookie("bosla_oauth_state", state, httponly=True, samesite=settings.session_cookie_samesite, secure=settings.session_cookie_secure, max_age=600)
    return response


@router.get("/google/callback")
async def google_callback(code: str, state: str, request: Request, db: AsyncSession = Depends(get_db)) -> RedirectResponse:
    settings = get_settings()
    if not hmac.compare_digest(state, request.cookies.get("bosla_oauth_state", "")):
        raise HTTPException(400, "Invalid Google sign-in state. Please try again.")
    async with httpx.AsyncClient(timeout=15) as client:
        token = await client.post("https://oauth2.googleapis.com/token", data={"code": code, "client_id": settings.google_client_id, "client_secret": settings.google_client_secret, "redirect_uri": settings.google_redirect_uri, "grant_type": "authorization_code"})
        token.raise_for_status()
        profile = await client.get("https://openidconnect.googleapis.com/v1/userinfo", headers={"Authorization": f"Bearer {token.json()['access_token']}"})
        profile.raise_for_status()
    data = profile.json()
    email = str(data.get("email", "")).lower().strip()
    if not email or not data.get("email_verified"):
        raise HTTPException(400, "Google did not provide a verified email address.")
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if user is None:
        user = User(email=email, name=str(data.get("name") or email.split("@")[0]), auth_provider="google")
        db.add(user)
        await db.commit()
        await db.refresh(user)
    destination = "/onboarding/consent" if not user.consent_given else "/dashboard"
    response = RedirectResponse(f"{settings.web_app_url.rstrip('/')}{destination}")
    _set_session(response, user)
    response.delete_cookie("bosla_oauth_state")
    return response


@router.get("/me", response_model=UserOut)
async def me(user: User = Depends(get_current_user)) -> User:
    return user


@router.post("/consent", response_model=UserOut)
async def set_consent(body: ConsentRequest, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> User:
    user.consent_given = body.consent_given
    user.persona = body.persona
    await db.commit()
    await db.refresh(user)
    return user


@router.delete("/account", status_code=204)
async def delete_account(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> Response:
    # Explicit ordering works across SQLite and Postgres without relying on FK cascade settings.
    habit_ids = (await db.execute(select(Habit.id).where(Habit.user_id == user.id))).scalars().all()
    await db.execute(delete(GoogleSyncLink).where(GoogleSyncLink.user_id == user.id))
    await db.execute(delete(GoogleIntegration).where(GoogleIntegration.user_id == user.id))
    await db.execute(delete(DocumentChunk).where(DocumentChunk.user_id == user.id))
    await db.execute(delete(UserDocument).where(UserDocument.user_id == user.id))
    if habit_ids:
        await db.execute(delete(Occurrence).where(Occurrence.habit_id.in_(habit_ids)))
    for model in (CvUpload, DiscoveryMessage, DiscoveryProfile, Assessment, CareerMatch, MentorMessage, Roadmap, Goal, Habit):
        await db.execute(delete(model).where(model.user_id == user.id))
    await db.delete(user)
    await db.commit()
    response = Response(status_code=204)
    response.delete_cookie("bosla_user")
    return response


@router.post("/signout")
async def sign_out(response: Response) -> dict:
    response.delete_cookie("bosla_user")
    return {"ok": True}
