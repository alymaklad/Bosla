# bosla-backend

FastAPI backend for Bosla. SQLite (via SQLAlchemy async + aiosqlite) for storage. Both AI
pipelines run behind a provider-agnostic interface (`app/ai/base.py`) with two
interchangeable backends: Anthropic (the official `anthropic` SDK) and Groq (OpenAI-compatible).

```bash
python -m venv .venv
.venv/Scripts/activate        # .venv/bin/activate on macOS/Linux
pip install -r requirements.txt
cp .env.example .env          # then set AI_PROVIDER and the matching API key
uvicorn app.main:app --reload --port 8000
```

Interactive API docs at `http://127.0.0.1:8000/docs` once running.

## Choosing an AI provider

Set `AI_PROVIDER` in `.env` to `anthropic` (default) or `groq`, and set the matching key:

```bash
# Anthropic (default) — needs ANTHROPIC_API_KEY, https://console.anthropic.com
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Groq — needs GROQ_API_KEY, https://console.groq.com
AI_PROVIDER=groq
GROQ_API_KEY=gsk_...
```

Restart the server after changing it — the provider is read once at startup via
`app/deps.get_ai_client()`. The signed-in user's Settings page (`/settings`) shows which
provider is active and whether a key is configured, via `GET /settings/ai-status`.

Both backends implement the exact same `AiClient` protocol (`app/ai/base.py`), so
`goal_planner.py` and `career_discovery.py` never branch on provider — the difference is
absorbed entirely in `app/ai/client.py` (Anthropic) and `app/ai/groq_client.py` (Groq).
Two behavioral differences the Groq backend absorbs internally, ported from
`packages/ai-engines/src/goal-planner/groqClient.ts`:
- **Research** uses Groq's `groq/compound` system (server-side web search), falling back to
  `groq/compound-mini` and then a searchless pass on the plan model if both refuse.
- **Structured output** tries strict JSON-schema mode first; if the model/plan doesn't
  support it, it falls back to JSON-object mode with the schema spelled out in the prompt —
  pydantic validation is what actually guarantees the shape either way, not the mode used.
- There's no server-side web-fetch tool on Groq, so the Intervenor's link verification is a
  plain HTTP GET instead.

## What's real vs. what's scoped down

This is a genuinely working full-stack app, not a mockup — every screen in `apps/web`
reads and writes through these endpoints, there's no demo data left in the frontend. Two
scope decisions worth knowing about:

- **SQLite, not Postgres.** The PRD (§23) specifies Postgres for production; SQLite is the
  practical choice for a locally-runnable demo. Swapping `DATABASE_URL` to a Postgres DSN
  is the only change needed — SQLAlchemy's async engine handles the rest.
- **Demo auth.** `/auth/signin` looks a user up by email (creating one on first sign-in) and
  sets an `httponly` session cookie — no password. Real authentication is out of scope for
  this pass.
- **FastAPI/Python, not Node.** The PRD's §23 architecture decision named a Node/TypeScript
  backend; this implementation supersedes that for the current build per explicit
  instruction. The AI pipelines' *logic* (prompts, schemas, the Actor/Intervenor loop) is
  ported faithfully from the TypeScript versions in `../../packages/ai-engines` — see below.

## The two AI pipelines

### Goal planner (`app/ai/goal_planner.py`)

Ported from the Habit Tracking System's Actor + Intervenor + bounded-Reflexion loop (via
`../../packages/ai-engines/src/goal-planner/`). Research (web search) → draft (structured output) →
review (deterministic schedule-conflict check + independent link verification + a cold-read
critique call) → accept or revise, up to 3 iterations. `POST /goals/plan` streams progress
phases over SSE; `POST /goals/commit` turns the accepted plan's sessions into real `Habit`
rows.

### Career discovery (`app/ai/career_discovery.py`)

Ported from the Masar.ai notebook (via `../../packages/ai-engines/src/career-discovery/`): CV text
extraction, the unified assessment prompt (verbatim from the notebook), and the
mentorship chat agent with its anti-simulation guardrails (`SIMULATION_MARKERS`, filtered
both via `stop_sequences` and a client-side backstop for chunk-boundary leaks).

### Personal evidence retrieval

`POST /career/documents` accepts a user-selected PDF, DOCX, or TXT file and a source type
(`cv`, `resume`, `recommendation`, `certificate`, `project`, `thoughts`, or `journal`).
Text is chunked and stored in the user's Neon `pgvector` index. `POST /career/sources/github`
imports public profile details plus bounded, supported text files from up to 12 recent
public, non-fork projects without executing code.
The retrieval helper scopes every query to the signed-in user and supplies evidence to
discovery, assessment, matches, and mentorship; it never bypasses the discovery readiness
gate. `DELETE /career/documents/{id}` removes both the source and all of its vectors.

Set `OCR_FALLBACK_URL` and `OCR_FALLBACK_TOKEN` only after deploying the companion OCR
adapter. Native extraction remains the default, and OCR failures are reported without
exposing provider details.

Three steps are **new** — the notebook's free-form markdown output doesn't produce the
structured data this UI needs, so these are new structured-output prompts, not silent
redesigns of confirmed behavior:
- Discovery-profile extraction (interests/strengths/skills/experience/motivations, each
  with a confidence level) from the conversation transcript, run after every user turn.
- Career-match ranking: assessment text → 3–5 structured `{title, fit_score, why,
  uncertainty_note, market}` records.
- Roadmap generation: chosen direction → study/skill/portfolio steps.

## Habit engine (`app/habit_engine.py`)

A direct, dependency-free port of the Habit Tracking System's pure domain functions
(`time`, `recurrence`, `scoring`, `streaks`, `levels`, `difficulty` — see
`../../packages/ai-engines/src/habit-engine/`). Nothing here touches the database or a clock;
routers call these functions with explicit facts and persist the result. Recompute-honest:
an occurrence's status/points/XP are always derived fresh from its stored facts, never
stored redundantly.

## Structure

```
app/
  config.py, db.py, models.py, schemas.py, deps.py
  habit_engine.py            pure functions — time/recurrence/scoring/streaks/levels/difficulty
  ai/
    base.py                    the AiClient protocol + shared types both providers implement
    client.py                  Anthropic backend (research/structured/fetch_page/stream_chat)
    groq_client.py              Groq backend — same protocol, OpenAI-compatible wire format
    goal_planner.py            prompts, schema normalisation, schedule conflicts, the Reflexion loop
    career_discovery.py        CV ingestion, assessment/mentorship prompts, structured matches/roadmap
    pdf_report.py               ReportLab "Career & Mentorship Report" export
  routers/
    auth.py, career.py, goals.py, habits.py, dashboard.py, settings.py
```

## Verifying without an API key

Whichever provider `AI_PROVIDER` names needs its key set, or every AI-backed endpoint
(discovery chat, assessment, matches, roadmap, mentor chat, goal planning) returns a 500
with a clear message — `GET /settings/ai-status` reports this before you hit it blind.
Everything else (auth, habit CRUD, scoring, streaks, levels, weekly review, dashboard)
works with no key at all.
