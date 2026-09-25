import io
import json
import unittest
from datetime import date, timedelta
from unittest.mock import patch

import httpx
import pypdf
from cryptography.fernet import Fernet
from fastapi import HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.ai.career_discovery import normalise_discovery_turn, stream_discovery_turn
from app.ai import career_discovery as career_ai
from app.ai import goal_planner as goal_ai
from app.ai.base import AiError
from app.ai.groq_client import GroqAiClient
from app.ai.personal_knowledge import retrieve_context, store_documents
from app import habit_engine
from app.config import Settings
from app.db import Base, _migrate_habit_goal_foreign_key, get_db
from app.deps import get_current_user
from app.main import app
from app.models import Assessment, CareerMatch, DiscoveryMessage, DiscoveryProfile, Goal, GoogleIntegration, GoogleSyncLink, Habit, MentorMessage, Occurrence, Roadmap, Todo, User, UserDocument
from app.routers.career import generate_matches, get_mentor_messages, mentor_chat, send_discovery_message, start_discovery
from app.routers.goals import commit_goal, delete_goal
from app.routers.google_sync import _encrypt_refresh_token, pull_google, sync_google
from app.routers.auth import delete_account, google_callback, google_start
from app.routers.habits import create_todo, list_todos, log_occurrence, progress, set_todo_completion, today_habits
from app.schemas import CommitGoalRequest, DiscoverySendRequest, DiscoveryStartRequest, LogOccurrenceRequest, MentorChatRequest, TodoCompletionRequest, TodoCreateRequest


class _SummaryOnlyAi:
    async def stream_chat(self, *_args, **_kwargs):
        yield "## What we learned\nYou enjoy analytical work and leading teams."


class _MentorAi:
    def __init__(self):
        self.histories = []
        self.systems = []

    async def stream_chat(self, system, messages, **_kwargs):
        self.systems.append(system)
        self.histories.append(messages)
        yield "Based on your profile, build a small data "
        yield "project this week and review what you learned."


class MvpRegressionsTest(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.engine = create_async_engine("sqlite+aiosqlite:///:memory:")
        async with self.engine.begin() as connection:
            await connection.run_sync(Base.metadata.create_all)
        self.sessions = async_sessionmaker(self.engine, expire_on_commit=False)

    async def asyncTearDown(self):
        app.dependency_overrides.clear()
        await self.engine.dispose()

    async def test_five_completion_reversions_have_no_xp_drift(self):
        async with self.sessions() as db:
            user = User(email="recompute@example.com", name="Recompute")
            db.add(user)
            await db.flush()
            habit = Habit(
                user_id=user.id, name="Practice Python", recurrence={"kind": "everyN", "n": 1,
                "anchor": date.today().isoformat()}, scheduled_time="10:00", baseline_minutes=30,
                difficulty_level=1,
            )
            db.add(habit)
            await db.commit()
            occurrence = (await today_habits(user=user, db=db))[0]
            baseline = (await progress(user=user, db=db))["total_xp"]
            self.assertEqual(baseline, 0)
            single_completion_xp = None
            for _ in range(5):
                completed = await log_occurrence(
                    occurrence.id, LogOccurrenceRequest(completed=True), user=user, db=db,
                )
                self.assertEqual(completed.origin, "assumed")
                current_xp = (await progress(user=user, db=db))["total_xp"]
                if single_completion_xp is None:
                    single_completion_xp = current_xp
                self.assertEqual(current_xp, single_completion_xp)
                await log_occurrence(
                    occurrence.id, LogOccurrenceRequest(completed=False), user=user, db=db,
                )
                self.assertEqual((await progress(user=user, db=db))["total_xp"], baseline)

    def test_weekly_targets_are_proposals_and_conflicts_are_deterministic(self):
        raise_target = habit_engine.propose_adjustment("Practice", 30, 1, 90, 7)
        lower_target = habit_engine.propose_adjustment("Practice", 30, 2, 60, 7)
        self.assertEqual((raise_target.direction, raise_target.proposed_level), ("raise", 2))
        self.assertEqual((lower_target.direction, lower_target.proposed_level), ("reduce", 1))
        candidate = goal_ai.GoalSession("Python", [1, 3], "10:15", 30, None)
        occupied = goal_ai.OccupiedBlock("Existing habit", [1, 2], 600, 630)
        clashes = goal_ai.find_schedule_conflicts([candidate], [occupied])
        self.assertEqual(len(clashes), 1)
        self.assertEqual(clashes[0].days, [1])

    async def test_discovery_always_emits_one_question(self):
        history = [{"role": "user", "content": "I enjoy data science."}]
        answer = "".join([
            chunk async for chunk in stream_discovery_turn(
                _SummaryOnlyAi(), persona="graduate", evidence_context=None, history=history
            )
        ])
        self.assertEqual(answer.count("?"), 1)
        self.assertLessEqual(len(answer.split()), 60)
        self.assertNotIn("What we learned", answer)
        self.assertEqual(normalise_discovery_turn("What did you build? What did you enjoy?", history), "What did you build?")

    async def test_discovery_cannot_exceed_twenty_user_turns(self):
        async with self.sessions() as db:
            user = User(email="twenty@example.com", name="Twenty")
            db.add(user)
            await db.flush()
            db.add_all([
                DiscoveryMessage(user_id=user.id, role="user", content=f"Answer {index}")
                for index in range(20)
            ])
            await db.commit()
            with self.assertRaises(HTTPException) as limit:
                await send_discovery_message(
                    DiscoverySendRequest(message="Another answer"), user=user, db=db, ai=_SummaryOnlyAi()
                )
            self.assertEqual(limit.exception.status_code, 409)

    async def test_discovery_provider_failure_does_not_save_half_a_turn(self):
        async with self.sessions() as db:
            user = User(email="failure@example.com", name="Failure")
            db.add(user)
            await db.commit()
            user_id = user.id
            await start_discovery(DiscoveryStartRequest(persona="graduate"), user=user, db=db)
            response = await send_discovery_message(
                DiscoverySendRequest(message="I like careful research."), user=user, db=db, ai=_SummaryOnlyAi()
            )
            events = b"".join([event async for event in response.body_iterator]).decode()
            self.assertIn("event: error", events)
            saved = (await db.execute(select(DiscoveryMessage).where(DiscoveryMessage.user_id == user_id))).scalars().all()
            self.assertEqual([item.role for item in saved], ["assistant"])

    async def test_restart_removes_stale_guidance_but_keeps_evidence_and_habits(self):
        async with self.sessions() as db:
            user = User(email="restart@example.com", name="Restart")
            db.add(user)
            await db.flush()
            await store_documents(db, user_id=user.id, sources=[(
                "thoughts", "career-note.txt", "text/plain", "I enjoy environmental data.", None, "native"
            )])
            habit = Habit(user_id=user.id, name="Read SQL", recurrence={"kind": "weekly", "days": [1]})
            db.add(habit)
            match = CareerMatch(user_id=user.id, rank=1, title="Data Analyst", fit_score=80, why="Past answers", uncertainty_note="More evidence needed")
            db.add(match)
            await db.flush()
            db.add_all([
                Assessment(user_id=user.id, text="Old assessment"),
                Roadmap(user_id=user.id, match_id=match.id, direction="Data Analyst", steps=[]),
                MentorMessage(user_id=user.id, match_id=match.id, role="assistant", content="Old advice"),
                DiscoveryMessage(user_id=user.id, role="user", content="Old answer"),
                DiscoveryProfile(user_id=user.id, status="complete"),
            ])
            await db.commit()
            opening = await start_discovery(DiscoveryStartRequest(persona="graduate"), user=user, db=db)
            self.assertIn("What part", opening["content"])
            self.assertEqual((await db.execute(select(Assessment))).scalars().all(), [])
            self.assertEqual((await db.execute(select(CareerMatch))).scalars().all(), [])
            self.assertEqual((await db.execute(select(Roadmap))).scalars().all(), [])
            self.assertEqual((await db.execute(select(MentorMessage))).scalars().all(), [])
            self.assertEqual(len((await db.execute(select(UserDocument))).scalars().all()), 1)
            self.assertIsNotNone(await db.get(Habit, habit.id))

    async def test_regenerating_matches_replaces_dependent_guidance_without_fk_failure(self):
        async with self.sessions() as db:
            user = User(email="regenerate@example.com", name="Regenerate")
            db.add(user)
            await db.flush()
            db.add(Assessment(user_id=user.id, text="Current assessment"))
            db.add(DiscoveryProfile(
                user_id=user.id, status="complete", interests_confidence="medium",
                strengths_confidence="medium", skills_confidence="medium",
            ))
            old = CareerMatch(
                user_id=user.id, rank=1, title="Old role", fit_score=70,
                why="Old rationale", uncertainty_note="Old uncertainty",
            )
            db.add(old)
            await db.flush()
            db.add(Roadmap(user_id=user.id, match_id=old.id, direction="Old role", steps=[]))
            db.add(MentorMessage(user_id=user.id, match_id=old.id, role="assistant", content="Old answer"))
            await db.commit()

            async def fresh_matches(*_args, **_kwargs):
                market = career_ai.MarketContextOut(
                    salary="", location="", remote="", demand="", source="", as_of=""
                )
                return [
                    career_ai.CareerMatchOut(
                        title=f"New role {index}", fit_score=90 - index, why="Evidence-based fit",
                        uncertainty_note="Needs more practice", market=market,
                    )
                    for index in range(3)
                ]

            with patch("app.routers.career.get_ai_client", return_value=object()), patch(
                "app.routers.career.cd.generate_career_matches", side_effect=fresh_matches
            ):
                result = await generate_matches(user=user, db=db)
            self.assertEqual(len(result), 3)
            self.assertEqual((await db.execute(select(Roadmap))).scalars().all(), [])
            self.assertEqual((await db.execute(select(MentorMessage))).scalars().all(), [])
            self.assertEqual(len((await db.execute(select(CareerMatch))).scalars().all()), 3)

    async def test_sparse_profile_does_not_force_career_matches(self):
        async with self.sessions() as db:
            user = User(email="sparse@example.com", name="Sparse")
            db.add(user)
            await db.flush()
            db.add(Assessment(user_id=user.id, text="Very little concrete evidence."))
            db.add(DiscoveryProfile(user_id=user.id, status="complete", exchange_count=20))
            await db.commit()
            with patch("app.routers.career.get_ai_client", side_effect=AssertionError("AI should not be called")):
                self.assertEqual(await generate_matches(user=user, db=db), [])

    async def test_sessions_resist_forgery_and_retrieval_is_account_scoped(self):
        async def session_dependency():
            async with self.sessions() as db:
                yield db

        app.dependency_overrides[get_db] = session_dependency
        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as account_a:
            first = await account_a.post("/auth/register", json={
                "email": "qa-a@example.com", "name": "Account A", "password": "safe-password-a"
            })
            self.assertEqual(first.status_code, 201)
            a_id = first.json()["id"]
            token = account_a.cookies.get("bosla_user")
            self.assertTrue(token)
            self.assertNotEqual(token, a_id)
            self.assertEqual((await account_a.get("/auth/me")).status_code, 200)

            async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as account_b:
                second = await account_b.post("/auth/register", json={
                    "email": "qa-b@example.com", "name": "Account B", "password": "safe-password-b"
                })
                self.assertEqual(second.status_code, 201)
                b_id = second.json()["id"]
                self.assertNotEqual(a_id, b_id)
                async with self.sessions() as db:
                    await store_documents(db, user_id=a_id, sources=[(
                        "thoughts", "private-note.txt", "text/plain",
                        "My secret project is Violet Narwhal Observatory.", None, "native"
                    )])
                    db.add(Assessment(user_id=a_id, text="Data analysis<br>Portfolio practice"))
                    await db.commit()
                    a_context = await retrieve_context(db, user_id=a_id, query="Violet Narwhal Observatory")
                    b_context = await retrieve_context(db, user_id=b_id, query="Violet Narwhal Observatory")
                self.assertIn("Violet Narwhal Observatory", a_context)
                self.assertNotIn("Violet Narwhal Observatory", b_context)
                self.assertEqual((await account_b.get("/career/documents")).json(), [])
                pdf_response = await account_a.get("/career/report.pdf")
                self.assertEqual(pdf_response.status_code, 200)
                self.assertEqual(pdf_response.headers["content-type"], "application/pdf")
                report_text = "\n".join(page.extract_text() or "" for page in pypdf.PdfReader(io.BytesIO(pdf_response.content)).pages)
                self.assertIn("Portfolio practice", report_text)
                self.assertNotIn("<br>", report_text)
                async with self.sessions() as db:
                    db.add(DiscoveryProfile(user_id=b_id, status="complete"))
                    db.add(Assessment(user_id=b_id, text="Account B is exploring writing."))
                    await db.commit()
                    mentor_ai = _MentorAi()
                    with patch("app.routers.career.get_ai_client", return_value=mentor_ai):
                        answer = await mentor_chat(
                            MentorChatRequest(message="Tell me about Violet Narwhal Observatory"),
                            user=await db.get(User, b_id), db=db,
                        )
                        _ = b"".join([event async for event in answer.body_iterator])
                    self.assertNotIn("Violet Narwhal Observatory", mentor_ai.systems[0])

            async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as forged:
                forged.cookies.set("bosla_user", a_id)
                self.assertEqual((await forged.get("/auth/me")).status_code, 401)
            self.assertEqual((await account_a.post("/auth/signout")).status_code, 200)
            account_a.cookies.set("bosla_user", token)
            self.assertEqual((await account_a.get("/auth/me")).status_code, 401)

    async def test_todos_carry_forward_but_subtasks_do_not_and_goal_delete_preserves_history(self):
        today = date.today()
        yesterday = (today - timedelta(days=1)).isoformat()
        tomorrow = (today + timedelta(days=1)).isoformat()
        async with self.sessions() as db:
            user = User(email="tasks@example.com", name="Tasks")
            other = User(email="other@example.com", name="Other")
            db.add_all([user, other])
            await db.flush()
            goal = Goal(user_id=user.id, title="Learn Python", plan={})
            db.add(goal)
            await db.flush()
            habit = Habit(
                user_id=user.id, goal_id=goal.id, name="Python practice",
                recurrence={"kind": "weekly", "days": [today.isoweekday()]},
            )
            db.add(habit)
            await db.flush()
            occurrence = Occurrence(habit_id=habit.id, date=today.isoformat(), target_minutes=30)
            db.add(occurrence)
            await db.commit()

            manual = await create_todo(
                TodoCreateRequest(title="Review notes", due_date=yesterday, goal_id=goal.id), user=user, db=db
            )
            subtask = await create_todo(
                TodoCreateRequest(title="Finish exercise", occurrence_id=occurrence.id), user=user, db=db
            )
            today_items = await list_todos(today.isoformat(), user=user, db=db)
            self.assertEqual({item.id for item in today_items}, {manual.id, subtask.id})
            self.assertTrue(next(item for item in today_items if item.id == manual.id).carried_forward)
            tomorrow_items = await list_todos(tomorrow, user=user, db=db)
            self.assertEqual([item.id for item in tomorrow_items], [manual.id])
            self.assertEqual(await list_todos(today.isoformat(), user=other, db=db), [])
            with self.assertRaises(HTTPException) as denied:
                await set_todo_completion(manual.id, TodoCompletionRequest(completed=True), user=other, db=db)
            self.assertEqual(denied.exception.status_code, 404)

            await delete_goal(goal.id, user=user, db=db)
            self.assertIsNone(await db.get(Goal, goal.id))
            self.assertIsNone((await db.get(Habit, habit.id)).goal_id)
            self.assertIsNone((await db.get(Todo, manual.id)).goal_id)
            self.assertIsNone((await db.get(Todo, subtask.id)).goal_id)
            self.assertIsNotNone(await db.get(Occurrence, occurrence.id))
            await set_todo_completion(manual.id, TodoCompletionRequest(completed=True), user=user, db=db)
            self.assertEqual(await list_todos(tomorrow, user=user, db=db), [])

    async def test_account_deletion_removes_records_in_fk_safe_order(self):
        async with self.sessions() as db:
            user = User(email="remove@example.com", name="Remove")
            db.add(user)
            await db.flush()
            match = CareerMatch(
                user_id=user.id, rank=1, title="Data analyst", fit_score=80,
                why="Evidence", uncertainty_note="More evidence needed",
            )
            goal = Goal(user_id=user.id, title="Build portfolio", plan={})
            db.add_all([match, goal])
            await db.flush()
            habit = Habit(user_id=user.id, goal_id=goal.id, name="Portfolio practice", recurrence={})
            db.add(habit)
            await db.flush()
            occurrence = Occurrence(habit_id=habit.id, date=date.today().isoformat(), target_minutes=30)
            db.add(occurrence)
            await db.flush()
            db.add_all([
                MentorMessage(user_id=user.id, match_id=match.id, role="user", content="Why this role?"),
                Roadmap(user_id=user.id, match_id=match.id, direction=match.title, steps=[]),
                Todo(user_id=user.id, goal_id=goal.id, occurrence_id=occurrence.id, title="Ship", due_date=date.today().isoformat()),
                GoogleSyncLink(user_id=user.id, occurrence_id=occurrence.id),
            ])
            await store_documents(db, user_id=user.id, sources=[
                ("project", "private-project.txt", "text/plain", "Private evidence", None, "native")
            ])
            await db.commit()

            response = await delete_account(user=user, db=db)
            self.assertEqual(response.status_code, 204)
            self.assertIsNone(await db.get(User, user.id))
            self.assertEqual((await db.execute(select(CareerMatch))).scalars().all(), [])
            self.assertEqual((await db.execute(select(Roadmap))).scalars().all(), [])
            self.assertEqual((await db.execute(select(MentorMessage))).scalars().all(), [])
            self.assertEqual((await db.execute(select(Habit))).scalars().all(), [])
            self.assertEqual((await db.execute(select(Occurrence))).scalars().all(), [])
            self.assertEqual((await db.execute(select(Todo))).scalars().all(), [])
            self.assertEqual((await db.execute(select(UserDocument))).scalars().all(), [])

    def test_new_habit_goal_fk_declares_set_null(self):
        constraint = next(foreign_key for foreign_key in Habit.__table__.foreign_keys if foreign_key.parent.name == "goal_id")
        self.assertEqual(constraint.ondelete, "SET NULL")

    def test_existing_postgres_foreign_key_is_migrated(self):
        class FakeInspector:
            def get_foreign_keys(self, _table):
                return [{"constrained_columns": ["goal_id"], "options": {"ondelete": None}, "name": "habits_goal_id_fkey"}]

        class FakeConnection:
            dialect = type("Dialect", (), {"identifier_preparer": type("Quoter", (), {"quote": lambda self, value: value})()})()

            def __init__(self):
                self.statements = []

            def execute(self, statement):
                self.statements.append(str(statement))

        connection = FakeConnection()
        with patch("app.db.inspect", return_value=FakeInspector()):
            _migrate_habit_goal_foreign_key(connection)
        self.assertEqual(len(connection.statements), 2)
        self.assertIn("DROP CONSTRAINT", connection.statements[0])
        self.assertIn("ON DELETE SET NULL", connection.statements[1])

    async def test_goal_commit_creates_habit_and_todo_once(self):
        async with self.sessions() as db:
            user = User(email="plan@example.com", name="Plan")
            db.add(user)
            await db.flush()
            goal = Goal(user_id=user.id, title="Learn Python", plan={
                "sessions": [{"name": "Python tutorial", "days": [1, 3], "scheduledTime": "18:00", "targetMinutes": 30}],
                "milestones": [{"title": "Finish first exercise", "dueDate": date.today().isoformat()}],
            })
            db.add(goal)
            await db.commit()
            first = await commit_goal(CommitGoalRequest(goal_id=goal.id), user=user, db=db)
            second = await commit_goal(CommitGoalRequest(goal_id=goal.id), user=user, db=db)
            self.assertEqual(first, second)
            tasks = await list_todos(date.today().isoformat(), user=user, db=db)
            self.assertEqual(len(tasks), 1)
            self.assertEqual(tasks[0].title, "Finish first exercise")

    async def test_mentor_stream_persists_history_across_turns(self):
        ai = _MentorAi()
        async with self.sessions() as db:
            user = User(email="mentor@example.com", name="Mentor")
            db.add(user)
            await db.flush()
            db.add(DiscoveryProfile(user_id=user.id, status="complete"))
            db.add(Assessment(user_id=user.id, text="The user is exploring data analysis."))
            await db.commit()

            with patch("app.routers.career.get_ai_client", return_value=ai):
                first = await mentor_chat(MentorChatRequest(message="What should I do this week?"), user=user, db=db)
                first_events = b"".join([event async for event in first.body_iterator]).decode()
                self.assertGreaterEqual(first_events.count("event: chunk"), 2)
                self.assertIn("event: done", first_events)
                second = await mentor_chat(MentorChatRequest(message="What did we discuss?"), user=user, db=db)
                second_events = b"".join([event async for event in second.body_iterator]).decode()
                self.assertIn("event: done", second_events)

            messages = await get_mentor_messages(user=user, db=db)
            self.assertEqual([message["role"] for message in messages], ["user", "assistant", "user", "assistant"])
            self.assertTrue(any(item["role"] == "assistant" for item in ai.histories[1][:-1]))

    async def test_exhausted_keys_try_primary_then_fallback_and_return_safe_error(self):
        ai = GroqAiClient(
            api_keys=["first-test-key", "second-test-key"], model="openai/gpt-oss-120b",
            fallback_models=["llama-3.3-70b-versatile"],
        )
        attempts = []

        async def unavailable(key, request, **_kwargs):
            attempts.append((request["model"], key))
            raise AiError("provider quota exhausted", "rate_limit")

        ai._chat_for_key = unavailable
        try:
            with self.assertRaises(AiError) as exhausted:
                await ai._chat({"model": ai.model, "messages": [{"role": "user", "content": "test"}]})
            self.assertEqual(attempts, [
                ("openai/gpt-oss-120b", "first-test-key"),
                ("openai/gpt-oss-120b", "second-test-key"),
                ("llama-3.3-70b-versatile", "first-test-key"),
                ("llama-3.3-70b-versatile", "second-test-key"),
            ])
            self.assertIn("busy", str(exhausted.exception))
            self.assertNotIn("first-test-key", str(exhausted.exception))
        finally:
            await ai._http.aclose()

    async def test_google_tasks_two_way_and_calendar_write_only_with_mock_provider(self):
        settings = Settings(
            _env_file=None, google_sync_client_id="test-client", google_sync_client_secret="test-secret",
            google_token_encryption_key=Fernet.generate_key().decode(),
        )
        tasks = {}
        events = {}

        def provider(request: httpx.Request) -> httpx.Response:
            path = request.url.path
            if path == "/token":
                return httpx.Response(200, json={"access_token": "test-access"})
            if "/tasks" in path:
                if request.method == "POST":
                    task_id = f"task-{len(tasks) + 1}"
                    tasks[task_id] = {"id": task_id, **json.loads(request.content)}
                    return httpx.Response(200, json={"id": task_id})
                if request.method == "GET" and path.endswith("/tasks"):
                    return httpx.Response(200, json={"items": list(tasks.values())})
                task_id = path.rsplit("/", 1)[-1]
                if task_id not in tasks:
                    return httpx.Response(404)
                if request.method == "PATCH":
                    tasks[task_id].update(json.loads(request.content))
                return httpx.Response(200, json=tasks[task_id])
            if "/events" in path:
                if request.method == "POST":
                    event_id = f"event-{len(events) + 1}"
                    events[event_id] = json.loads(request.content)
                    return httpx.Response(200, json={"id": event_id})
                return httpx.Response(200, json={"id": path.rsplit("/", 1)[-1]})
            raise AssertionError(f"Unexpected provider request: {request.method} {request.url}")

        original_client = httpx.AsyncClient

        def client_factory(**kwargs):
            return original_client(transport=httpx.MockTransport(provider), **kwargs)

        async with self.sessions() as db:
            user = User(email="sync@example.com", name="Sync")
            db.add(user)
            await db.flush()
            db.add(GoogleIntegration(
                user_id=user.id, refresh_token_encrypted=_encrypt_refresh_token("test-refresh", settings),
                tasklist_id="@default", calendar_id="primary",
            ))
            db.add(Habit(
                user_id=user.id, name="Practice SQL",
                recurrence={"kind": "everyN", "n": 365, "anchor": date.today().isoformat()},
                scheduled_time="10:00", baseline_minutes=30,
            ))
            await db.commit()
            with patch("app.routers.google_sync.get_settings", return_value=settings), patch(
                "app.routers.google_sync.httpx.AsyncClient", side_effect=client_factory
            ):
                first = await sync_google(user=user, db=db)
                self.assertEqual(first["created_tasks"], 1)
                self.assertEqual(first["created_events"], 1)
                task_id = next(iter(tasks))
                tasks[task_id]["status"] = "completed"
                imported = await pull_google(user=user, db=db)
                self.assertEqual(imported["imported_completions"], 1)
                occurrence = (await db.execute(select(Occurrence))).scalar_one()
                self.assertTrue(occurrence.completed)
                self.assertEqual(occurrence.origin, "assumed")
                await log_occurrence(
                    occurrence.id, LogOccurrenceRequest(completed=False), user=user, db=db
                )
                self.assertEqual(tasks[task_id]["status"], "needsAction")
                self.assertEqual(len(events), 1)

    async def test_google_signin_oauth_callback_validates_state_and_creates_session(self):
        settings = Settings(
            _env_file=None, google_client_id="test-client", google_client_secret="test-secret",
            google_redirect_uri="http://test/auth/google/callback", web_app_url="http://test",
        )

        def provider(request: httpx.Request) -> httpx.Response:
            if request.url.path == "/token":
                return httpx.Response(200, json={"access_token": "test-access"})
            if request.url.path == "/v1/userinfo":
                return httpx.Response(200, json={
                    "email": "google-user@example.com", "email_verified": True, "name": "Google User"
                })
            raise AssertionError(f"Unexpected Google OAuth request: {request.url}")

        original_client = httpx.AsyncClient

        def client_factory(**kwargs):
            return original_client(transport=httpx.MockTransport(provider), **kwargs)

        async with self.sessions() as db:
            with patch("app.routers.auth.get_settings", return_value=settings):
                start = await google_start()
                self.assertIn("accounts.google.com", start.headers["location"])
                state = start.headers["set-cookie"].split("bosla_oauth_state=", 1)[1].split(";", 1)[0]
                request = Request({"type": "http", "headers": [(b"cookie", f"bosla_oauth_state={state}".encode())]})
                with patch("app.routers.auth.httpx.AsyncClient", side_effect=client_factory):
                    callback = await google_callback("test-code", state, request, db)
                self.assertIn("/onboarding/consent", callback.headers["location"])
                session_token = callback.headers["set-cookie"].split("bosla_user=", 1)[1].split(";", 1)[0]
                user = await get_current_user(bosla_user=session_token, db=db)
                self.assertEqual(user.email, "google-user@example.com")
                self.assertEqual(user.auth_provider, "google")
                with self.assertRaises(HTTPException) as wrong_state:
                    await google_callback("test-code", "wrong-state", request, db)
                self.assertEqual(wrong_state.exception.status_code, 400)


if __name__ == "__main__":
    unittest.main()
