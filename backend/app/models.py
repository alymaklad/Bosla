import uuid
from datetime import datetime

from sqlalchemy import JSON, Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base


def _id() -> str:
    return uuid.uuid4().hex


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_id)
    email: Mapped[str] = mapped_column(String(255), unique=True)
    name: Mapped[str] = mapped_column(String(255), default="")
    persona: Mapped[str | None] = mapped_column(String(32), nullable=True)
    language: Mapped[str] = mapped_column(String(8), default="en")
    consent_given: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class CvUpload(Base):
    __tablename__ = "cv_uploads"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_id)
    user_id: Mapped[str] = mapped_column(String(32), ForeignKey("users.id"))
    filename: Mapped[str] = mapped_column(String(255))
    text: Mapped[str] = mapped_column(Text, default="")
    truncated: Mapped[bool] = mapped_column(Boolean, default=False)
    ok: Mapped[bool] = mapped_column(Boolean, default=False)
    error: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class DiscoveryMessage(Base):
    __tablename__ = "discovery_messages"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_id)
    user_id: Mapped[str] = mapped_column(String(32), ForeignKey("users.id"))
    role: Mapped[str] = mapped_column(String(16))
    content: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class DiscoveryProfile(Base):
    __tablename__ = "discovery_profiles"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_id)
    user_id: Mapped[str] = mapped_column(String(32), ForeignKey("users.id"), unique=True)
    interests: Mapped[str] = mapped_column(Text, default="")
    interests_confidence: Mapped[str] = mapped_column(String(8), default="none")
    strengths: Mapped[str] = mapped_column(Text, default="")
    strengths_confidence: Mapped[str] = mapped_column(String(8), default="none")
    skills: Mapped[str] = mapped_column(Text, default="")
    skills_confidence: Mapped[str] = mapped_column(String(8), default="none")
    experience: Mapped[str] = mapped_column(Text, default="")
    experience_confidence: Mapped[str] = mapped_column(String(8), default="none")
    motivations: Mapped[str] = mapped_column(Text, default="")
    motivations_confidence: Mapped[str] = mapped_column(String(8), default="none")
    exchange_count: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(String(16), default="in_progress")
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Assessment(Base):
    __tablename__ = "assessments"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_id)
    user_id: Mapped[str] = mapped_column(String(32), ForeignKey("users.id"))
    text: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class CareerMatch(Base):
    __tablename__ = "career_matches"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_id)
    user_id: Mapped[str] = mapped_column(String(32), ForeignKey("users.id"))
    rank: Mapped[int] = mapped_column(Integer, default=0)
    title: Mapped[str] = mapped_column(String(255))
    fit_score: Mapped[int] = mapped_column(Integer)
    why: Mapped[str] = mapped_column(Text)
    uncertainty_note: Mapped[str] = mapped_column(Text)
    salary: Mapped[str] = mapped_column(String(255), default="")
    remote: Mapped[str] = mapped_column(String(255), default="")
    demand: Mapped[str] = mapped_column(String(255), default="")
    source: Mapped[str] = mapped_column(String(255), default="")
    as_of: Mapped[str] = mapped_column(String(64), default="")
    chosen: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class MentorMessage(Base):
    __tablename__ = "mentor_messages"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_id)
    user_id: Mapped[str] = mapped_column(String(32), ForeignKey("users.id"))
    match_id: Mapped[str | None] = mapped_column(String(32), ForeignKey("career_matches.id"), nullable=True)
    role: Mapped[str] = mapped_column(String(16))
    content: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Roadmap(Base):
    __tablename__ = "roadmaps"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_id)
    user_id: Mapped[str] = mapped_column(String(32), ForeignKey("users.id"))
    match_id: Mapped[str] = mapped_column(String(32), ForeignKey("career_matches.id"))
    direction: Mapped[str] = mapped_column(String(255))
    steps: Mapped[list] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Goal(Base):
    __tablename__ = "goals"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_id)
    user_id: Mapped[str] = mapped_column(String(32), ForeignKey("users.id"))
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    target_date: Mapped[str | None] = mapped_column(String(16), nullable=True)
    weekly_minutes_budget: Mapped[int | None] = mapped_column(Integer, nullable=True)
    status: Mapped[str] = mapped_column(String(16), default="active")
    plan: Mapped[dict] = mapped_column(JSON, default=dict)
    iterations: Mapped[int] = mapped_column(Integer, default=0)
    warnings: Mapped[list] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Habit(Base):
    __tablename__ = "habits"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_id)
    user_id: Mapped[str] = mapped_column(String(32), ForeignKey("users.id"))
    goal_id: Mapped[str | None] = mapped_column(String(32), ForeignKey("goals.id"), nullable=True)
    name: Mapped[str] = mapped_column(String(255))
    recurrence: Mapped[dict] = mapped_column(JSON, default=dict)
    scheduled_time: Mapped[str] = mapped_column(String(8), default="09:00")
    baseline_minutes: Mapped[int] = mapped_column(Integer, default=30)
    difficulty_level: Mapped[int] = mapped_column(Integer, default=1)
    archived: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    occurrences: Mapped[list["Occurrence"]] = relationship(back_populates="habit", cascade="all, delete-orphan")


class Occurrence(Base):
    __tablename__ = "occurrences"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_id)
    habit_id: Mapped[str] = mapped_column(String(32), ForeignKey("habits.id"))
    date: Mapped[str] = mapped_column(String(10))
    target_minutes: Mapped[int] = mapped_column(Integer)
    logged_minutes: Mapped[float] = mapped_column(Float, default=0)
    completed: Mapped[bool] = mapped_column(Boolean, default=False)
    justified_skip: Mapped[bool] = mapped_column(Boolean, default=False)
    skip_reason: Mapped[str | None] = mapped_column(String(255), nullable=True)
    origin: Mapped[str | None] = mapped_column(String(16), nullable=True)

    habit: Mapped["Habit"] = relationship(back_populates="occurrences")
