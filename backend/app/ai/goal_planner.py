"""Python port of bosla-services/src/goal-planner/* (goalPlanSchema, promptBuilder,
scheduleConflicts, intervenor, goalPlanner) - itself a verbatim port of the Habit
Tracking System's Actor + Intervenor + bounded-Reflexion goal planner.

    research -> finalize -> review -+- pass -> done
                                     +- fail -> finalize again with feedback, up to the cap
"""

from __future__ import annotations

import re
from collections.abc import AsyncGenerator
from dataclasses import dataclass

from pydantic import BaseModel

from .base import AiClient, PageToJudge

DEFAULT_MAX_ITERATIONS = 3
MAX_FINDINGS_CHARS = 6000

DAY = ["", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
TIME_RE = re.compile(r"^([01]\d|2[0-3]):[0-5]\d$")
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


# --------------------------------------------------------------- structured output

class GoalSessionOut(BaseModel):
    name: str
    days: list[int]
    scheduledTime: str
    targetMinutes: int
    rationale: str | None = None


class GoalMilestoneOut(BaseModel):
    title: str
    dueDate: str
    description: str | None = None


class MindMapNodeOut(BaseModel):
    id: str
    parentId: str | None
    title: str


class GoalResourceOut(BaseModel):
    title: str
    type: str
    note: str
    url: str | None = None


class GoalPlanOut(BaseModel):
    summary: str
    sessions: list[GoalSessionOut]
    milestones: list[GoalMilestoneOut]
    mindMap: list[MindMapNodeOut]
    resources: list[GoalResourceOut]


class CritiqueOut(BaseModel):
    verdict: str  # "pass" | "fail"
    feedback: list[str]


class RelevanceVerdict(BaseModel):
    url: str
    relevant: bool


class RelevanceOutput(BaseModel):
    verdicts: list[RelevanceVerdict]


# ------------------------------------------------------------------- plan shape

@dataclass
class GoalSession:
    name: str
    days: list[int]
    scheduled_time: str
    target_minutes: int
    rationale: str | None

    def to_dict(self) -> dict:
        return {
            "name": self.name, "days": self.days, "scheduledTime": self.scheduled_time,
            "targetMinutes": self.target_minutes, "rationale": self.rationale,
        }


@dataclass
class GoalMilestone:
    title: str
    due_date: str
    description: str | None

    def to_dict(self) -> dict:
        return {"title": self.title, "dueDate": self.due_date, "description": self.description}


@dataclass
class GoalPlan:
    summary: str
    sessions: list[GoalSession]
    milestones: list[GoalMilestone]
    mind_map: list[dict]
    resources: list[dict]

    def to_dict(self) -> dict:
        return {
            "summary": self.summary,
            "sessions": [s.to_dict() for s in self.sessions],
            "milestones": [m.to_dict() for m in self.milestones],
            "mindMap": self.mind_map,
            "resources": self.resources,
        }


class PlanShapeError(Exception):
    def __init__(self, problems: list[str]):
        super().__init__(f"The drafted plan is not usable: {'; '.join(problems)}")
        self.problems = problems


def normalise_plan(raw: GoalPlanOut) -> GoalPlan:
    problems: list[str] = []

    sessions: list[GoalSession] = []
    for i, s in enumerate(raw.sessions):
        days = sorted({d for d in s.days if 1 <= d <= 7})
        if not days:
            problems.append(f'session {i + 1} ("{s.name}") has no valid weekdays')
        if not TIME_RE.match(s.scheduledTime):
            problems.append(f'session {i + 1} ("{s.name}") has time "{s.scheduledTime}", expected HH:MM')
        if s.targetMinutes < 5:
            problems.append(f'session {i + 1} ("{s.name}") is under 5 minutes')
        if not s.name.strip():
            problems.append(f"session {i + 1} has no name")
        sessions.append(GoalSession(
            name=s.name.strip(), days=days, scheduled_time=s.scheduledTime,
            target_minutes=round(s.targetMinutes), rationale=(s.rationale or "").strip() or None,
        ))

    milestones: list[GoalMilestone] = []
    for i, m in enumerate(raw.milestones):
        if not DATE_RE.match(m.dueDate):
            problems.append(f'milestone {i + 1} ("{m.title}") has date "{m.dueDate}", expected YYYY-MM-DD')
        if not m.title.strip():
            problems.append(f"milestone {i + 1} has no title")
        milestones.append(GoalMilestone(
            title=m.title.strip(), due_date=m.dueDate, description=(m.description or "").strip() or None,
        ))

    ids = {n.id for n in raw.mindMap}
    roots = sum(1 for n in raw.mindMap if n.parentId is None)
    if raw.mindMap and roots != 1:
        problems.append(f"mind map must have exactly one root, found {roots}")
    for n in raw.mindMap:
        if n.parentId is not None and n.parentId not in ids:
            problems.append(f'mind map node "{n.title}" points at a missing parent')

    resources = []
    for r in raw.resources:
        url = r.url.strip() if r.url and re.match(r"^https?://", r.url, re.I) else None
        resources.append({"title": r.title.strip(), "type": r.type.strip() or "resource", "note": r.note.strip(), "url": url})

    if not sessions:
        problems.append("the plan has no practice sessions")

    if problems:
        raise PlanShapeError(problems)

    return GoalPlan(
        summary=raw.summary.strip(), sessions=sessions, milestones=milestones,
        mind_map=[n.model_dump() for n in raw.mindMap], resources=resources,
    )


# ------------------------------------------------------------- schedule conflicts

@dataclass
class OccupiedBlock:
    name: str
    days: list[int]
    start: int
    end: int


@dataclass
class Conflict:
    session: str
    against: str
    days: list[int]
    session_range: str
    against_range: str


def to_minutes(t: str) -> int:
    h, m = t.split(":")
    return int(h) * 60 + int(m)


def _fmt(minutes: int) -> str:
    m = ((minutes % 1440) + 1440) % 1440
    return f"{m // 60:02d}:{m % 60:02d}"


def _overlaps(a_start: int, a_end: int, b_start: int, b_end: int) -> bool:
    return a_start < b_end and b_start < a_end


def find_schedule_conflicts(sessions: list[GoalSession], occupied: list[OccupiedBlock]) -> list[Conflict]:
    out: list[Conflict] = []
    for s in sessions:
        start = to_minutes(s.scheduled_time)
        end = start + s.target_minutes
        for block in occupied:
            days = [d for d in s.days if d in block.days and _overlaps(start, end, block.start, block.end)]
            if not days:
                continue
            out.append(Conflict(s.name, block.name, days, f"{_fmt(start)}–{_fmt(end)}", f"{_fmt(block.start)}–{_fmt(block.end)}"))
    return out


def find_internal_conflicts(sessions: list[GoalSession]) -> list[Conflict]:
    blocks = [OccupiedBlock(s.name, s.days, to_minutes(s.scheduled_time), to_minutes(s.scheduled_time) + s.target_minutes) for s in sessions]
    out: list[Conflict] = []
    for i in range(len(sessions)):
        for j in range(i + 1, len(sessions)):
            out.extend(find_schedule_conflicts([sessions[i]], [blocks[j]]))
    return out


def describe_conflict(c: Conflict) -> str:
    days = "/".join(DAY[d] for d in c.days)
    return f'"{c.session}" ({c.session_range}) overlaps "{c.against}" ({c.against_range}) on {days}'


def weekly_minutes(sessions: list[GoalSession]) -> int:
    return sum(len(s.days) * s.target_minutes for s in sessions)


# ------------------------------------------------------------------ prompt building

@dataclass
class GoalDraftInput:
    title: str
    description: str | None
    target_date: str | None
    weekly_minutes_budget: int | None


@dataclass
class PlanningContext:
    today: str
    timezone: str
    occupied: list[OccupiedBlock]
    committed_minutes_per_week: int


def _hours(minutes: int) -> str:
    h, m = divmod(minutes, 60)
    return f"{h}h {m}m" if m else f"{h}h"


def render_context(inp: GoalDraftInput, ctx: PlanningContext) -> str:
    lines = [f"Today is {ctx.today} (timezone {ctx.timezone})."]
    if inp.target_date:
        lines.append(f"The user wants to reach this goal by {inp.target_date}.")
    if inp.weekly_minutes_budget:
        lines.append(f"They can give it about {_hours(inp.weekly_minutes_budget)} per week in total.")
    lines.append(
        f"They already spend {_hours(ctx.committed_minutes_per_week)} per week on existing habits. "
        "Do not schedule anything inside these occupied blocks:"
    )
    if not ctx.occupied:
        lines.append("  (none — their calendar is open)")
    for b in ctx.occupied:
        lines.append(f"  - {b.name}: {'/'.join(DAY[d] for d in b.days)} {_fmt(b.start)}–{_fmt(b.end)}")
    return "\n".join(lines)


def research_prompt(inp: GoalDraftInput, ctx: PlanningContext) -> tuple[str, str]:
    system = (
        "You are a learning-and-habit coach helping someone turn a goal into a concrete weekly routine. "
        "This is the research step. Use web search to find current, reputable resources (courses, books, "
        "practice sites, communities) and realistic pacing guidance for the goal. Prefer well-known, "
        "stable sources. For each resource you intend to recommend, note its exact URL as it appeared "
        "in the search results — a later step will verify each link, and a wrong URL will be discarded. "
        "Finish with a concise summary of what you found — under 500 words: up to six recommended "
        "resources with their URLs, a realistic sense of how long the goal takes at the stated weekly "
        "time budget, and the main sub-topics. Do not produce the final plan yet."
    )
    user_lines = [f"Goal: {inp.title}"]
    if inp.description:
        user_lines.append(f"Context from the user: {inp.description}")
    user_lines += ["", render_context(inp, ctx)]
    return system, "\n".join(user_lines)


def finalize_prompt(inp: GoalDraftInput, ctx: PlanningContext, findings: str, feedback: list[str]) -> tuple[str, str]:
    rules = [
        "Produce the plan as structured data. Rules:",
        "- sessions: recurring practice blocks. `days` are ISO weekdays (1 = Monday … 7 = Sunday).",
        "  `scheduledTime` is HH:MM 24-hour. Sessions must not overlap the occupied blocks or each other.",
        "  Keep the total weekly minutes at or under the stated budget when one is given.",
        "- milestones: 3–8 dated checkpoints between today and the target date, in order, each a",
        '  concrete, checkable outcome (not "keep practising").',
        '- mindMap: one root node whose title is the goal, then sub-topics as children. Use short ids',
        '  like "root", "n1", "n2". Every parentId must reference an existing id.',
        "- resources: only include a `url` if it appeared verbatim in the research findings; otherwise",
        "  set it to null and describe what to search for in `note`.",
        "- summary: two or three sentences the user will read first.",
    ]
    user = [f"Goal: {inp.title}"]
    if inp.description:
        user.append(f"Context from the user: {inp.description}")
    user += ["", render_context(inp, ctx), "", "--- Research findings ---", findings.strip() or "(no research was available)", ""]
    if feedback:
        user.append("--- Problems with the previous draft — fix every one of these ---")
        user += [f"- {f}" for f in feedback]
        user.append("")
    system = "You are a learning-and-habit coach turning research into a weekly routine.\n" + "\n".join(rules)
    return system, "\n".join(user)


def _render_plan(plan: GoalPlan) -> str:
    lines = [f"Summary: {plan.summary}", "", "Sessions:"]
    for s in plan.sessions:
        rationale = f" — {s.rationale}" if s.rationale else ""
        lines.append(f"  - {s.name}: {'/'.join(DAY[d] for d in s.days)} at {s.scheduled_time}, {s.target_minutes} min{rationale}")
    lines += ["", "Milestones:"]
    for m in plan.milestones:
        desc = f" — {m.description}" if m.description else ""
        lines.append(f"  - {m.due_date}: {m.title}{desc}")
    lines += ["", "Resources:"]
    for r in plan.resources:
        url = f" <{r['url']}>" if r["url"] else ""
        lines.append(f"  - [{r['type']}] {r['title']}{url} — {r['note']}")
    lines += ["", f"Mind map: {len(plan.mind_map)} nodes"]
    return "\n".join(lines)


def critique_prompt(inp: GoalDraftInput, ctx: PlanningContext, plan: GoalPlan, deterministic_findings: list[str]) -> tuple[str, str]:
    system = (
        "You are reviewing a learning plan someone else drafted. Judge it against the goal and the "
        "constraints only. Fail it if: the pacing is unrealistic for the time budget and deadline; "
        "milestones are vague or out of order; the sessions do not plausibly add up to the milestones; "
        "the resources are off-topic or padded; or the plan ignores something the user said. "
        "Pass it if it is realistic, concrete and respects the constraints, even if it is not the plan "
        "you would have written. Feedback must be specific and actionable — name the session, "
        "milestone or resource and say what to change. Return an empty feedback list on pass."
    )
    checks = (
        f"Automated checks already found these problems (treat them as failures):\n" + "\n".join(f"- {f}" for f in deterministic_findings) + "\n"
        if deterministic_findings else "Automated checks found no schedule conflicts or dead links.\n"
    )
    user = [f"Goal: {inp.title}"]
    if inp.description:
        user.append(f"Context from the user: {inp.description}")
    user += ["", render_context(inp, ctx), "", checks, "--- Draft plan ---", _render_plan(plan)]
    return system, "\n".join(user)


def clamp_findings(findings: str) -> str:
    if len(findings) <= MAX_FINDINGS_CHARS:
        return findings
    return findings[:MAX_FINDINGS_CHARS] + "\n\n[research summary truncated to fit the request limit]"


# ---------------------------------------------------------------------- intervenor

@dataclass
class Review:
    accept: bool
    feedback: list[str]
    plan: GoalPlan
    notes: list[str]


async def _verify_resources(ai: AiClient, resources: list[dict], topic: str, verify_links: bool) -> tuple[list[dict], list[str]]:
    if not verify_links:
        return resources, []

    dropped: list[str] = []
    out = [dict(r) for r in resources]
    reachable: list[tuple[int, PageToJudge]] = []

    for i, r in enumerate(out):
        if not r["url"]:
            continue
        page = await ai.fetch_page(r["url"])
        if not page.ok:
            dropped.append(f"{r['title']} <{r['url']}> ({page.error or 'unreachable'})")
            out[i] = {**r, "url": None}
            continue
        if page.title and not r["title"].strip():
            out[i] = {**r, "title": page.title}
        reachable.append((i, PageToJudge(url=r["url"], title=page.title, excerpt=page.excerpt)))

    if reachable:
        verdicts = await ai.judge_relevance([p for _, p in reachable], topic)
        for (idx, page), relevant in zip(reachable, verdicts, strict=False):
            if not relevant:
                r = out[idx]
                dropped.append(f"{r['title']} <{r['url']}> (page is not about the goal)")
                out[idx] = {**r, "url": None}

    return out, dropped


async def review_plan(ai: AiClient, inp: GoalDraftInput, ctx: PlanningContext, draft: GoalPlan, verify_links: bool = True) -> Review:
    feedback: list[str] = []
    notes: list[str] = []

    for c in find_schedule_conflicts(draft.sessions, ctx.occupied):
        feedback.append(f"Schedule conflict: {describe_conflict(c)}. Move or shorten the session.")
    for c in find_internal_conflicts(draft.sessions):
        feedback.append(f"Two proposed sessions overlap: {describe_conflict(c)}.")
    if inp.weekly_minutes_budget:
        total = weekly_minutes(draft.sessions)
        if total > inp.weekly_minutes_budget * 1.15:
            feedback.append(f"The sessions add up to {total} minutes per week but the budget is {inp.weekly_minutes_budget}. Reduce the days or the length.")
    if inp.target_date:
        for m in draft.milestones:
            if m.due_date > inp.target_date:
                feedback.append(f'Milestone "{m.title}" is dated {m.due_date}, after the target date {inp.target_date}.')
            if m.due_date < ctx.today:
                feedback.append(f'Milestone "{m.title}" is dated {m.due_date}, which is already in the past.')

    resources, dropped = await _verify_resources(ai, draft.resources, inp.title, verify_links)
    plan = GoalPlan(draft.summary, draft.sessions, draft.milestones, draft.mind_map, resources)
    if dropped:
        feedback.append(f"These resource links did not check out and were removed — replace them with working ones or set url to null: {'; '.join(dropped)}")

    if feedback:
        return Review(accept=False, feedback=feedback, plan=plan, notes=notes)

    system, user = critique_prompt(inp, ctx, plan, [])
    verdict = await ai.structured(system, user, CritiqueOut, max_tokens=4000)
    if verdict.verdict == "pass":
        return Review(accept=True, feedback=[], plan=plan, notes=notes)
    items = [f.strip() for f in verdict.feedback if f.strip()]
    return Review(
        accept=False,
        feedback=items or ["The reviewer rejected the plan without giving reasons; tighten pacing and make milestones concrete."],
        plan=plan, notes=notes,
    )


# --------------------------------------------------------------------------- loop

@dataclass
class GoalPlanProgress:
    phase: str  # researching | drafting | revising | reviewing
    iteration: int
    max_iterations: int


@dataclass
class GoalDraftResult:
    plan: GoalPlan
    iterations: int
    warnings: list[str]


async def plan_goal(
    ai: AiClient, inp: GoalDraftInput, ctx: PlanningContext, *, max_iterations: int = DEFAULT_MAX_ITERATIONS, verify_links: bool = True
) -> AsyncGenerator[GoalPlanProgress | GoalDraftResult, None]:
    """Actor + Intervenor + bounded Reflexion loop, yielding progress events and a final result."""

    yield GoalPlanProgress("researching", 1, max_iterations)
    system, user = research_prompt(inp, ctx)
    findings = clamp_findings(await ai.research(system, user))

    feedback: list[str] = []
    last: GoalPlan | None = None

    for iteration in range(1, max_iterations + 1):
        phase = "drafting" if iteration == 1 else "revising"
        yield GoalPlanProgress(phase, iteration, max_iterations)

        system, user = finalize_prompt(inp, ctx, findings, feedback)
        try:
            raw = await ai.structured(system, user, GoalPlanOut)
            draft = normalise_plan(raw)
        except PlanShapeError as err:
            if iteration < max_iterations:
                feedback = [f"Structural problem: {p}" for p in err.problems]
                continue
            raise

        yield GoalPlanProgress("reviewing", iteration, max_iterations)
        review = await review_plan(ai, inp, ctx, draft, verify_links)
        last = review.plan

        if review.accept:
            yield GoalDraftResult(plan=review.plan, iterations=iteration, warnings=review.notes)
            return
        feedback = review.feedback

    if last is None:
        raise RuntimeError("The planner could not produce a usable draft.")
    yield GoalDraftResult(
        plan=last, iterations=max_iterations,
        warnings=[f"The reviewer still had concerns after {max_iterations} attempts — check these yourself:", *feedback],
    )
