import logging
from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .. import habit_engine as he
from ..db import get_db
from ..deps import get_current_user
from ..models import Goal, Habit, Occurrence, User
from ..schemas import (
    AcceptDifficultyRequest,
    DifficultyProposalOut,
    HabitCreateRequest,
    HabitOut,
    LogOccurrenceRequest,
    OccurrenceOut,
    SkipOccurrenceRequest,
)

router = APIRouter(prefix="/habits", tags=["habits"])


def _facts(o: Occurrence) -> he.OccurrenceFacts:
    elapsed = o.date < date.today().isoformat()
    return he.OccurrenceFacts(
        target_minutes=o.target_minutes, logged_minutes=o.logged_minutes, completed=o.completed,
        justified_skip=o.justified_skip, elapsed=elapsed, origin=o.origin,
    )


def _occurrence_out(o: Occurrence, habit_name: str, difficulty_level: int) -> OccurrenceOut:
    facts = _facts(o)
    status = he.status_of(facts)
    return OccurrenceOut(
        id=o.id, habit_id=o.habit_id, habit_name=habit_name, date=o.date, target_minutes=o.target_minutes,
        logged_minutes=o.logged_minutes, completed=o.completed, justified_skip=o.justified_skip,
        skip_reason=o.skip_reason, origin=o.origin, status=status, percent=he.percent(facts),
        points=he.points_for(status), xp=he.xp_for(status, facts, difficulty_level),
    )


async def _ensure_occurrences(db: AsyncSession, habit: Habit, frm: str, to: str) -> None:
    try:
        rec = he.Recurrence.from_dict(habit.recurrence)
    except (TypeError, ValueError):
        # A legacy malformed row must not take down the full dashboard.
        return
    scheduled_dates = he.expand(rec, frm, to)
    if not scheduled_dates:
        return
    res = await db.execute(select(Occurrence.date).where(Occurrence.habit_id == habit.id, Occurrence.date.in_(scheduled_dates)))
    existing = {row[0] for row in res.all()}
    target = he.target_for_level(habit.baseline_minutes, habit.difficulty_level)
    for d in scheduled_dates:
        if d not in existing:
            db.add(Occurrence(habit_id=habit.id, date=d, target_minutes=target))
    await db.commit()


def _week_bounds(today: date) -> tuple[str, str]:
    monday = today - timedelta(days=today.isoweekday() - 1)
    sunday = monday + timedelta(days=6)
    return monday.isoformat(), sunday.isoformat()


@router.post("", response_model=HabitOut)
async def create_habit(body: HabitCreateRequest, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> Habit:
    if body.goal_id:
        goal = await db.get(Goal, body.goal_id)
        if goal is None or goal.user_id != user.id:
            raise HTTPException(404, "Goal not found")
    habit = Habit(
        user_id=user.id, name=body.name, recurrence=body.recurrence.model_dump(), scheduled_time=body.scheduled_time,
        baseline_minutes=body.baseline_minutes, goal_id=body.goal_id,
    )
    db.add(habit)
    await db.commit()
    await db.refresh(habit)
    return habit


@router.get("", response_model=list[HabitOut])
async def list_habits(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> list[Habit]:
    res = await db.execute(select(Habit).where(Habit.user_id == user.id, Habit.archived == False).order_by(Habit.created_at))  # noqa: E712
    return list(res.scalars().all())


@router.get("/today", response_model=list[OccurrenceOut])
async def today_habits(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> list[OccurrenceOut]:
    today = date.today().isoformat()
    res = await db.execute(select(Habit).where(Habit.user_id == user.id, Habit.archived == False))
    habits = res.scalars().all()
    for h in habits:
        await _ensure_occurrences(db, h, today, today)

    res = await db.execute(select(Occurrence).join(Habit).where(Habit.user_id == user.id, Occurrence.date == today))
    occs = res.scalars().all()
    by_id = {h.id: h for h in habits}
    return [_occurrence_out(o, by_id[o.habit_id].name, by_id[o.habit_id].difficulty_level) for o in occs]


@router.get("/week", response_model=list[OccurrenceOut])
async def week_habits(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> list[OccurrenceOut]:
    monday, sunday = _week_bounds(date.today())
    today = date.today().isoformat()
    res = await db.execute(select(Habit).where(Habit.user_id == user.id, Habit.archived == False))
    habits = res.scalars().all()
    for h in habits:
        await _ensure_occurrences(db, h, monday, min(sunday, today))

    res = await db.execute(select(Occurrence).join(Habit).where(Habit.user_id == user.id, Occurrence.date >= monday, Occurrence.date <= sunday))
    occs = res.scalars().all()
    by_id = {h.id: h for h in habits}
    return [_occurrence_out(o, by_id[o.habit_id].name, by_id[o.habit_id].difficulty_level) for o in occs]


@router.post("/occurrences/{occurrence_id}/log", response_model=OccurrenceOut)
async def log_occurrence(occurrence_id: str, body: LogOccurrenceRequest, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> OccurrenceOut:
    occ = await db.get(Occurrence, occurrence_id)
    if occ is None:
        raise HTTPException(404, "Occurrence not found")
    habit = await db.get(Habit, occ.habit_id)
    if habit is None or habit.user_id != user.id:
        raise HTTPException(404, "Occurrence not found")

    if body.minutes is not None:
        occ.logged_minutes = body.minutes
        occ.origin = body.origin or "manual"
    if body.completed is not None:
        occ.completed = body.completed
        if body.completed and occ.logged_minutes == 0:
            # A tick with no timer run is credited at target and badged ASSUMED - honest-effort rule.
            occ.logged_minutes = occ.target_minutes
            occ.origin = "assumed"
        elif not body.completed and body.minutes is None:
            # Unticking is a true reversion, not just a cosmetic boolean flip.
            occ.logged_minutes = 0
            occ.origin = None
    occ.justified_skip = False
    occ.skip_reason = None
    await db.commit()
    await db.refresh(occ)
    result = _occurrence_out(occ, habit.name, habit.difficulty_level)
    if body.completed is not None:
        from .google_sync import push_occurrence_completion  # google_sync imports this module

        try:
            await push_occurrence_completion(db, user.id, occ)
        except Exception as err:  # noqa: BLE001 - the tick is saved; the next Google pull reconciles it.
            await db.rollback()
            logging.getLogger(__name__).warning("google_push_failed: %s", type(err).__name__)
    return result


@router.post("/occurrences/{occurrence_id}/skip", response_model=OccurrenceOut)
async def skip_occurrence(occurrence_id: str, body: SkipOccurrenceRequest, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> OccurrenceOut:
    occ = await db.get(Occurrence, occurrence_id)
    if occ is None:
        raise HTTPException(404, "Occurrence not found")
    habit = await db.get(Habit, occ.habit_id)
    if habit is None or habit.user_id != user.id:
        raise HTTPException(404, "Occurrence not found")
    if not body.reason.strip():
        raise HTTPException(400, "A skip reason is required.")

    occ.justified_skip = True
    occ.skip_reason = body.reason.strip()
    await db.commit()
    await db.refresh(occ)
    return _occurrence_out(occ, habit.name, habit.difficulty_level)


@router.get("/review", response_model=dict)
async def weekly_review(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> dict:
    monday, sunday = _week_bounds(date.today())
    today = date.today().isoformat()
    res = await db.execute(select(Habit).where(Habit.user_id == user.id, Habit.archived == False))
    habits = res.scalars().all()
    for h in habits:
        await _ensure_occurrences(db, h, monday, min(sunday, today))

    res = await db.execute(select(Occurrence).join(Habit).where(Habit.user_id == user.id, Occurrence.date >= monday, Occurrence.date <= sunday))
    occs = res.scalars().all()

    by_habit: dict[str, list[Occurrence]] = {}
    for o in occs:
        by_habit.setdefault(o.habit_id, []).append(o)

    total_scheduled = len(occs)
    total_completed = 0
    total_points = 0.0
    weekday_completion: dict[int, list[bool]] = {}
    proposals: list[DifficultyProposalOut] = []

    for h in habits:
        h_occs = by_habit.get(h.id, [])
        completed = 0
        for o in h_occs:
            facts = _facts(o)
            status = he.status_of(facts)
            total_points += he.points_for(status)
            if status == "complete":
                completed += 1
                total_completed += 1
            wd = he.weekday(o.date)
            weekday_completion.setdefault(wd, []).append(status == "complete")

        if h_occs:
            rate = he.completion_rate(completed, len(h_occs))
            adj = he.propose_adjustment(h.name, h.baseline_minutes, h.difficulty_level, rate, len(h_occs))
            if adj.direction != "hold":
                proposals.append(DifficultyProposalOut(
                    habit_id=h.id, habit_name=h.name, direction=adj.direction, current_level=adj.current_level,
                    proposed_level=adj.proposed_level, current_target=adj.current_target,
                    proposed_target=adj.proposed_target, rationale=adj.rationale,
                ))

    worst_day = None
    if weekday_completion:
        rates = {wd: sum(v) / len(v) for wd, v in weekday_completion.items()}
        worst_day = min(rates, key=lambda k: rates[k])

    return {
        "completion_pct": he.completion_rate(total_completed, total_scheduled),
        "total_points": total_points,
        "scheduled": total_scheduled,
        "completed": total_completed,
        "worst_weekday": worst_day,
        "proposals": [p.model_dump() for p in proposals],
    }


@router.post("/review/accept", response_model=HabitOut)
async def accept_difficulty(body: AcceptDifficultyRequest, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> Habit:
    habit = await db.get(Habit, body.habit_id)
    if habit is None or habit.user_id != user.id:
        raise HTTPException(404, "Habit not found")
    if body.accept:
        monday, sunday = _week_bounds(date.today())
        today = date.today().isoformat()
        res = await db.execute(select(Occurrence).where(Occurrence.habit_id == habit.id, Occurrence.date >= monday, Occurrence.date <= min(sunday, today)))
        occs = res.scalars().all()
        completed = sum(1 for o in occs if he.status_of(_facts(o)) == "complete")
        rate = he.completion_rate(completed, len(occs)) if occs else 0
        adj = he.propose_adjustment(habit.name, habit.baseline_minutes, habit.difficulty_level, rate, len(occs))
        habit.difficulty_level = adj.proposed_level
    await db.commit()
    await db.refresh(habit)
    return habit


@router.get("/progress", response_model=dict)
async def progress(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> dict:
    res = await db.execute(select(Habit).where(Habit.user_id == user.id))
    habits = res.scalars().all()
    by_id = {h.id: h for h in habits}

    res = await db.execute(select(Occurrence).join(Habit).where(Habit.user_id == user.id, Occurrence.date <= date.today().isoformat()))
    occs = res.scalars().all()

    total_xp = 0
    completed_count = 0
    logged_minutes = 0
    morning_completed = 0
    streak_days: dict[str, list[tuple[str, str]]] = {}
    for o in occs:
        habit = by_id.get(o.habit_id)
        if habit is None:
            continue
        facts = _facts(o)
        status = he.status_of(facts)
        total_xp += he.xp_for(status, facts, habit.difficulty_level)
        if status == "complete":
            completed_count += 1
            logged_minutes += o.logged_minutes or o.target_minutes
            if habit.scheduled_time < "09:00":
                morning_completed += 1
        streak_days.setdefault(o.habit_id, []).append((o.date, status))

    best_streak = he.StreakInfo(current=0, longest=0)
    for habit_id, days in streak_days.items():
        s = he.compute_streaks(days)
        if s.longest > best_streak.longest:
            best_streak = s

    info = he.level_info(total_xp)
    return {
        "level": {
            "level": info.level, "title": info.title, "current_xp": info.current_xp, "level_floor": info.level_floor,
            "level_ceiling": info.level_ceiling, "xp_to_next": info.xp_to_next, "progress": info.progress,
        },
        "streak": {"current": best_streak.current, "longest": best_streak.longest},
        "total_xp": total_xp,
        "stats": {
            "completed_occurrences": completed_count,
            "logged_minutes": logged_minutes,
            "morning_completed": morning_completed,
            "active_habits": len([habit for habit in habits if not habit.archived]),
        },
    }
