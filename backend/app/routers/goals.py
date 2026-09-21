import json
from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..ai import goal_planner as gp
from ..ai.base import AiClient
from ..config import get_settings
from ..db import get_db
from ..deps import get_ai_client, get_current_user
from ..habit_engine import Recurrence, expand, target_for_level
from ..models import Goal, Habit, User
from ..schemas import CommitGoalRequest, GoalDraftRequest, GoalOut

router = APIRouter(prefix="/goals", tags=["goals"])


def _sse(event: str, data: dict) -> bytes:
    return f"event: {event}\ndata: {json.dumps(data)}\n\n".encode()


async def _planning_context(db: AsyncSession, user_id: str) -> gp.PlanningContext:
    res = await db.execute(select(Habit).where(Habit.user_id == user_id, Habit.archived == False))  # noqa: E712
    habits = res.scalars().all()

    today = date.today().isoformat()
    occupied: list[gp.OccupiedBlock] = []
    committed = 0
    for h in habits:
        rec = Recurrence.from_dict(h.recurrence)
        if rec.kind != "weekly":
            continue
        target = target_for_level(h.baseline_minutes, h.difficulty_level)
        start = gp.to_minutes(h.scheduled_time)
        occupied.append(gp.OccupiedBlock(name=h.name, days=rec.days, start=start, end=start + target))
        committed += len(rec.days) * target

    return gp.PlanningContext(today=today, timezone="UTC", occupied=occupied, committed_minutes_per_week=committed)


@router.post("/plan")
async def plan_goal_endpoint(
    body: GoalDraftRequest, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db), ai: AiClient = Depends(get_ai_client)
) -> StreamingResponse:
    settings = get_settings()
    title = body.title if not body.roadmap_step_title else f"{body.roadmap_step_title}: {body.title}"
    inp = gp.GoalDraftInput(
        title=title, description=body.description, target_date=body.target_date, weekly_minutes_budget=body.weekly_minutes_budget
    )
    ctx = await _planning_context(db, user.id)

    async def gen():
        try:
            async for event in gp.plan_goal(
                ai, inp, ctx, max_iterations=settings.goal_planner_max_iterations, verify_links=settings.goal_planner_verify_links
            ):
                if isinstance(event, gp.GoalPlanProgress):
                    yield _sse("progress", {"phase": event.phase, "iteration": event.iteration, "maxIterations": event.max_iterations})
                else:
                    goal = Goal(
                        user_id=user.id, title=inp.title, description=inp.description, target_date=inp.target_date,
                        weekly_minutes_budget=inp.weekly_minutes_budget, plan=event.plan.to_dict(),
                        iterations=event.iterations, warnings=event.warnings,
                    )
                    db.add(goal)
                    await db.commit()
                    await db.refresh(goal)
                    yield _sse("done", {
                        "id": goal.id, "plan": goal.plan, "iterations": goal.iterations, "warnings": goal.warnings,
                    })
        except Exception as err:  # noqa: BLE001
            yield _sse("error", {"message": str(err)})

    return StreamingResponse(gen(), media_type="text/event-stream")


@router.get("", response_model=list[GoalOut])
async def list_goals(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> list[Goal]:
    res = await db.execute(select(Goal).where(Goal.user_id == user.id).order_by(Goal.created_at.desc()))
    return list(res.scalars().all())


@router.get("/{goal_id}", response_model=GoalOut)
async def get_goal(goal_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> Goal:
    goal = await db.get(Goal, goal_id)
    if goal is None or goal.user_id != user.id:
        raise HTTPException(404, "Goal not found")
    return goal


@router.post("/commit", response_model=list[dict])
async def commit_goal(body: CommitGoalRequest, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> list[dict]:
    """Turns a goal plan's sessions into real recurring Habit rows - the wizard's
    'Add to my week' confirmation step."""
    goal = await db.get(Goal, body.goal_id)
    if goal is None or goal.user_id != user.id:
        raise HTTPException(404, "Goal not found")

    created = []
    for s in goal.plan.get("sessions", []):
        habit = Habit(
            user_id=user.id, goal_id=goal.id, name=s["name"],
            recurrence={"kind": "weekly", "days": s["days"]},
            scheduled_time=s["scheduledTime"], baseline_minutes=s["targetMinutes"], difficulty_level=1,
        )
        db.add(habit)
        created.append(habit)
    await db.commit()
    for h in created:
        await db.refresh(h)
    return [{"id": h.id, "name": h.name, "recurrence": h.recurrence, "scheduled_time": h.scheduled_time, "baseline_minutes": h.baseline_minutes} for h in created]
