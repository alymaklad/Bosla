import logging
from datetime import date, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .. import habit_engine as he
from ..db import get_db
from ..deps import get_current_user
from ..models import Goal, Habit, Occurrence, Todo, User
from ..schemas import (
    AcceptDifficultyRequest,
    DifficultyProposalOut,
    HabitCreateRequest,
    HabitOut,
    LogOccurrenceRequest,
    OccurrenceOut,
    SkipOccurrenceRequest,
    TodoCompletionRequest,
    TodoCreateRequest,
    TodoOut,
)

router = APIRouter(prefix="/habits", tags=["habits"])


def _todo_out(todo: Todo, day: str) -> TodoOut:
    return TodoOut(
        id=todo.id, title=todo.title, due_date=todo.due_date, completed=todo.completed,
        goal_id=todo.goal_id, occurrence_id=todo.occurrence_id,
        carried_forward=todo.occurrence_id is None and not todo.completed and todo.due_date < day,
    )


@router.post("/todos", response_model=TodoOut)
async def create_todo(
    body: TodoCreateRequest, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
) -> TodoOut:
    goal_id = body.goal_id
    due_date = body.due_date or date.today().isoformat()
    if body.occurrence_id:
        occurrence = await db.get(Occurrence, body.occurrence_id)
        habit = await db.get(Habit, occurrence.habit_id) if occurrence else None
        if habit is None or habit.user_id != user.id:
            raise HTTPException(404, "Habit session not found.")
        due_date = occurrence.date
        goal_id = goal_id or habit.goal_id
    if goal_id:
        goal = await db.get(Goal, goal_id)
        if goal is None or goal.user_id != user.id:
            raise HTTPException(404, "Goal not found.")
    todo = Todo(
        user_id=user.id, goal_id=goal_id, occurrence_id=body.occurrence_id,
        title=body.title, due_date=due_date,
    )
    db.add(todo)
    await db.commit()
    await db.refresh(todo)
    return _todo_out(todo, date.today().isoformat())


@router.get("/todos", response_model=list[TodoOut])
async def list_todos(
    day: str | None = None, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
) -> list[TodoOut]:
    try:
        selected_day = date.fromisoformat(day).isoformat() if day else date.today().isoformat()
    except ValueError as err:
        raise HTTPException(422, "Enter a valid date.") from err
    rows = (await db.execute(
        select(Todo).where(Todo.user_id == user.id, Todo.due_date <= selected_day)
        .order_by(Todo.due_date, Todo.created_at)
    )).scalars().all()
    visible = [
        todo for todo in rows
        if (todo.occurrence_id is not None and todo.due_date == selected_day)
        or (todo.occurrence_id is None and not todo.completed)
        or (todo.occurrence_id is None and todo.completed_at is not None
            and todo.completed_at.date().isoformat() == selected_day)
    ]
    return [_todo_out(todo, selected_day) for todo in visible]


@router.post("/todos/{todo_id}/completion", response_model=TodoOut)
async def set_todo_completion(
    todo_id: str, body: TodoCompletionRequest, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
) -> TodoOut:
    todo = await db.get(Todo, todo_id)
    if todo is None or todo.user_id != user.id:
        raise HTTPException(404, "To-do not found.")
    todo.completed = body.completed
    todo.completed_at = datetime.utcnow() if body.completed else None
    await db.commit()
    await db.refresh(todo)
    return _todo_out(todo, date.today().isoformat())


@router.delete("/todos/{todo_id}", status_code=204)
async def delete_todo(
    todo_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
) -> None:
    todo = await db.get(Todo, todo_id)
    if todo is None or todo.user_id != user.id:
        raise HTTPException(404, "To-do not found.")
    await db.delete(todo)
    await db.commit()


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
    # A habit has no sessions before it existed; otherwise mid-week habits show earlier days as missed.
    if habit.created_at:
        frm = max(frm, habit.created_at.date().isoformat())
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


MAX_REVIEW_WEEKS_BACK = 52


def _judged_rate(occs: list[Occurrence]) -> tuple[int, int]:
    """(completed, judged): sessions still to come and justified skips are not judged."""
    completed = judged = 0
    for o in occs:
        status = he.status_of(_facts(o))
        if status in ("pending", "skipped"):
            continue
        judged += 1
        completed += status == "complete"
    return completed, judged


@router.get("/review", response_model=dict)
async def weekly_review(
    week: int = Query(0, ge=-MAX_REVIEW_WEEKS_BACK, le=0),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    today = date.today().isoformat()
    monday, sunday = _week_bounds(date.today() + timedelta(weeks=week))
    res = await db.execute(select(Habit).where(Habit.user_id == user.id, Habit.archived == False))  # noqa: E712
    habits = res.scalars().all()
    habit_by_id = {h.id: h for h in habits}
    for h in habits:
        await _ensure_occurrences(db, h, monday, min(sunday, today))

    res = await db.execute(select(Occurrence).join(Habit).where(Habit.user_id == user.id, Occurrence.date >= monday, Occurrence.date <= sunday))
    # Older rows may predate their habit; those days were never really scheduled.
    occs = [
        o for o in res.scalars().all()
        if o.habit_id in habit_by_id and o.date >= habit_by_id[o.habit_id].created_at.date().isoformat()
    ]

    days = {
        d: {"date": d, "weekday": he.weekday(d), "logged_minutes": 0.0, "target_minutes": 0, "sessions": 0, "completed": 0, "future": d > today}
        for d in he.date_range(monday, sunday)
    }
    by_habit: dict[str, list[Occurrence]] = {}
    weekday_results: dict[int, list[bool]] = {}
    completed = judged = skipped = upcoming = 0
    total_points = 0.0
    for o in occs:
        status = he.status_of(_facts(o))
        by_habit.setdefault(o.habit_id, []).append(o)
        day = days[o.date]
        day["sessions"] += 1
        day["target_minutes"] += o.target_minutes
        day["logged_minutes"] += o.logged_minutes or 0
        total_points += he.points_for(status)
        if status == "pending":
            upcoming += 1
            continue
        if status == "skipped":
            skipped += 1
            continue
        judged += 1
        if status == "complete":
            completed += 1
            day["completed"] += 1
        weekday_results.setdefault(he.weekday(o.date), []).append(status == "complete")

    worst_weekday = worst_weekday_pct = None
    rates = {wd: sum(results) / len(results) * 100 for wd, results in weekday_results.items()}
    if len(rates) >= 2 and min(rates.values()) < 100:
        worst_weekday = min(rates, key=lambda wd: rates[wd])
        worst_weekday_pct = rates[worst_weekday]

    longest_streak = max(
        (he.compute_streaks([(o.date, he.status_of(_facts(o))) for o in h_occs]).longest for h_occs in by_habit.values()),
        default=0,
    )

    proposals: list[dict] = []
    if week == 0:
        # Only the current week can change a habit's difficulty going forward.
        for h in habits:
            h_completed, h_judged = _judged_rate(by_habit.get(h.id, []))
            if h_judged == 0:
                continue
            rate = he.completion_rate(h_completed, h_judged)
            adj = he.propose_adjustment(h.name, h.baseline_minutes, h.difficulty_level, rate, h_judged)
            proposals.append({
                **DifficultyProposalOut(
                    habit_id=h.id, habit_name=h.name, direction=adj.direction, current_level=adj.current_level,
                    proposed_level=adj.proposed_level, current_target=adj.current_target,
                    proposed_target=adj.proposed_target, rationale=adj.rationale,
                ).model_dump(),
                "completion_pct": rate,
            })

    logged_minutes = sum(day["logged_minutes"] for day in days.values())
    return {
        "week_offset": week,
        "week_start": monday,
        "week_end": sunday,
        "completion_pct": he.completion_rate(completed, judged),
        "completed": completed,
        "scheduled": judged,
        "skipped": skipped,
        "upcoming": upcoming,
        "total_points": total_points,
        "logged_minutes": logged_minutes,
        "active_days": sum(1 for day in days.values() if day["logged_minutes"] > 0 or day["completed"] > 0),
        "longest_streak": longest_streak,
        "worst_weekday": worst_weekday,
        "worst_weekday_pct": worst_weekday_pct,
        "days": list(days.values()),
        "proposals": proposals,
    }


@router.post("/review/accept", response_model=HabitOut)
async def accept_difficulty(body: AcceptDifficultyRequest, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> Habit:
    habit = await db.get(Habit, body.habit_id)
    if habit is None or habit.user_id != user.id:
        raise HTTPException(404, "Habit not found")
    if body.accept:
        monday, sunday = _week_bounds(date.today())
        res = await db.execute(select(Occurrence).where(Occurrence.habit_id == habit.id, Occurrence.date >= monday, Occurrence.date <= sunday))
        completed, judged = _judged_rate(list(res.scalars().all()))
        rate = he.completion_rate(completed, judged)
        adj = he.propose_adjustment(habit.name, habit.baseline_minutes, habit.difficulty_level, rate, judged)
        habit.difficulty_level = adj.proposed_level
    await db.commit()
    await db.refresh(habit)
    return habit


# A day's worst outcome decides it: one miss breaks the streak, unfinished-today and skip-only days are neutral.
_DAY_PRIORITY = ("missed", "partial", "pending", "complete", "skipped")


def _day_statuses(statuses_by_day: dict[str, list[str]]) -> list[tuple[str, str]]:
    return [
        (day, next(s for s in _DAY_PRIORITY if s in statuses))
        for day, statuses in statuses_by_day.items()
    ]


@router.get("/progress", response_model=dict)
async def progress(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> dict:
    today = date.today().isoformat()
    res = await db.execute(select(Habit).where(Habit.user_id == user.id))
    habits = res.scalars().all()
    by_id = {h.id: h for h in habits}

    res = await db.execute(select(Occurrence).join(Habit).where(Habit.user_id == user.id, Occurrence.date <= today))
    occs = res.scalars().all()

    total_xp = 0
    completed_count = 0
    logged_minutes = 0.0
    morning_completed = 0
    today_due = today_completed = 0
    statuses_by_day: dict[str, list[str]] = {}
    for o in occs:
        habit = by_id.get(o.habit_id)
        # Older rows may predate their habit; those days were never really scheduled.
        if habit is None or o.date < habit.created_at.date().isoformat():
            continue
        facts = _facts(o)
        status = he.status_of(facts)
        total_xp += he.xp_for(status, facts, habit.difficulty_level)
        if status == "complete":
            completed_count += 1
            logged_minutes += o.logged_minutes or o.target_minutes
            if habit.scheduled_time < "09:00":
                morning_completed += 1
        elif status == "partial":
            logged_minutes += o.logged_minutes or 0
        if o.date == today and status != "skipped":
            today_due += 1
            today_completed += status == "complete"
        statuses_by_day.setdefault(o.date, []).append(status)

    streak = he.compute_streaks(_day_statuses(statuses_by_day))
    info = he.level_info(total_xp)
    return {
        "level": {
            "level": info.level, "title": info.title, "next_title": he.level_title(info.level + 1),
            "current_xp": info.current_xp, "level_floor": info.level_floor,
            "level_ceiling": info.level_ceiling, "xp_to_next": info.xp_to_next, "progress": info.progress,
        },
        "streak": {"current": streak.current, "longest": streak.longest},
        "total_xp": total_xp,
        "stats": {
            "completed_occurrences": completed_count,
            "logged_minutes": logged_minutes,
            "morning_completed": morning_completed,
            "active_habits": len([habit for habit in habits if not habit.archived]),
            "today_due": today_due,
            "today_completed": today_completed,
        },
    }
