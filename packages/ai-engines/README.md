# bosla-services

Two AI pipelines, staged and ready to be wired into the real Bosla app (PRD `PRD_Template.md`):

1. **`habit-engine/` + `goal-planner/`** — ported from the Habit Tracking System
   (`C:\Habit Tracking System`, the "Adaptive Habit League" Electron app): the
   recompute-honest scoring/streaks/XP/levels/difficulty engine, plus the AI Goals
   planner (Actor → Intervenor → Reflexion loop).
2. **`career-discovery/`** — ported from `../../reference/masar-ai/Final project (Masar) .ipynb`: CV
   ingestion, the unified assessment + skill-gap agent, the anti-simulation
   mentorship-chat agent, and PDF report export.

No Electron, no SQLite, no Gradio, no local GPU model. Plain TypeScript functions and
provider-agnostic AI clients — Bosla's real backend (Node/TypeScript + PostgreSQL, per
PRD §23) supplies the database, the HTTP layer, and API keys.

## Why this exists

The user asked for the two source projects' AI pipelines to be made ready to add to the
Bosla app, rather than integrated directly into the existing Habit Tracking System
Electron app. Bosla's decided architecture (PRD §23) is Node/TypeScript + PostgreSQL +
a four-provider AI client (OpenAI, Anthropic, OpenRouter, Groq) — neither source
project matches that shape as-is:

- The Habit Tracker is genuinely portable already: its `domain/` and most of its `ai/`
  layer are pure functions / a provider-abstracted client with no Electron coupling.
  This package copies that code with only import-path changes.
- Masar.ai's notebook runs a **local Qwen2.5-7B model on a GPU** via `transformers` +
  `bitsandbytes`, and its UI is Gradio. Neither belongs in a web backend. This package
  **reimplements** Masar.ai's prompts and behavior in TypeScript against Bosla's
  decided AI-provider roster — it is a faithful behavioral port, not a copy-paste,
  because the original code cannot run outside a Python/GPU/Colab environment.

## Layout

```
src/
  shared/types.ts        Trimmed copy of the Habit Tracker's shared type contract —
                          only the types domain/ and goal-planner/ actually use.

  habit-engine/           Ported verbatim from Habit Tracking System `src/main/domain/`.
    time.ts, recurrence.ts, scoring.ts, streaks.ts, levels.ts, difficulty.ts,
    achievements.ts, todo.ts — pure functions, no I/O, no clock (time is always a
    parameter). Bosla PRD §15 (FR-HAB-*).

  goal-planner/           Ported from Habit Tracking System `src/main/ai/`.
    anthropicClient.ts, groqClient.ts, providers.ts, goalPlanSchema.ts,
    promptBuilder.ts, scheduleConflicts.ts, intervenor.ts, goalPlanner.ts —
    the Actor → Intervenor → Reflexion loop, unchanged. Bosla PRD §9.1, §11.4
    (FR-CD-022), §15 (FR-HAB-006).
    NOT ported: `application/goalService.ts`'s Electron/SQLite repository wiring —
    that's API-specific work, intentionally left undone here.

  career-discovery/       New TypeScript port of the Masar.ai notebook.
    aiClient.ts             A general chat/stream interface (simpler than the goal
                             planner's — no research/web-fetch tools needed here).
    providers/               openaiCompatible.ts (OpenAI + OpenRouter + Groq, all
                             OpenAI-wire-compatible) + anthropicAdapter.ts + registry.ts.
    cvIngestion.ts           Cell 3: PDF text extraction (`pdf-parse`, was `pypdf`).
    assessmentAgent.ts       Cell 4: the unified assessment + skill-gap prompt, verbatim.
    mentorshipAgent.ts       Cell 5/6: the mentorship-chat agent, anti-simulation
                             guardrails and stop-markers carried over exactly.
    pdfReport.ts             Cell 6/7: PDF export (`pdfkit`, was ReportLab PLATYPUS) —
                             same sections, same colors, same fonts.
    Bosla PRD §11.5 (FR-CD-030–034), §9.2, §22/§23 (provider decision).
```

## What's deliberately NOT done here (API integration work, not a gap in the port)

- **No database.** Every function takes plain data in and returns plain data out — no
  `Db`, no repository classes. Bosla's backend decides the PostgreSQL schema (PRD §21)
  and calls these functions from its own service layer, the same way the Electron app's
  `goalService.ts` calls `goal-planner`'s `anthropicGoalPlanner(...).plan(...)` today.
- **No HTTP layer, no auth, no API-key storage.** Every AI client factory takes an
  `apiKey` argument directly; Bosla's backend is responsible for where that key comes
  from (its settings store, an env var, a secrets manager).
- **Career-discovery's output is not yet Bosla's structured schema.** The assessment
  agent returns the notebook's original markdown block (profile summary + 3 career
  directions + gap analysis in one text field), not the PRD's discrete
  `CareerRecommendation[]` with per-item uncertainty notes (FR-CD-010/011). Restructuring
  the prompt to emit that shape is new prompt-engineering work, not covered by "port the
  existing pipeline faithfully."
- **Goal-planner provider roster is Anthropic + Groq only**, not all four Bosla-decided
  providers — `research`/`fetchPage`/`judgeRelevance` depend on provider-side
  web-search/web-fetch tools that OpenAI and OpenRouter don't expose the same way. See
  the comment in `goal-planner/providers.ts`. Career-discovery's simpler client (no
  browsing) *does* cover all four, since nothing there needs a browsing tool.
- **Habit-engine's own XP/level curve is the Habit Tracker's native one**
  (`levelFloor`, `100·(n−1)·(n+2)`), not Questify's `floor(sqrt(XP/100))+1` — per Bosla
  PRD §16 FR-GAM-B06, the Questify migration is a deliberate later step (Phase 3), not
  something to silently merge in here.

## Using this package

```ts
import { habitEngine, goalPlanner, careerDiscovery } from 'bosla-services'

// Habit scoring — pure, synchronous, no setup needed.
const status = habitEngine.statusOf(facts, habitEngine.DEFAULT_SCORING)

// AI Goals planner — needs a real API key.
const ai = goalPlanner.anthropicClient({ apiKey: process.env.ANTHROPIC_API_KEY! })
const planner = goalPlanner.anthropicGoalPlanner({ ai })
const { plan } = await planner.plan(goalInput, planningContext)

// Career discovery — needs a real API key, any of the four providers.
const chat = careerDiscovery.CAREER_AI_PROVIDERS.anthropic.create(process.env.ANTHROPIC_API_KEY!)
for await (const chunk of careerDiscovery.runAssessment(studentInput, chat)) {
  process.stdout.write(chunk)
}
```

## Verifying this package on its own

```bash
npm install
npm run typecheck   # compiles cleanly against the real openai, @anthropic-ai/sdk,
                     # pdf-parse, pdfkit and zod type definitions
npm run smoke        # builds, then runs smoke.mjs: exercises the pure logic
                     # (scoring, levels, streaks, schedule-conflict detection, the
                     # mentorship agent's marker-filtering) end-to-end, no API key
```

No test suite is ported (the source Habit Tracker's 289 unit tests exercise its
Electron/SQLite wiring as much as the pure domain logic — porting the whole harness was
out of scope for a staging package). `smoke.mjs` is a lighter substitute: real runtime
execution of every piece that doesn't need a live API key. The AI-calling paths
(`goalPlanner.plan(...)`, `careerDiscovery.runAssessment(...)`, `runMentorshipChatTurn(...)`)
are type-verified but not runtime-tested here — they need a real provider API key, which
this environment doesn't have. Verify those once real keys are available, before
treating them as done.
