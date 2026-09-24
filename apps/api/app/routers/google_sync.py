import hmac
import secrets
from datetime import date, datetime, timedelta, timezone
from urllib.parse import quote, urlencode

import httpx
from cryptography.fernet import Fernet, InvalidToken
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from fastapi.responses import RedirectResponse
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..config import Settings, get_settings
from ..db import get_db
from ..deps import get_current_user
from ..models import GoogleIntegration, GoogleSyncLink, Habit, Occurrence, User
from .habits import _ensure_occurrences

router = APIRouter(prefix="/integrations/google", tags=["google integration"])

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_REVOKE_URL = "https://oauth2.googleapis.com/revoke"
CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.events"
TASKS_SCOPE = "https://www.googleapis.com/auth/tasks"
SYNC_SCOPES = (CALENDAR_SCOPE, TASKS_SCOPE)


def _configuration(settings: Settings) -> tuple[bool, str | None]:
    if not settings.google_sync_client_id or not settings.google_sync_client_secret:
        return False, "Google sync OAuth client credentials are missing."
    if not settings.google_sync_redirect_uri:
        return False, "The Google sync redirect URI is missing."
    if not settings.google_token_encryption_key:
        return False, "The token encryption key is missing."
    try:
        Fernet(settings.google_token_encryption_key.encode())
    except (TypeError, ValueError):
        return False, "The token encryption key is invalid."
    return True, None


def _fernet(settings: Settings) -> Fernet:
    configured, reason = _configuration(settings)
    if not configured:
        raise HTTPException(503, f"Google sync is not configured: {reason}")
    return Fernet(settings.google_token_encryption_key.encode())


def _encrypt_refresh_token(token: str, settings: Settings) -> str:
    return _fernet(settings).encrypt(token.encode()).decode()


def _decrypt_refresh_token(token: str, settings: Settings) -> str:
    try:
        return _fernet(settings).decrypt(token.encode()).decode()
    except InvalidToken as err:
        raise HTTPException(503, "Google sync credentials cannot be decrypted. Reconnect Google.") from err


async def _access_token(connection: GoogleIntegration, settings: Settings, client: httpx.AsyncClient) -> str:
    response = await client.post(
        GOOGLE_TOKEN_URL,
        data={
            "client_id": settings.google_sync_client_id,
            "client_secret": settings.google_sync_client_secret,
            "refresh_token": _decrypt_refresh_token(connection.refresh_token_encrypted, settings),
            "grant_type": "refresh_token",
        },
    )
    if response.status_code >= 400:
        raise HTTPException(502, "Google authorization expired. Reconnect Google Calendar and Tasks.")
    token = response.json().get("access_token")
    if not token:
        raise HTTPException(502, "Google did not return an access token. Reconnect Google.")
    return str(token)


def _google_error(response: httpx.Response) -> HTTPException:
    if response.status_code in {401, 403}:
        return HTTPException(502, "Google rejected the sync authorization. Reconnect Google and verify both APIs are enabled.")
    return HTTPException(502, "Google Calendar or Tasks could not be synchronized. Please retry.")


def _task_body(occurrence: Occurrence, habit: Habit) -> dict:
    body = {
        "title": habit.name,
        "notes": f"Bosla habit occurrence {occurrence.id}\nScheduled at {habit.scheduled_time}",
        "due": f"{occurrence.date}T00:00:00.000Z",
        "status": "completed" if occurrence.completed else "needsAction",
    }
    if occurrence.completed:
        body["completed"] = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    return body


def _event_body(occurrence: Occurrence, habit: Habit, settings: Settings) -> dict:
    start = datetime.fromisoformat(f"{occurrence.date}T{habit.scheduled_time}:00")
    end = start + timedelta(minutes=occurrence.target_minutes)
    return {
        "summary": f"Bosla: {habit.name}",
        "description": "Habit reminder mirrored from Bosla. Completion is synchronized through Google Tasks.",
        "start": {"dateTime": start.isoformat(), "timeZone": settings.google_sync_timezone},
        "end": {"dateTime": end.isoformat(), "timeZone": settings.google_sync_timezone},
        "extendedProperties": {"private": {"boslaOccurrenceId": occurrence.id}},
    }


def _merge_task_completion(occurrence: Occurrence, remote_completed: bool, last_synced_completed: bool) -> bool:
    """Import a remote-only change; a simultaneous local change wins deterministically."""
    local_changed = occurrence.completed != last_synced_completed
    remote_changed = remote_completed != last_synced_completed
    if not remote_changed or local_changed:
        return False
    occurrence.completed = remote_completed
    if remote_completed and occurrence.logged_minutes == 0:
        occurrence.logged_minutes = occurrence.target_minutes
        occurrence.origin = "assumed"
    elif not remote_completed:
        occurrence.logged_minutes = 0
        occurrence.origin = None
    return True


def _task_url(connection: GoogleIntegration, task_id: str | None = None) -> str:
    base = f"https://tasks.googleapis.com/tasks/v1/lists/{quote(connection.tasklist_id, safe='')}/tasks"
    return f"{base}/{quote(task_id, safe='')}" if task_id else base


def _completion_patch(completed: bool) -> dict:
    if completed:
        return {"status": "completed", "completed": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")}
    return {"status": "needsAction", "completed": None}


async def push_occurrence_completion(db: AsyncSession, user_id: str, occurrence: Occurrence) -> None:
    """Mirror one local tick/untick to its Google Task straight away; the next pull retries failures."""
    link = (
        await db.execute(select(GoogleSyncLink).where(GoogleSyncLink.user_id == user_id, GoogleSyncLink.occurrence_id == occurrence.id))
    ).scalar_one_or_none()
    if link is None or not link.task_id or link.last_synced_completed == occurrence.completed:
        return
    connection = (await db.execute(select(GoogleIntegration).where(GoogleIntegration.user_id == user_id))).scalar_one_or_none()
    if connection is None:
        return
    settings = get_settings()
    async with httpx.AsyncClient(timeout=8) as client:
        token = await _access_token(connection, settings, client)
        response = await client.patch(
            _task_url(connection, link.task_id),
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            json=_completion_patch(occurrence.completed),
        )
        if response.status_code >= 400:
            raise _google_error(response)
    link.last_synced_completed = occurrence.completed
    await db.commit()


@router.post("/pull")
async def pull_google(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> dict:
    """Incremental two-way reconcile for background auto-sync.

    Google Tasks has no push notifications, so the app calls this on open, on focus, and on
    an interval. It lists only tasks changed since the last sync instead of fetching each one.
    """
    settings = get_settings()
    connection = (await db.execute(select(GoogleIntegration).where(GoogleIntegration.user_id == user.id))).scalar_one_or_none()
    if connection is None:
        raise HTTPException(409, "Connect Google Calendar and Tasks before syncing.")

    started_at = datetime.utcnow()
    links = list((await db.execute(select(GoogleSyncLink).where(GoogleSyncLink.user_id == user.id))).scalars().all())
    links_by_task = {link.task_id: link for link in links if link.task_id}
    linked_occurrences = {link.occurrence_id for link in links if link.task_id}
    imported_completions = pushed_completions = created_tasks = 0

    async with httpx.AsyncClient(timeout=20) as client:
        token = await _access_token(connection, settings, client)
        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

        params = {"showCompleted": "true", "showHidden": "true", "maxResults": "100"}
        if connection.last_sync_at:
            # A small overlap covers clock skew; re-reading an unchanged task is a no-op.
            since = connection.last_sync_at - timedelta(minutes=2)
            params["updatedMin"] = since.replace(tzinfo=timezone.utc).isoformat().replace("+00:00", "Z")
        while True:
            response = await client.get(_task_url(connection), headers=headers, params=params)
            if response.status_code >= 400:
                raise _google_error(response)
            payload = response.json()
            for task in payload.get("items", []):
                link = links_by_task.get(task.get("id"))
                if link is None:
                    continue
                occurrence = await db.get(Occurrence, link.occurrence_id)
                if occurrence is None:
                    continue
                remote_completed = task.get("status") == "completed"
                if _merge_task_completion(occurrence, remote_completed, link.last_synced_completed):
                    imported_completions += 1
                elif occurrence.completed != remote_completed:
                    # The local change wins (it never reached Google, or both sides changed).
                    patch = await client.patch(_task_url(connection, link.task_id), headers=headers, json=_completion_patch(occurrence.completed))
                    if patch.status_code >= 400:
                        raise _google_error(patch)
                    pushed_completions += 1
                link.last_synced_completed = occurrence.completed
            if not payload.get("nextPageToken"):
                break
            params["pageToken"] = payload["nextPageToken"]

        # Local ticks whose instant push failed are not in Google's "updated" list; resend them.
        unsent = (
            await db.execute(
                select(GoogleSyncLink, Occurrence)
                .join(Occurrence, Occurrence.id == GoogleSyncLink.occurrence_id)
                .where(
                    GoogleSyncLink.user_id == user.id,
                    GoogleSyncLink.task_id.is_not(None),
                    GoogleSyncLink.last_synced_completed != Occurrence.completed,
                )
            )
        ).all()
        for link, occurrence in unsent:
            patch = await client.patch(_task_url(connection, link.task_id), headers=headers, json=_completion_patch(occurrence.completed))
            if patch.status_code == 404:
                continue
            if patch.status_code >= 400:
                raise _google_error(patch)
            link.last_synced_completed = occurrence.completed
            pushed_completions += 1

        # Keep the coming week mirrored so auto-sync never runs past the last manual sync window.
        start_date = date.today()
        end_date = start_date + timedelta(days=7)
        habits = list((await db.execute(select(Habit).where(Habit.user_id == user.id, Habit.archived == False))).scalars().all())  # noqa: E712
        for habit in habits:
            await _ensure_occurrences(db, habit, start_date.isoformat(), end_date.isoformat())
        habit_by_id = {habit.id: habit for habit in habits}
        upcoming = (
            await db.execute(
                select(Occurrence)
                .join(Habit)
                .where(Habit.user_id == user.id, Occurrence.date >= start_date.isoformat(), Occurrence.date <= end_date.isoformat())
            )
        ).scalars().all()
        existing_links = {link.occurrence_id: link for link in links}
        for occurrence in upcoming:
            habit = habit_by_id.get(occurrence.habit_id)
            if habit is None or occurrence.id in linked_occurrences:
                continue
            link = existing_links.get(occurrence.id)
            if link is None:
                link = GoogleSyncLink(user_id=user.id, occurrence_id=occurrence.id, last_synced_completed=occurrence.completed)
                db.add(link)
            response = await client.post(_task_url(connection), headers=headers, json=_task_body(occurrence, habit))
            if response.status_code >= 400:
                raise _google_error(response)
            link.task_id = str(response.json()["id"])
            if not link.calendar_event_id:
                response = await client.post(
                    f"https://www.googleapis.com/calendar/v3/calendars/{quote(connection.calendar_id, safe='')}/events",
                    headers=headers,
                    json=_event_body(occurrence, habit, settings),
                )
                if response.status_code >= 400:
                    raise _google_error(response)
                link.calendar_event_id = str(response.json()["id"])
            link.last_synced_completed = occurrence.completed
            created_tasks += 1

    connection.last_sync_at = started_at
    await db.commit()
    return {
        "imported_completions": imported_completions,
        "pushed_completions": pushed_completions,
        "created_tasks": created_tasks,
        "last_sync_at": connection.last_sync_at.isoformat(),
    }


@router.get("/status")
async def google_status(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> dict:
    settings = get_settings()
    configured, reason = _configuration(settings)
    connection = (await db.execute(select(GoogleIntegration).where(GoogleIntegration.user_id == user.id))).scalar_one_or_none()
    return {
        "configured": configured,
        "configuration_error": reason,
        "connected": connection is not None,
        "scopes": connection.scopes.split() if connection else [],
        "last_sync_at": connection.last_sync_at.isoformat() if connection and connection.last_sync_at else None,
    }


@router.get("/start")
async def google_start(user: User = Depends(get_current_user)) -> RedirectResponse:
    settings = get_settings()
    _fernet(settings)
    state = secrets.token_urlsafe(32)
    query = urlencode(
        {
            "client_id": settings.google_sync_client_id,
            "redirect_uri": settings.google_sync_redirect_uri,
            "response_type": "code",
            "scope": " ".join(SYNC_SCOPES),
            "state": state,
            "access_type": "offline",
            "include_granted_scopes": "true",
            "prompt": "consent",
            "login_hint": user.email,
        }
    )
    response = RedirectResponse(f"{GOOGLE_AUTH_URL}?{query}")
    response.set_cookie(
        "bosla_google_sync_state",
        state,
        httponly=True,
        secure=settings.session_cookie_secure,
        samesite=settings.session_cookie_samesite,
        max_age=600,
    )
    return response


@router.get("/callback")
async def google_callback(
    code: str,
    state: str,
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> RedirectResponse:
    settings = get_settings()
    _fernet(settings)
    cookie_state = request.cookies.get("bosla_google_sync_state", "")
    if not cookie_state or not hmac.compare_digest(state, cookie_state):
        raise HTTPException(400, "Invalid Google sync state. Please reconnect.")

    async with httpx.AsyncClient(timeout=20) as client:
        response = await client.post(
            GOOGLE_TOKEN_URL,
            data={
                "code": code,
                "client_id": settings.google_sync_client_id,
                "client_secret": settings.google_sync_client_secret,
                "redirect_uri": settings.google_sync_redirect_uri,
                "grant_type": "authorization_code",
            },
        )
    if response.status_code >= 400:
        raise HTTPException(502, "Google connection failed. Verify the redirect URI and consent-screen configuration.")
    payload = response.json()
    granted_scopes = set(str(payload.get("scope", "")).split())
    if not set(SYNC_SCOPES).issubset(granted_scopes):
        raise HTTPException(400, "Calendar and Tasks permissions are both required for synchronization.")

    connection = (await db.execute(select(GoogleIntegration).where(GoogleIntegration.user_id == user.id))).scalar_one_or_none()
    refresh_token = payload.get("refresh_token")
    if connection is None and not refresh_token:
        raise HTTPException(400, "Google did not return offline access. Reconnect and approve access again.")
    if connection is None:
        connection = GoogleIntegration(user_id=user.id, refresh_token_encrypted=_encrypt_refresh_token(str(refresh_token), settings))
        db.add(connection)
    elif refresh_token:
        connection.refresh_token_encrypted = _encrypt_refresh_token(str(refresh_token), settings)
    connection.scopes = " ".join(sorted(granted_scopes))
    connection.tasklist_id = settings.google_tasks_list_id
    connection.calendar_id = settings.google_calendar_id
    await db.commit()

    redirect = RedirectResponse(f"{settings.web_app_url.rstrip('/')}/settings?google=connected")
    redirect.delete_cookie("bosla_google_sync_state")
    return redirect


@router.post("/sync")
async def sync_google(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> dict:
    settings = get_settings()
    connection = (await db.execute(select(GoogleIntegration).where(GoogleIntegration.user_id == user.id))).scalar_one_or_none()
    if connection is None:
        raise HTTPException(409, "Connect Google Calendar and Tasks before syncing.")

    start_date = date.today()
    end_date = start_date + timedelta(days=30)
    habits = list((await db.execute(select(Habit).where(Habit.user_id == user.id, Habit.archived == False))).scalars().all())  # noqa: E712
    for habit in habits:
        await _ensure_occurrences(db, habit, start_date.isoformat(), end_date.isoformat())

    occurrences = list(
        (
            await db.execute(
                select(Occurrence)
                .join(Habit)
                .where(Habit.user_id == user.id, Occurrence.date >= start_date.isoformat(), Occurrence.date <= end_date.isoformat())
                .order_by(Occurrence.date)
            )
        ).scalars().all()
    )
    habit_by_id = {habit.id: habit for habit in habits}
    existing_links = list((await db.execute(select(GoogleSyncLink).where(GoogleSyncLink.user_id == user.id))).scalars().all())
    links = {link.occurrence_id: link for link in existing_links}
    tasklist = quote(connection.tasklist_id, safe="")
    calendar = quote(connection.calendar_id, safe="")
    created_tasks = updated_tasks = created_events = updated_events = imported_completions = 0

    async with httpx.AsyncClient(timeout=20) as client:
        token = await _access_token(connection, settings, client)
        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
        for occurrence in occurrences:
            habit = habit_by_id.get(occurrence.habit_id)
            if habit is None:
                continue
            link = links.get(occurrence.id)
            if link is None:
                link = GoogleSyncLink(user_id=user.id, occurrence_id=occurrence.id, last_synced_completed=occurrence.completed)
                db.add(link)
                links[occurrence.id] = link

            remote_task = None
            if link.task_id:
                task_url = f"https://tasks.googleapis.com/tasks/v1/lists/{tasklist}/tasks/{quote(link.task_id, safe='')}"
                response = await client.get(task_url, headers=headers)
                if response.status_code == 200:
                    remote_task = response.json()
                elif response.status_code != 404:
                    raise _google_error(response)

            if remote_task is not None:
                remote_completed = remote_task.get("status") == "completed"
                if _merge_task_completion(occurrence, remote_completed, link.last_synced_completed):
                    imported_completions += 1

            task_body = _task_body(occurrence, habit)
            if link.task_id and remote_task is not None:
                response = await client.patch(
                    f"https://tasks.googleapis.com/tasks/v1/lists/{tasklist}/tasks/{quote(link.task_id, safe='')}",
                    headers=headers,
                    json=task_body,
                )
                if response.status_code >= 400:
                    raise _google_error(response)
                updated_tasks += 1
            else:
                response = await client.post(
                    f"https://tasks.googleapis.com/tasks/v1/lists/{tasklist}/tasks",
                    headers=headers,
                    json=task_body,
                )
                if response.status_code >= 400:
                    raise _google_error(response)
                link.task_id = str(response.json()["id"])
                created_tasks += 1

            event_body = _event_body(occurrence, habit, settings)
            if link.calendar_event_id:
                response = await client.patch(
                    f"https://www.googleapis.com/calendar/v3/calendars/{calendar}/events/{quote(link.calendar_event_id, safe='')}",
                    headers=headers,
                    json=event_body,
                )
                if response.status_code == 404:
                    link.calendar_event_id = None
                elif response.status_code >= 400:
                    raise _google_error(response)
                else:
                    updated_events += 1
            if not link.calendar_event_id:
                response = await client.post(
                    f"https://www.googleapis.com/calendar/v3/calendars/{calendar}/events",
                    headers=headers,
                    json=event_body,
                )
                if response.status_code >= 400:
                    raise _google_error(response)
                link.calendar_event_id = str(response.json()["id"])
                created_events += 1
            link.last_synced_completed = occurrence.completed

    connection.last_sync_at = datetime.utcnow()
    await db.commit()
    return {
        "occurrences": len(occurrences),
        "created_tasks": created_tasks,
        "updated_tasks": updated_tasks,
        "created_events": created_events,
        "updated_events": updated_events,
        "imported_completions": imported_completions,
        "last_sync_at": connection.last_sync_at.isoformat(),
    }


@router.delete("")
async def disconnect_google(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> Response:
    settings = get_settings()
    connection = (await db.execute(select(GoogleIntegration).where(GoogleIntegration.user_id == user.id))).scalar_one_or_none()
    if connection is None:
        return Response(status_code=204)
    refresh_token = _decrypt_refresh_token(connection.refresh_token_encrypted, settings)
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            await client.post(GOOGLE_REVOKE_URL, params={"token": refresh_token})
    except httpx.HTTPError:
        pass
    await db.execute(delete(GoogleSyncLink).where(GoogleSyncLink.user_id == user.id))
    await db.delete(connection)
    await db.commit()
    return Response(status_code=204)
