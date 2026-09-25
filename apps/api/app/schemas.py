import re
from datetime import date, time
from typing import Annotated, Literal

from pydantic import BaseModel, Field, field_validator, model_validator


EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
PERSONAS = Literal["student", "university", "graduate", "switcher"]
DOCUMENT_TYPES = Literal["cv", "resume", "recommendation", "certificate", "project", "thoughts", "journal", "other"]


def _normalise_email(value: str) -> str:
    value = value.strip().lower()
    if len(value) > 255 or not EMAIL_RE.fullmatch(value):
        raise ValueError("Enter a valid email address.")
    return value


# ------------------------------------------------------------------------- auth

class SignInRequest(BaseModel):
    email: str
    password: str = Field(min_length=8, max_length=128)

    @field_validator("email")
    @classmethod
    def valid_email(cls, value: str) -> str:
        return _normalise_email(value)


class RegisterRequest(SignInRequest):
    name: str = Field(min_length=2, max_length=100)

    @field_validator("name")
    @classmethod
    def valid_name(cls, value: str) -> str:
        value = value.strip()
        if len(value) < 2:
            raise ValueError("Name must contain at least 2 characters.")
        return value


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
    persona: PERSONAS


class LanguageRequest(BaseModel):
    language: str


# ---------------------------------------------------------------------- discovery

class DiscoveryStartRequest(BaseModel):
    persona: PERSONAS | None = None


class DiscoveryMessageOut(BaseModel):
    role: str
    content: str


class DiscoverySendRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)

    @field_validator("message")
    @classmethod
    def non_blank_message(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Message cannot be empty.")
        return value


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
    location: str
    remote: str
    demand: str
    source: str
    as_of: str
    chosen: bool

    class Config:
        from_attributes = True


class ChooseDirectionRequest(BaseModel):
    match_id: str


class RoadmapStepDoneRequest(BaseModel):
    done: bool


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
    message: str = Field(min_length=1, max_length=4000)
    match_id: str | None = None

    @field_validator("message")
    @classmethod
    def non_blank_message(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Message cannot be empty.")
        return value


class GithubProfileRequest(BaseModel):
    profile_url: str = Field(min_length=12, max_length=2048)

    @field_validator("profile_url")
    @classmethod
    def non_blank_profile_url(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("GitHub profile URL cannot be empty.")
        return value


# --------------------------------------------------------------------------- goal

class GoalDraftRequest(BaseModel):
    title: str = Field(min_length=2, max_length=255)
    description: str | None = Field(default=None, max_length=4000)
    target_date: str | None = None
    weekly_minutes_budget: int | None = Field(default=None, ge=15, le=10080)
    roadmap_step_title: str | None = Field(default=None, max_length=255)

    @field_validator("target_date")
    @classmethod
    def valid_target_date(cls, value: str | None) -> str | None:
        if value is not None:
            date.fromisoformat(value)
        return value


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

class WeeklyRecurrence(BaseModel):
    kind: Literal["weekly"]
    days: list[Annotated[int, Field(ge=1, le=7)]] = Field(min_length=1, max_length=7)

    @field_validator("days")
    @classmethod
    def unique_days(cls, value: list[int]) -> list[int]:
        if len(set(value)) != len(value):
            raise ValueError("Weekly recurrence days must be unique.")
        return sorted(value)


class EveryNRecurrence(BaseModel):
    kind: Literal["everyN"]
    n: int = Field(ge=1, le=365)
    anchor: str

    @field_validator("anchor")
    @classmethod
    def valid_anchor(cls, value: str) -> str:
        return date.fromisoformat(value).isoformat()


class HabitCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    recurrence: WeeklyRecurrence | EveryNRecurrence = Field(discriminator="kind")
    scheduled_time: str = "09:00"
    baseline_minutes: int = Field(default=30, ge=1, le=1440)
    goal_id: str | None = None

    @field_validator("name")
    @classmethod
    def non_blank_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Habit name cannot be empty.")
        return value

    @field_validator("scheduled_time")
    @classmethod
    def valid_time(cls, value: str) -> str:
        return time.fromisoformat(value).strftime("%H:%M")


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


class TodoCreateRequest(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    due_date: str | None = None
    goal_id: str | None = None
    occurrence_id: str | None = None

    @field_validator("title")
    @classmethod
    def non_blank_title(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("To-do title cannot be empty.")
        return value

    @field_validator("due_date")
    @classmethod
    def valid_due_date(cls, value: str | None) -> str | None:
        return date.fromisoformat(value).isoformat() if value else None


class TodoCompletionRequest(BaseModel):
    completed: bool


class TodoOut(BaseModel):
    id: str
    title: str
    due_date: str
    completed: bool
    goal_id: str | None
    occurrence_id: str | None
    carried_forward: bool


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
    minutes: float | None = Field(default=None, ge=0, le=1440)
    completed: bool | None = None
    origin: Literal["timer", "manual", "assumed"] | None = None

    @model_validator(mode="after")
    def require_change(self):
        if self.minutes is None and self.completed is None:
            raise ValueError("Provide minutes or a completion state.")
        return self


class SkipOccurrenceRequest(BaseModel):
    reason: str = Field(min_length=1, max_length=255)

    @field_validator("reason")
    @classmethod
    def non_blank_reason(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("A skip reason is required.")
        return value


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
