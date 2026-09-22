"""Python port of the Habit Tracking System's pure domain functions
(time/recurrence/scoring/streaks/levels/difficulty). Ported from
bosla-services/src/habit-engine/*.ts, itself a verbatim port of
`src/main/domain/*.ts` in the Habit Tracking System project.

Nothing here touches a clock or a database — every value is a function of
its explicit inputs, so replaying a sync recomputes the same numbers.
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field
from datetime import date, timedelta
from typing import Literal

OccurrenceStatus = Literal["pending", "partial", "complete", "missed", "skipped"]
TimeLogOrigin = Literal["timer", "manual", "assumed"]


# --------------------------------------------------------------------- time

def parse_date(d: str) -> date:
    y, m, dd = (int(x) for x in d.split("-"))
    return date(y, m, dd)


def weekday(d: str) -> int:
    """ISO weekday, Monday = 1 ... Sunday = 7."""
    return parse_date(d).isoweekday()


def add_days(d: str, n: int) -> str:
    return (parse_date(d) + timedelta(days=n)).isoformat()


def diff_days(a: str, b: str) -> int:
    return (parse_date(b) - parse_date(a)).days


def date_range(frm: str, to: str) -> list[str]:
    n = diff_days(frm, to)
    if n < 0:
        return []
    return [add_days(frm, i) for i in range(n + 1)]


def format_duration(minutes: int) -> str:
    h, m = divmod(minutes, 60)
    if h and m:
        return f"{h}h {m}m"
    if h:
        return f"{h}h"
    return f"{m}m"


# ---------------------------------------------------------------- recurrence

@dataclass
class Recurrence:
    kind: Literal["weekly", "everyN"]
    days: list[int] = field(default_factory=list)  # weekly: ISO weekdays 1..7
    n: int = 1  # everyN
    anchor: str | None = None  # everyN: YYYY-MM-DD

    @staticmethod
    def from_dict(raw: dict) -> "Recurrence":
        if raw.get("kind") == "everyN":
            return Recurrence(kind="everyN", n=int(raw.get("n", 1)), anchor=raw.get("anchor"))
        return Recurrence(kind="weekly", days=list(raw.get("days", [])))

    def to_dict(self) -> dict:
        if self.kind == "everyN":
            return {"kind": "everyN", "n": self.n, "anchor": self.anchor}
        return {"kind": "weekly", "days": self.days}


def occurs_on(rec: Recurrence, d: str) -> bool:
    if rec.kind == "weekly":
        return weekday(d) in rec.days
    if rec.n <= 0 or not rec.anchor:
        return False
    delta = diff_days(rec.anchor, d)
    return delta >= 0 and delta % rec.n == 0


def expand(rec: Recurrence, frm: str, to: str) -> list[str]:
    if diff_days(frm, to) < 0:
        return []
    return [d for d in date_range(frm, to) if occurs_on(rec, d)]


def describe_recurrence(rec: Recurrence) -> str:
    if rec.kind == "everyN":
        return "Daily" if rec.n == 1 else f"Every {rec.n} days"
    days = sorted(rec.days)
    day_names = ["", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    if len(days) == 7:
        return "Daily"
    if len(days) == 5 and all(d <= 5 for d in days):
        return "Mon–Fri"
    if days == [6, 7]:
        return "Weekends"
    return "/".join(day_names[d] for d in days)


# ------------------------------------------------------------------ scoring

@dataclass
class ScoringConfig:
    full_completion: float = 2
    partial_completion: float = 1
    skipped: float = 0
    unjustified_skip: float = -1
    beat_weekly_target: float = 5
    worst_day_completion: float = 3
    seven_day_consistency: float = 10
    partial_threshold: float = 0.25


DEFAULT_SCORING = ScoringConfig()


@dataclass
class OccurrenceFacts:
    target_minutes: int
    logged_minutes: float
    completed: bool
    justified_skip: bool
    elapsed: bool
    origin: TimeLogOrigin | None = None


def completion_ratio(f: OccurrenceFacts) -> float:
    if f.target_minutes <= 0:
        return 1.0 if f.completed else 0.0
    return f.logged_minutes / f.target_minutes


def percent(f: OccurrenceFacts) -> int:
    return min(100, round(completion_ratio(f) * 100))


def status_of(f: OccurrenceFacts, cfg: ScoringConfig = DEFAULT_SCORING) -> OccurrenceStatus:
    if f.justified_skip:
        return "skipped"
    ratio = completion_ratio(f)
    if f.completed or ratio >= 1:
        return "complete"
    if ratio >= cfg.partial_threshold:
        return "partial"
    return "missed" if f.elapsed else "pending"


def points_for(status: OccurrenceStatus, cfg: ScoringConfig = DEFAULT_SCORING) -> float:
    return {
        "complete": cfg.full_completion,
        "partial": cfg.partial_completion,
        "skipped": cfg.skipped,
        "missed": cfg.unjustified_skip,
        "pending": 0,
    }[status]


XP_BASE = 12.5
XP_MIN_MINUTES = 15
XP_MAX_MINUTES = 180


def full_xp(target_minutes: int, difficulty_level: int) -> int:
    clamped = min(max(target_minutes, XP_MIN_MINUTES), XP_MAX_MINUTES)
    duration_factor = 0.5 + (clamped / 120) * 0.75
    difficulty_factor = 1 + (max(1, difficulty_level) - 1) * 0.15
    return round(XP_BASE * duration_factor * difficulty_factor)


def xp_for(status: OccurrenceStatus, f: OccurrenceFacts, difficulty_level: int) -> int:
    full = full_xp(f.target_minutes, difficulty_level)
    if status == "complete":
        return full
    if status == "partial":
        return round(full * min(1.0, completion_ratio(f)))
    return 0


def completion_rate(completed: int, scheduled: int) -> float:
    return 0.0 if scheduled == 0 else (completed / scheduled) * 100


# -------------------------------------------------------------------- streaks

@dataclass
class StreakInfo:
    current: int
    longest: int


def compute_streaks(days: list[tuple[str, OccurrenceStatus]]) -> StreakInfo:
    ordered = sorted(days, key=lambda x: x[0])

    longest = 0
    run = 0
    for _, status in ordered:
        if status == "complete":
            run += 1
            longest = max(longest, run)
        elif status in ("skipped", "pending"):
            pass
        else:
            run = 0

    current = 0
    for _, status in reversed(ordered):
        if status in ("pending", "skipped"):
            continue
        if status == "complete":
            current += 1
        else:
            break

    return StreakInfo(current=current, longest=max(longest, current))


# --------------------------------------------------------------------- levels

def level_floor(level: int) -> int:
    n = max(1, math.floor(level))
    return 100 * (n - 1) * (n + 2)


LEVEL_TITLES = [
    "Beginner", "Consistent", "Disciplined", "Focused", "Elite",
    "Relentless", "Formidable", "Unbroken", "Ascendant", "Legend",
]


def level_title(level: int) -> str:
    i = max(1, math.floor(level)) - 1
    return LEVEL_TITLES[min(i, len(LEVEL_TITLES) - 1)]


def level_for_xp(xp: float) -> int:
    total = max(0, math.floor(xp))
    level = 1
    while level_floor(level + 1) <= total:
        level += 1
    return level


@dataclass
class LevelInfo:
    level: int
    title: str
    current_xp: int
    level_floor: int
    level_ceiling: int
    xp_to_next: int
    progress: float


def level_info(xp: float) -> LevelInfo:
    total = max(0, math.floor(xp))
    lvl = level_for_xp(total)
    floor = level_floor(lvl)
    ceiling = level_floor(lvl + 1)
    span = max(1, ceiling - floor)
    return LevelInfo(
        level=lvl,
        title=level_title(lvl),
        current_xp=total,
        level_floor=floor,
        level_ceiling=ceiling,
        xp_to_next=max(0, ceiling - total),
        progress=min(1.0, max(0.0, (total - floor) / span)),
    )


# ----------------------------------------------------------------- difficulty

RAISE_AT = 90
HOLD_AT = 70


def ladder_step(baseline_minutes: int) -> int:
    raw = round((baseline_minutes * 0.2) / 5) * 5
    return min(20, max(5, raw))


def target_for_level(baseline_minutes: int, level: int) -> int:
    n = max(1, math.floor(level))
    return baseline_minutes + (n - 1) * ladder_step(baseline_minutes)


AdjustmentDirection = Literal["raise", "hold", "reduce"]


@dataclass
class Adjustment:
    direction: AdjustmentDirection
    current_level: int
    proposed_level: int
    current_target: int
    proposed_target: int
    rationale: str


def propose_adjustment(
    habit_name: str, baseline_minutes: int, current_level: int, completion_rate_pct: float, scheduled: int
) -> Adjustment:
    current_target = target_for_level(baseline_minutes, current_level)
    rate = round(completion_rate_pct * 10) / 10

    if scheduled < 3:
        return Adjustment(
            "hold", current_level, current_level, current_target, current_target,
            f"Only {scheduled} scheduled {'session' if scheduled == 1 else 'sessions'} this week "
            f"— not enough to judge {habit_name} yet.",
        )

    if completion_rate_pct >= RAISE_AT:
        proposed_level = current_level + 1
        proposed_target = target_for_level(baseline_minutes, proposed_level)
        return Adjustment(
            "raise", current_level, proposed_level, current_target, proposed_target,
            f"{habit_name} ran at {rate}% this week. Raising the target from "
            f"{format_duration(current_target)} to {format_duration(proposed_target)} keeps it challenging.",
        )

    if completion_rate_pct >= HOLD_AT:
        return Adjustment(
            "hold", current_level, current_level, current_target, current_target,
            f"{habit_name} held at {rate}% — inside the {HOLD_AT}–{RAISE_AT - 1}% band, "
            f"so the target stays at {format_duration(current_target)}.",
        )

    proposed_level = max(1, current_level - 1)
    proposed_target = target_for_level(baseline_minutes, proposed_level)
    if proposed_level == current_level:
        return Adjustment(
            "hold", current_level, proposed_level, current_target, proposed_target,
            f"{habit_name} dropped to {rate}%, but it is already at its baseline of "
            f"{format_duration(current_target)}. Consider rescheduling it rather than shortening it further.",
        )

    return Adjustment(
        "reduce", current_level, proposed_level, current_target, proposed_target,
        f"{habit_name} dropped to {rate}%, below the {HOLD_AT}% floor. Easing the target back to "
        f"{format_duration(proposed_target)} until consistency recovers.",
    )
