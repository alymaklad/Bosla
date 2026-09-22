import json

from fastapi import APIRouter, Depends, HTTPException, UploadFile
from fastapi.responses import Response, StreamingResponse
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..ai import career_discovery as cd
from ..ai.base import AiClient
from ..ai.pdf_report import ChatHistoryEntry, generate_pdf_report
from ..db import get_db
from ..deps import get_ai_client, get_current_user
from ..models import Assessment, CareerMatch, CvUpload, DiscoveryMessage, DiscoveryProfile, MentorMessage, Roadmap, User
from ..schemas import (
    ChooseDirectionRequest,
    DiscoveryMessageOut,
    DiscoveryProfileOut,
    DiscoverySendRequest,
    DiscoveryStartRequest,
    MentorChatRequest,
    ProfileDimensionOut,
)

router = APIRouter(prefix="/career", tags=["career"])


def _sse(event: str, data: dict | str) -> bytes:
    payload = data if isinstance(data, str) else json.dumps(data)
    return f"event: {event}\ndata: {payload}\n\n".encode()


# --------------------------------------------------------------------- CV upload

@router.post("/cv")
async def upload_cv(file: UploadFile, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> dict:
    data = await file.read()
    result = cd.extract_text_from_pdf(data)
    upload = CvUpload(
        user_id=user.id, filename=file.filename or "resume.pdf",
        text=result.text, truncated=result.truncated, ok=result.ok, error=result.error,
    )
    db.add(upload)
    await db.commit()
    return {"text": result.text, "truncated": result.truncated, "ok": result.ok, "error": result.error}


async def _latest_cv_text(db: AsyncSession, user_id: str) -> str | None:
    res = await db.execute(select(CvUpload).where(CvUpload.user_id == user_id, CvUpload.ok == True).order_by(CvUpload.created_at.desc()))  # noqa: E712
    row = res.scalars().first()
    return row.text if row else None


# --------------------------------------------------------------------- discovery

async def _history(db: AsyncSession, user_id: str) -> list[dict]:
    res = await db.execute(select(DiscoveryMessage).where(DiscoveryMessage.user_id == user_id).order_by(DiscoveryMessage.created_at))
    return [{"role": m.role, "content": m.content} for m in res.scalars().all()]


@router.post("/discovery/start", response_model=DiscoveryMessageOut)
async def start_discovery(body: DiscoveryStartRequest, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> dict:
    await db.execute(delete(DiscoveryMessage).where(DiscoveryMessage.user_id == user.id))
    await db.execute(delete(DiscoveryProfile).where(DiscoveryProfile.user_id == user.id))
    await db.commit()

    opening = cd.discovery_opening_message(body.persona or user.persona)
    db.add(DiscoveryMessage(user_id=user.id, role="assistant", content=opening))
    await db.commit()
    return {"role": "assistant", "content": opening}


@router.get("/discovery/messages", response_model=list[DiscoveryMessageOut])
async def get_discovery_messages(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> list[dict]:
    return await _history(db, user.id)


def _profile_to_out(p: DiscoveryProfile | None) -> DiscoveryProfileOut:
    if p is None:
        empty = ProfileDimensionOut(text="", confidence="none")
        return DiscoveryProfileOut(interests=empty, strengths=empty, skills=empty, experience=empty, motivations=empty, exchange_count=0, ready=False)
    return DiscoveryProfileOut(
        interests=ProfileDimensionOut(text=p.interests, confidence=p.interests_confidence),
        strengths=ProfileDimensionOut(text=p.strengths, confidence=p.strengths_confidence),
        skills=ProfileDimensionOut(text=p.skills, confidence=p.skills_confidence),
        experience=ProfileDimensionOut(text=p.experience, confidence=p.experience_confidence),
        motivations=ProfileDimensionOut(text=p.motivations, confidence=p.motivations_confidence),
        exchange_count=p.exchange_count,
        ready=p.status == "complete",
    )


@router.get("/discovery/profile", response_model=DiscoveryProfileOut)
async def get_discovery_profile(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> DiscoveryProfileOut:
    res = await db.execute(select(DiscoveryProfile).where(DiscoveryProfile.user_id == user.id))
    return _profile_to_out(res.scalar_one_or_none())


@router.post("/discovery/send")
async def send_discovery_message(
    body: DiscoverySendRequest, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db), ai: AiClient = Depends(get_ai_client)
) -> StreamingResponse:
    db.add(DiscoveryMessage(user_id=user.id, role="user", content=body.message))
    await db.commit()

    history = await _history(db, user.id)
    cv_text = await _latest_cv_text(db, user.id)

    async def gen():
        full = ""
        async for chunk in cd.stream_discovery_turn(ai, persona=user.persona, cv_text=cv_text, history=history):
            full += chunk
            yield _sse("chunk", {"text": chunk})

        db.add(DiscoveryMessage(user_id=user.id, role="assistant", content=full))
        await db.commit()

        updated_history = history + [{"role": "assistant", "content": full}]
        profile = await cd.extract_profile(ai, history=updated_history, previous=None)
        ready = cd.discovery_ready(profile)

        res = await db.execute(select(DiscoveryProfile).where(DiscoveryProfile.user_id == user.id))
        row = res.scalar_one_or_none()
        if row is None:
            row = DiscoveryProfile(user_id=user.id)
            db.add(row)
        row.interests, row.interests_confidence = profile.interests.text, profile.interests.confidence
        row.strengths, row.strengths_confidence = profile.strengths.text, profile.strengths.confidence
        row.skills, row.skills_confidence = profile.skills.text, profile.skills.confidence
        row.experience, row.experience_confidence = profile.experience.text, profile.experience.confidence
        row.motivations, row.motivations_confidence = profile.motivations.text, profile.motivations.confidence
        row.exchange_count = profile.exchange_count
        row.status = "complete" if ready else "in_progress"
        await db.commit()

        yield _sse("done", _profile_to_out(row).model_dump())

    return StreamingResponse(gen(), media_type="text/event-stream")


# -------------------------------------------------------------------- assessment

def _profile_summary_text(p: DiscoveryProfile | None) -> str:
    if p is None:
        return "No discovery profile recorded."
    parts = []
    for label, text, conf in [
        ("Interests", p.interests, p.interests_confidence), ("Strengths", p.strengths, p.strengths_confidence),
        ("Skills", p.skills, p.skills_confidence), ("Experience", p.experience, p.experience_confidence),
        ("Motivations", p.motivations, p.motivations_confidence),
    ]:
        if text:
            parts.append(f"{label} ({conf} confidence): {text}")
    return "\n".join(parts) or "No discovery profile recorded."


@router.post("/assessment")
async def run_assessment(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db), ai: AiClient = Depends(get_ai_client)) -> StreamingResponse:
    res = await db.execute(select(DiscoveryProfile).where(DiscoveryProfile.user_id == user.id))
    profile = res.scalar_one_or_none()
    cv_text = await _latest_cv_text(db, user.id)

    student = cd.StudentInput(
        name=user.name, major=user.persona or "Undecided",
        interests=profile.interests if profile else "", skill_level=profile.skills if profile else "", cv_text=cv_text,
    )

    async def gen():
        full = ""
        async for chunk in cd.run_assessment(ai, student):
            full += chunk
            yield _sse("chunk", {"text": chunk})
        db.add(Assessment(user_id=user.id, text=full))
        await db.commit()
        yield _sse("done", {"text": full})

    return StreamingResponse(gen(), media_type="text/event-stream")


@router.get("/assessment")
async def get_assessment(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> dict:
    res = await db.execute(select(Assessment).where(Assessment.user_id == user.id).order_by(Assessment.created_at.desc()))
    row = res.scalars().first()
    return {"text": row.text if row else None}


# ------------------------------------------------------------------------ matches

@router.post("/matches/generate", response_model=list[dict])
async def generate_matches(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> list[dict]:
    res = await db.execute(select(Assessment).where(Assessment.user_id == user.id).order_by(Assessment.created_at.desc()))
    assessment = res.scalars().first()
    if assessment is None:
        raise HTTPException(400, "Run the assessment before generating matches.")

    ai = get_ai_client()
    pres = await db.execute(select(DiscoveryProfile).where(DiscoveryProfile.user_id == user.id))
    profile = pres.scalar_one_or_none()

    matches = await cd.generate_career_matches(ai, assessment.text, _profile_summary_text(profile))

    await db.execute(delete(CareerMatch).where(CareerMatch.user_id == user.id))
    rows = []
    for i, m in enumerate(matches):
        row = CareerMatch(
            user_id=user.id, rank=i + 1, title=m.title, fit_score=m.fit_score, why=m.why,
            uncertainty_note=m.uncertainty_note, salary=m.market.salary, remote=m.market.remote,
            demand=m.market.demand, source=m.market.source, as_of=m.market.as_of,
        )
        db.add(row)
        rows.append(row)
    await db.commit()
    for r in rows:
        await db.refresh(r)
    return [_match_dict(r) for r in rows]


def _match_dict(r: CareerMatch) -> dict:
    return {
        "id": r.id, "rank": r.rank, "title": r.title, "fit_score": r.fit_score, "why": r.why,
        "uncertainty_note": r.uncertainty_note, "salary": r.salary, "remote": r.remote,
        "demand": r.demand, "source": r.source, "as_of": r.as_of, "chosen": r.chosen,
    }


@router.get("/matches", response_model=list[dict])
async def list_matches(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> list[dict]:
    res = await db.execute(select(CareerMatch).where(CareerMatch.user_id == user.id).order_by(CareerMatch.rank))
    return [_match_dict(r) for r in res.scalars().all()]


@router.post("/matches/choose", response_model=dict)
async def choose_direction(body: ChooseDirectionRequest, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> dict:
    res = await db.execute(select(CareerMatch).where(CareerMatch.user_id == user.id))
    matches = res.scalars().all()
    found = False
    for m in matches:
        m.chosen = m.id == body.match_id
        found = found or m.chosen
    if not found:
        raise HTTPException(404, "Match not found")
    await db.commit()
    return {"ok": True}


# ----------------------------------------------------------------------- roadmap

@router.post("/roadmap/generate", response_model=dict)
async def generate_roadmap_endpoint(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> dict:
    res = await db.execute(select(CareerMatch).where(CareerMatch.user_id == user.id, CareerMatch.chosen == True))  # noqa: E712
    match = res.scalar_one_or_none()
    if match is None:
        raise HTTPException(400, "Choose a direction before building a roadmap.")

    ai = get_ai_client()
    pres = await db.execute(select(DiscoveryProfile).where(DiscoveryProfile.user_id == user.id))
    profile = pres.scalar_one_or_none()

    steps = await cd.generate_roadmap(ai, match.title, match.why, _profile_summary_text(profile))
    step_dicts = [{"category": s.category, "title": s.title, "description": s.description} for s in steps]

    await db.execute(delete(Roadmap).where(Roadmap.user_id == user.id))
    row = Roadmap(user_id=user.id, match_id=match.id, direction=match.title, steps=step_dicts)
    db.add(row)
    await db.commit()
    await db.refresh(row)
    return {"id": row.id, "direction": row.direction, "steps": row.steps}


@router.get("/roadmap", response_model=dict)
async def get_roadmap(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> dict:
    res = await db.execute(select(Roadmap).where(Roadmap.user_id == user.id).order_by(Roadmap.created_at.desc()))
    row = res.scalars().first()
    if row is None:
        return {"id": None, "direction": None, "steps": []}
    return {"id": row.id, "direction": row.direction, "steps": row.steps}


# ----------------------------------------------------------------------- mentor

@router.post("/mentor/chat")
async def mentor_chat(
    body: MentorChatRequest, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db), ai: AiClient = Depends(get_ai_client)
) -> StreamingResponse:
    ares = await db.execute(select(Assessment).where(Assessment.user_id == user.id).order_by(Assessment.created_at.desc()))
    assessment = ares.scalars().first()
    assessment_context = assessment.text if assessment else ""

    hres = await db.execute(select(MentorMessage).where(MentorMessage.user_id == user.id).order_by(MentorMessage.created_at))
    history = [{"role": m.role, "content": m.content} for m in hres.scalars().all()]

    db.add(MentorMessage(user_id=user.id, match_id=body.match_id, role="user", content=body.message))
    await db.commit()

    async def gen():
        full = ""
        async for chunk in cd.run_mentorship_turn(ai, user_message=body.message, assessment_context=assessment_context, history=history):
            full += chunk
            yield _sse("chunk", {"text": chunk})
        db.add(MentorMessage(user_id=user.id, match_id=body.match_id, role="assistant", content=full))
        await db.commit()
        yield _sse("done", {"text": full})

    return StreamingResponse(gen(), media_type="text/event-stream")


@router.get("/mentor/messages", response_model=list[DiscoveryMessageOut])
async def get_mentor_messages(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> list[dict]:
    res = await db.execute(select(MentorMessage).where(MentorMessage.user_id == user.id).order_by(MentorMessage.created_at))
    return [{"role": m.role, "content": m.content} for m in res.scalars().all()]


# ---------------------------------------------------------------------- PDF export

@router.get("/report.pdf")
async def download_report(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> Response:
    ares = await db.execute(select(Assessment).where(Assessment.user_id == user.id).order_by(Assessment.created_at.desc()))
    assessment = ares.scalars().first()

    mres = await db.execute(select(MentorMessage).where(MentorMessage.user_id == user.id).order_by(MentorMessage.created_at))
    chat = [ChatHistoryEntry(role=m.role, content=m.content) for m in mres.scalars().all()]

    pdf_bytes = generate_pdf_report(user.name, assessment.text if assessment else None, chat)
    return Response(content=pdf_bytes, media_type="application/pdf", headers={"Content-Disposition": "attachment; filename=bosla-career-report.pdf"})
