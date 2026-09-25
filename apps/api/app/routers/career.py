import json
import logging

from fastapi import APIRouter, Depends, Form, HTTPException, UploadFile
from fastapi.responses import Response, StreamingResponse
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..ai import career_discovery as cd
from ..ai import personal_knowledge as knowledge
from ..ai.base import AiClient
from ..ai.pdf_report import ChatHistoryEntry, generate_pdf_report
from ..config import get_settings
from ..db import get_db
from ..deps import ai_error_message, get_ai_client, get_current_user
from ..models import Assessment, CareerMatch, CvUpload, DiscoveryMessage, DiscoveryProfile, MentorMessage, Roadmap, User, UserDocument
from ..schemas import (
    ChooseDirectionRequest,
    DiscoveryMessageOut,
    DiscoveryProfileOut,
    DiscoverySendRequest,
    DiscoveryStartRequest,
    GithubProfileRequest,
    MentorChatRequest,
    ProfileDimensionOut,
    RoadmapStepDoneRequest,
)

router = APIRouter(prefix="/career", tags=["career"])
logger = logging.getLogger(__name__)
SUPPORTED_DOCUMENT_TYPES = {"cv", "resume", "recommendation", "certificate", "project", "thoughts", "journal", "other"}
SUPPORTED_DOCUMENT_EXTENSIONS = {".pdf": "application/pdf", ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document", ".txt": "text/plain"}


def _sse(event: str, data: dict | str) -> bytes:
    payload = data if isinstance(data, str) else json.dumps(data)
    return f"event: {event}\ndata: {payload}\n\n".encode()


# ----------------------------------------------------------- personal documents

def _document_out(row: UserDocument, *, text: str | None = None, truncated: bool = False) -> dict:
    return {
        "id": row.id,
        "source_type": row.source_type,
        "filename": row.filename,
        "mime_type": row.mime_type,
        "source_url": row.source_url,
        "char_count": row.char_count,
        "chunk_count": row.chunk_count,
        "extraction_method": row.extraction_method,
        "status": row.status,
        "error": row.error,
        "created_at": row.created_at.isoformat(),
        "text": text,
        "truncated": truncated,
        "ok": row.status == "ready",
    }


async def _ingest_upload(
    *, file: UploadFile, document_type: str, user: User, db: AsyncSession
) -> dict:
    if document_type not in SUPPORTED_DOCUMENT_TYPES:
        raise HTTPException(422, "Choose a valid document category.")
    filename = file.filename or "document"
    suffix = filename.lower().rsplit(".", 1)
    extension = f".{suffix[-1]}" if len(suffix) == 2 else ""
    if extension not in SUPPORTED_DOCUMENT_EXTENSIONS:
        raise HTTPException(415, "Upload a PDF, DOCX, or TXT file.")
    data = await file.read(knowledge.MAX_DOCUMENT_BYTES + 1)
    if len(data) > knowledge.MAX_DOCUMENT_BYTES:
        raise HTTPException(413, "Documents must be 10 MB or smaller.")
    result = await knowledge.extract_document(data, filename, file.content_type)
    if not result.ok:
        return {"text": "", "truncated": False, "ok": False, "error": result.error, "document": None}

    mime_type = SUPPORTED_DOCUMENT_EXTENSIONS[extension]
    row = (await knowledge.store_documents(
        db,
        user_id=user.id,
        sources=[(document_type, filename, mime_type, result.text, None, result.method)],
    ))[0]
    # Retain the legacy row for pre-existing report/export compatibility while all
    # new personalization uses user_documents + document_chunks.
    if document_type == "cv":
        db.add(CvUpload(user_id=user.id, filename=filename, text=result.text, truncated=result.truncated, ok=True, error=None))
        await db.commit()
    payload = _document_out(row, text=result.text[:7_000], truncated=result.truncated)
    return {"text": payload["text"], "truncated": result.truncated, "ok": True, "error": None, "document": payload}


@router.post("/documents")
async def upload_document(
    file: UploadFile,
    document_type: str = Form("other"),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    return await _ingest_upload(file=file, document_type=document_type, user=user, db=db)


@router.post("/cv")
async def upload_cv(file: UploadFile, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> dict:
    """Backward-compatible CV endpoint, now with PDF/DOCX/TXT and vector indexing."""
    return await _ingest_upload(file=file, document_type="cv", user=user, db=db)


@router.get("/documents/ocr-status")
async def document_ocr_status(user: User = Depends(get_current_user)) -> dict:
    """Expose setup state only; credentials and provider responses stay private."""
    settings = get_settings()
    if settings.google_vision_api_key:
        return {"configured": True, "provider": "Google Cloud Vision"}
    if settings.ocr_fallback_url:
        return {"configured": True, "provider": "Configured OCR service"}
    return {"configured": False, "provider": None}


@router.get("/documents")
async def list_documents(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> list[dict]:
    result = await db.execute(select(UserDocument).where(UserDocument.user_id == user.id).order_by(UserDocument.created_at.desc()))
    return [_document_out(row) for row in result.scalars().all()]


@router.delete("/documents", status_code=204)
async def remove_all_documents(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> Response:
    await knowledge.delete_all_documents(db, user_id=user.id)
    return Response(status_code=204)


@router.delete("/documents/{document_id}", status_code=204)
async def remove_document(document_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> Response:
    if not await knowledge.delete_document(db, user_id=user.id, document_id=document_id):
        raise HTTPException(404, "Document not found.")
    return Response(status_code=204)


@router.post("/sources/github")
async def import_github_profile(
    body: GithubProfileRequest, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
) -> dict:
    imported = await knowledge.crawl_github_profile(body.profile_url, get_settings())
    rows = await knowledge.store_documents(
        db,
        user_id=user.id,
        sources=[
            ("project", f"{imported.profile_url.removeprefix('https://github.com/')}/{item.path}", "text/plain", item.text, item.source_url, "github")
            for item in imported.files
        ],
    )
    return {
        "profile_url": imported.profile_url,
        "repositories_imported": imported.repositories_imported,
        "repositories_skipped": imported.repositories_skipped,
        "sources_indexed": len(rows),
        "chunks_created": sum(row.chunk_count for row in rows),
        "files_skipped": imported.files_skipped,
    }


async def _latest_cv_text(db: AsyncSession, user_id: str) -> str | None:
    res = await db.execute(select(CvUpload).where(CvUpload.user_id == user_id, CvUpload.ok == True).order_by(CvUpload.created_at.desc()))  # noqa: E712
    row = res.scalars().first()
    return row.text if row else None


async def _personal_context(db: AsyncSession, user_id: str, query: str) -> str:
    context = await knowledge.retrieve_context(db, user_id=user_id, query=query)
    if context != "No personal documents have been added yet.":
        return context
    # Existing users' historical CV uploads predate the vector tables.
    legacy_cv = await _latest_cv_text(db, user_id)
    return f"[Personal source: legacy CV]\n{legacy_cv}" if legacy_cv else context


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
    document_context = await _personal_context(db, user.id, body.message)

    async def gen():
        try:
            full = ""
            async for chunk in cd.stream_discovery_turn(ai, persona=user.persona, evidence_context=document_context, history=history):
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
        except Exception as err:  # noqa: BLE001
            await db.rollback()
            yield _sse("error", {"message": ai_error_message(err)})

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
    if profile is None or profile.status != "complete":
        raise HTTPException(403, "Finish the discovery conversation before generating career guidance.")
    document_context = await _personal_context(
        db, user.id, "career background education experience skills projects credentials achievements preferences"
    )

    student = cd.StudentInput(
        name=user.name, major=user.persona or "Undecided",
        interests=profile.interests if profile else "", skill_level=profile.skills if profile else "", evidence_context=document_context,
    )

    async def gen():
        try:
            full = ""
            async for chunk in cd.run_assessment(ai, student):
                full += chunk
                yield _sse("chunk", {"text": chunk})
            db.add(Assessment(user_id=user.id, text=full))
            await db.commit()
            yield _sse("done", {"text": full})
        except Exception as err:  # noqa: BLE001
            await db.rollback()
            yield _sse("error", {"message": ai_error_message(err)})

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
    if profile is None or profile.status != "complete":
        raise HTTPException(400, "Continue the discovery conversation before generating matches.")

    document_context = await _personal_context(
        db, user.id, "career match evidence skills experience strengths interests projects credentials"
    )
    matches = await cd.generate_career_matches(ai, assessment.text, _profile_summary_text(profile), document_context)

    await db.execute(delete(CareerMatch).where(CareerMatch.user_id == user.id))
    rows = []
    for i, m in enumerate(matches):
        row = CareerMatch(
            user_id=user.id, rank=i + 1, title=m.title, fit_score=m.fit_score, why=m.why,
            uncertainty_note=m.uncertainty_note, salary=m.market.salary, location=m.market.location, remote=m.market.remote,
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
        "uncertainty_note": r.uncertainty_note, "salary": r.salary, "location": r.location, "remote": r.remote,
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
    step_dicts = [{"category": s.category, "title": s.title, "description": s.description, "done": False} for s in steps]

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
    return _roadmap_out(row)


def _roadmap_out(row: Roadmap) -> dict:
    # Roadmaps saved before step completion existed have no "done" key.
    return {"id": row.id, "direction": row.direction, "steps": [{**step, "done": bool(step.get("done"))} for step in row.steps]}


@router.post("/roadmap/steps/{index}/done", response_model=dict)
async def set_roadmap_step_done(
    index: int, body: RoadmapStepDoneRequest, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
) -> dict:
    res = await db.execute(select(Roadmap).where(Roadmap.user_id == user.id).order_by(Roadmap.created_at.desc()))
    row = res.scalars().first()
    if row is None or not 0 <= index < len(row.steps):
        raise HTTPException(404, "Roadmap step not found.")
    steps = [dict(step) for step in row.steps]
    steps[index]["done"] = body.done
    row.steps = steps  # reassign so SQLAlchemy persists the JSON change
    await db.commit()
    return _roadmap_out(row)


# ----------------------------------------------------------------------- mentor

@router.post("/mentor/chat")
async def mentor_chat(
    body: MentorChatRequest, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
) -> StreamingResponse:
    profile = (await db.execute(select(DiscoveryProfile).where(DiscoveryProfile.user_id == user.id))).scalar_one_or_none()
    if profile is None or profile.status != "complete":
        raise HTTPException(403, "Finish the discovery conversation before using your career mentor.")
    ares = await db.execute(select(Assessment).where(Assessment.user_id == user.id).order_by(Assessment.created_at.desc()))
    assessment = ares.scalars().first()
    document_context = await _personal_context(db, user.id, body.message)
    assessment_context = (assessment.text if assessment else "No completed assessment yet.") + "\n\n" + document_context

    hres = await db.execute(select(MentorMessage).where(MentorMessage.user_id == user.id).order_by(MentorMessage.created_at))
    history = [{"role": m.role, "content": m.content} for m in hres.scalars().all()]

    db.add(MentorMessage(user_id=user.id, match_id=body.match_id, role="user", content=body.message))
    await db.commit()

    async def gen():
        full = ""
        try:
            ai = get_ai_client()
            async for chunk in cd.run_mentorship_turn(ai, user_message=body.message, assessment_context=assessment_context, history=history):
                full += chunk
                yield _sse("chunk", {"text": chunk})
        except Exception as err:  # noqa: BLE001
            await db.rollback()
            logger.warning("mentor_live_provider_unavailable", extra={"error_type": type(err).__name__})
            fallback = cd.mentorship_fallback(user_message=body.message, assessment_context=assessment_context)
            # Avoid repeating a complete-looking partial answer when a provider drops
            # mid-stream, but always leave the user with an actionable response.
            if full:
                fallback = "\n\nThe live response stopped early. " + fallback
            full += fallback
            yield _sse("chunk", {"text": fallback})
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
