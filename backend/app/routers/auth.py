from fastapi import APIRouter, Depends, Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..db import get_db
from ..deps import get_current_user
from ..models import User
from ..schemas import ConsentRequest, SignInRequest, UserOut

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signin", response_model=UserOut)
async def sign_in(body: SignInRequest, response: Response, db: AsyncSession = Depends(get_db)) -> User:
    """Demo auth: looks a user up by email, creating one on first sign-in. No password
    check - this app authenticates locally for demo purposes, matching the scope the
    Stitch UI's sign-in screen is wired for."""
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()
    if user is None:
        user = User(email=body.email, name=body.name or body.email.split("@")[0])
        db.add(user)
        await db.commit()
        await db.refresh(user)
    response.set_cookie("bosla_user", user.id, httponly=True, samesite="lax", max_age=60 * 60 * 24 * 30)
    return user


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


@router.post("/signout")
async def sign_out(response: Response) -> dict:
    response.delete_cookie("bosla_user")
    return {"ok": True}
