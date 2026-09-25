from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..db import get_db
from ..deps import get_current_user
from ..models import CareerMatch, User
from .habits import progress as habits_progress
from .habits import today_habits, week_habits

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("")
async def get_dashboard(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> dict:
    today = await today_habits(user=user, db=db)
    week = await week_habits(user=user, db=db)
    prog = await habits_progress(user=user, db=db)

    res = await db.execute(select(CareerMatch).where(CareerMatch.user_id == user.id).order_by(CareerMatch.rank).limit(3))
    matches = res.scalars().all()
    chosen = next((m for m in matches if m.chosen), None)
    if chosen is None:
        cres = await db.execute(select(CareerMatch).where(CareerMatch.user_id == user.id, CareerMatch.chosen == True))  # noqa: E712
        chosen = cres.scalar_one_or_none()

    elapsed_week = [o for o in week if o.date <= date.today().isoformat() and o.status != "skipped"]
    scheduled = len(elapsed_week)
    completed = sum(1 for o in elapsed_week if o.status == "complete")
    week_completion_pct = (completed / scheduled * 100) if scheduled else 0

    return {
        "level": prog["level"],
        "streak": prog["streak"],
        "week_completion_pct": week_completion_pct,
        "week_completed": completed,
        "week_scheduled": scheduled,
        "today": [o.model_dump() for o in today],
        "top_matches": [
            {"id": m.id, "rank": m.rank, "title": m.title, "fit_score": m.fit_score, "why": m.why,
             "uncertainty_note": m.uncertainty_note, "salary": m.salary, "remote": m.remote, "demand": m.demand,
             "source": m.source, "as_of": m.as_of, "chosen": m.chosen}
            for m in matches
        ],
        "chosen_direction": chosen.title if chosen else None,
    }
