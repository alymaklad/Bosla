from pydantic import BaseModel


# ------------------------------------------------------------------------- auth

class SignInRequest(BaseModel):
    email: str
    name: str = ""


class UserOut(BaseModel):
    id: str
    email: str
    name: str
    persona: str | None
    language: str
    consent_given: bool

    class Config:
        from_attributes = True


class ConsentRequest(BaseModel):
    consent_given: bool
    persona: str


# ---------------------------------------------------------------------- discovery

class DiscoveryStartRequest(BaseModel):
    persona: str | None = None


class DiscoveryMessageOut(BaseModel):
    role: str
    content: str


class DiscoverySendRequest(BaseModel):
    message: str


class ProfileDimensionOut(BaseModel):
    text: str
    confidence: str


class DiscoveryProfileOut(BaseModel):
    interests: ProfileDimensionOut
    strengths: ProfileDimensionOut
    skills: ProfileDimensionOut
    experience: ProfileDimensionOut
    motivations: ProfileDimensionOut
    exchange_count: int
    ready: bool


# ------------------------------------------------------------------------ career

class CareerMatchOut(BaseModel):
    id: str
    rank: int
    title: str
    fit_score: int
    why: str
    uncertainty_note: str
    salary: str
    remote: str
    demand: str
    source: str
    as_of: str
    chosen: bool

    class Config:
        from_attributes = True


class ChooseDirectionRequest(BaseModel):
    match_id: str


class RoadmapStepOut(BaseModel):
    category: str
    title: str
    description: str


class RoadmapOut(BaseModel):
    id: str
    direction: str
    steps: list[RoadmapStepOut]

    class Config:
        from_attributes = True


class MentorChatRequest(BaseModel):
    message: str
    match_id: str | None = None


# --------------------------------------------------------------------------- goal

class GoalDraftRequest(BaseModel):
    title: str
    description: str | None = None
    target_date: str | None = None
    weekly_minutes_budget: int | None = None
    roadmap_step_title: str | None = None


class GoalOut(BaseModel):
    id: str
    title: str
    description: str | None
    target_date: str | None
    weekly_minutes_budget: int | None
    status: str
    plan: dict
    iterations: int
    warnings: list

    class Config:
        from_attributes = True


class CommitGoalRequest(BaseModel):
    goal_id: str


# -------------------------------------------------------------------------- habit

class HabitCreateRequest(BaseModel):
    name: str
    recurrence: dict
    scheduled_time: str = "09:00"
    baseline_minutes: int = 30
    goal_id: str | None = None


class HabitOut(BaseModel):
    id: str
    name: str
    recurrence: dict
    scheduled_time: str
    baseline_minutes: int
    difficulty_level: int
    goal_id: str | None
    archived: bool

    class Config:
        from_attributes = True


class OccurrenceOut(BaseModel):
    id: str
    habit_id: str
    habit_name: str
    date: str
    target_minutes: int
    logged_minutes: float
    completed: bool
    justified_skip: bool
    skip_reason: str | None
    origin: str | None
    status: str
    percent: int
    points: float
    xp: int


class LogOccurrenceRequest(BaseModel):
    minutes: float | None = None
    completed: bool | None = None
    origin: str | None = None


class SkipOccurrenceRequest(BaseModel):
    reason: str


class DifficultyProposalOut(BaseModel):
    habit_id: str
    habit_name: str
    direction: str
    current_level: int
    proposed_level: int
    current_target: int
    proposed_target: int
    rationale: str


class AcceptDifficultyRequest(BaseModel):
    habit_id: str
    accept: bool


# ---------------------------------------------------------------------- dashboard

class LevelInfoOut(BaseModel):
    level: int
    title: str
    current_xp: int
    level_floor: int
    level_ceiling: int
    xp_to_next: int
    progress: float


class StreakInfoOut(BaseModel):
    current: int
    longest: int


class DashboardOut(BaseModel):
    level: LevelInfoOut
    streak: StreakInfoOut
    week_completion_pct: float
    today: list[OccurrenceOut]
    top_matches: list[CareerMatchOut]
    chosen_direction: str | None
