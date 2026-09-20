# Bosla — Product Requirements Document

**Document owner:** Product (drafted on behalf of alytarek.maklad@gmail.com)
**Status:** Draft v1.4 — decision-complete. v1.1 narrowed MVP to Masar.ai + Habit Tracker and enriched Questify from its thesis documentation; v1.2 resolved the six highest-priority pre-implementation decisions; v1.3 resolved every remaining open question inline in its owning section; v1.4 splits the platform plan into a **React web MVP (Phase 1)** followed by a **React Native native mobile app (Phase 2+)**, per explicit stakeholder direction
**Date:** 2026-09-19 (v1.0 through v1.4)

---

## How to read this document

Every requirement is tagged with a **Source** so confirmed facts are never confused with proposals. Sources:

| Tag | Meaning |
|---|---|
| **[MOM]** | Stated in `MOM_audio_validated_en.md` (the 2026-09-05 hackathon brainstorming minutes) |
| **[Admin Doc]** | Stated in `Admin panel/bosla_questify_learning_analytics.md` |
| **[Habit Tracker]** | Confirmed, built capability of the "Adaptive Habit League" project (`Habit Tracker/README.md`, `PROJECT.md`) |
| **[Masar.ai]** | Confirmed capability of the Masar AI multi-agent career-guidance platform (`Masar.ai/README.md`) |
| **[Jobify]** | Confirmed capability of the Job Application Agent (`Jobify/README.md`) |
| **[Questify]** | Confirmed capability of the Questify gamification/learning engine — grounded in both `Questify/Questify_Gamification_Detailed_Guide.md` and the official thesis write-up `Questify/Questify Documentation.md` (Ain Shams University, June 2026, converted from the PDF) |
| **[CohereVoice]** | Confirmed capability of CohereVoice Studio (`Cohere Voice Studio/README.md`) |
| **[Brief]** | Explicitly instructed by the user's product brief for this PRD (i.e., a requirement the requester specified directly, not sourced from a project document) |
| **[Proposal]** | Design/requirement authored in this PRD to fulfill a "Define:" instruction in the brief; not confirmed by any source document — needs stakeholder sign-off |
| **[Assumption]** | Inferred to fill a gap, flagged so it can be validated or overridden |
| **[Gap]** | The source material does not cover this; stated explicitly rather than invented |

**Update (v1.1):** `Questify Documentation.pdf` is now available as a converted, readable `Questify Documentation.md` — the official Ain Shams University thesis write-up — and has been fully read and folded into the **[Questify]** tag below; it resolves several gaps flagged in v1.0 and adds substantial confirmed architectural detail (§9.4). `Job_Application_Agent_Report.pdf` was removed from the project folder in this update; Jobify's confirmed capabilities still rely solely on its `README.md`, unchanged from v1.0.

**Scope change (v1.1):** per explicit instruction, **the MVP (Phase 1) is now scoped to Masar.ai and Habit Tracker capabilities only.** Questify, Jobify, CohereVoice Studio, and the brief's later-phase "Define:" features (education partners, career video, community, voice evaluation, the RAG agent, and most of the admin panel) are unchanged in substance below — only their position relative to MVP has shifted; they are now uniformly post-MVP.

**Requirement ID scheme:** `FR-<module>-###` (functional), `NFR-###` (non-functional), `AC-<module>-###` (acceptance criteria), `BR-<module>-###` (business rule), `DR-<module>-###` (data requirement). Modules: `CD` Career Discovery, `EDU` Education Partners, `VID` Career Videos, `HAB` Habit Tracker, `GAM` Gamification/Questify, `COM` Community/Mentorship, `VOI` Voice Evaluation, `RAG` Multimodal Agent, `ADM` Admin Panel, `WEB` React Web MVP Platform, `MOB` Native Mobile Platform, `JOB` Job Readiness.

---

## 1. Executive Summary

Bosla is an end-to-end career and personal-growth platform, shipped in two platform steps: a **React web app for the MVP**, then a **React Native mobile app** once the web MVP validates the product **[DECIDED, this revision]**. It is being defined by recombining **selected, confirmed capabilities** of four internal prototypes — an offline-first habit tracker with an AI goal planner ("Adaptive Habit League"), a multi-agent career-guidance system ("Masar AI"), an autonomous job-search/CV-scoring agent ("Jobify"), and a layered learning-gamification engine ("Questify") — into a single coherent product, plus a fifth internal asset, CohereVoice Studio, supplying the Arabic-first speech-to-text capability the voice-evaluation feature depends on **[Brief]**.

The product's origin point is the 2026-09-05 hackathon brainstorming session captured in the MOM **[MOM]**: a "conversational AI for personalized education and career navigation" that replaces rigid personality questionnaires with an adaptive conversation, returns multiple explainable career profiles instead of one label, shows realistic role previews, and ends in an actionable next-step roadmap. That MOM is explicitly the **primary foundation** for Bosla's scope and sequencing per the brief.

This PRD defines the MVP — scoped, per explicit instruction, to only the confirmed capabilities of **Masar.ai** (career-discovery, assessment, and mentorship-chat agents) and **Habit Tracker** (the offline-first, recompute-honest habit-scoring and AI Goals-planner engine), rebuilt as a **React web app** — followed by eight subsequent phases (the native mobile re-platform lands within Phase 2+, §12.2) layering in career daily-routine videos, a Questify-based gamification unification of the habit engine, full education-provider course integrations (Questify's course/quest engine), community/mentorship, voice-based knowledge evaluation (built on CohereVoice Studio's ASR), a multimodal personalized RAG agent, and a full admin panel grounded in the provided analytics document.

Because Habit Tracker is currently a **Windows desktop application** (Electron) and Masar.ai ships today only as a Gradio web UI — and both are now, per this revision, the exactly-two MVP source projects — porting both engines to a **React web app** is the **MVP-critical**, first-class technical workstream (§12.1), not a detail. The further step of re-platforming that validated web experience into a **native mobile app (React Native)** is deferred to Phase 2+ (§12.2), fulfilling the Product Vision's "through one mobile application" requirement (§2) once the web MVP has proven the product. Jobify remains a later-phase, desktop-only capability donor, unaffected by this constraint until Phase 8.

---

## 2. Product Vision

> Bosla is an end-to-end career and personal-growth platform that helps users discover suitable career paths, build the necessary skills and habits, access learning resources, assess their understanding, receive mentorship, and track progress toward their goals — through one mobile application. **[Brief]**

**Platform sequencing [DECIDED, this revision]:** the "through one mobile application" requirement above is fulfilled at the native mobile app milestone (React Native, Phase 2+); the MVP itself ships first as a React web app to validate the product faster — see §12 for the full platform strategy.

The MOM's working value proposition is adopted as the vision statement for Bosla's entry point (career discovery):

> "An AI career-discovery companion that replaces exhausting personality questionnaires with an adaptive conversation, then turns the user's interests, skills, personality signals, and experience into explainable career options, realistic role previews, and a practical first-step roadmap." **[MOM]**

Bosla extends that entry point into a full loop: **discover → build habits → learn (partner content) → get assessed (incl. by voice) → get mentored → get a job-ready CV → track progress** — with gamification and an AI agent threaded through every stage.

---

## 3. Problem Statement

People at education and career transition points often lack enough self-knowledge and real-world exposure to choose a direction confidently. Existing personality/career tests rely on long multiple-choice questionnaires, force uncertain answers, produce opaque labels, and stop at shallow job suggestions — they don't explain the recommendation, show the day-to-day reality of a role, or translate the result into an actionable next step. **[MOM]**

Once a direction is chosen, three further problems are confirmed by the source projects rather than invented: (1) turning good intentions into daily action is hard without a scoring/streak system that survives real life — missed days, corrections, honesty about assumed vs. measured effort **[Habit Tracker]**; (2) generic learning content isn't tied to a feedback loop that proves understanding rather than mere click-through **[Questify §47]**; (3) self-paced learners disengage after their first few sessions without a progression/reward system **[Questify §2]**. Bosla treats these as one connected problem rather than three separate products.

---

## 4. Target Users and Personas

Primary segments, confirmed directly from the MOM **[MOM]**:

| Persona | Situation | Primary need |
|---|---|---|
| Secondary-school student | Choosing a university/study path | Direction + confidence, not a label |
| University student | Choosing a specialization/track | Comparison between plausible paths |
| Recent graduate | Doesn't know where to begin professionally | A concrete first move |
| Early-career professional | Reconsidering their specialization | Evidence-based reassurance or redirection |
| Career switcher | Wants to reuse existing skills in a new direction | Mapping existing skills to a new domain |

**[Assumption]** A sixth persona — **Educator/Content Partner Admin** (an education-provider's staff member managing courses inside Bosla) — is implied by Phase 4 but not described in the MOM; treated as a secondary persona for the Admin Panel and Education-Partner sections.

**[Assumption]** A seventh persona — **Mentor** — is implied by the brief's community/mentorship requirement but has no confirmed source-document definition; scoped as a secondary persona in Section 17.

---

## 5. User Pain Points and Needs

| Pain point | Evidence | Bosla response |
|---|---|---|
| Questionnaires are boring, ambiguous, and don't express nuance | **[MOM]** | Adaptive conversational discovery (§11.1) |
| A single deterministic label doesn't match how people actually fit multiple roles | **[MOM]** | 3–5 ranked, explainable career profiles (§11.2) |
| Can't picture themselves doing the job | **[MOM]** | Role previews / day-in-the-life videos (§14) |
| Good intentions don't survive real life — habits get abandoned after a missed day | **[Habit Tracker]** | Recompute-based scoring that's honest about corrections (§15) |
| Course completion is tracked but doesn't mean learning happened | **[Admin Doc §3]**, **[Questify §47]** | Learning Progress Score + mastery tracking (§13, §20) |
| Learners disengage after the first few sessions of self-paced content | **[Questify §2]** | Layered gamification (streaks, challenges, leaderboards) (§16) |
| No way to prove you actually understood something beyond a multiple-choice quiz | **[Brief]** | Voice-based knowledge evaluation (§18) |
| No feedback on whether a CV/skills profile would survive a real employer's ATS | **[Jobify]** | Job-readiness CV/ATS toolkit (§9.3, §29 Phase 8; scoring/matching only, per the decided auto-apply exclusion in §8) |
| No one to ask "does this actually make sense for me" | **[Brief]** | Community & mentorship (§17) |

---

## 6. Product Goals and Measurable Success Metrics

| Goal | Metric | Target | Phase |
|---|---|---|---|
| Reduce decision paralysis in career discovery | % of users who save/accept a recommended path after their first session | ≥ 60% **[Proposal]** | 1–2 |
| Recommendations are trusted, not just accepted | User-reported confidence score post-session ("I can explain why this fits me") | ≥ 4/5 average **[Proposal]**, mirrors MOM's success criterion **[MOM]** | 1–2 |
| Habits stick | 7-day habit-completion retention | ≥ 50% **[Proposal]**, informed by Habit Tracker's honesty-first scoring design | 3 |
| Learning is real, not just clicked through | % of completed quests with demonstrated mastery (≥2 consecutive correct) | Tracked, target set after baseline **[Questify §46]** | 4 |
| Engagement compounds via gamification | D30 retention lift for gamified vs. non-gamified cohort | Statistically significant at p<0.05, using the Admin Doc's own hypothesis-testing method **[Admin Doc §6]** | 3–4 |
| Voice assessment feels fair, not punitive | % of users who file a "disagree with feedback" appeal | < 5% **[Proposal]** | 5 |
| Admins can act on data, not just view it | Median time from "learner flagged at-risk" to an admin/mentor intervention | Tracked from Phase 6 **[Proposal]** | 6 |

---

## 7. Non-Goals

Explicitly out of scope, carried forward from the MOM's own MVP boundary decisions **[MOM]** unless a later phase in this PRD reopens them:

- **(v1.1)** Any Questify-sourced capability (badges, achievements, challenges, leaderboards, shop, avatar, or the course/quest/mastery structure) and any capability sourced from Jobify, CohereVoice Studio, or the brief-only community/mentorship, voice-evaluation, RAG-agent, or admin-panel features. Per explicit instruction, **MVP is scoped strictly to Habit Tracker (§9.1) and Masar.ai (§9.2) capabilities** — habit gamification in MVP runs on Habit Tracker's own native engine, not Questify's (§15, §16).
- A fine-tuned, proprietary foundation model — the MOM decided against this due to data/time/evaluation cost; Bosla instead uses configured agents, retrieval, and prompting **[MOM Decision #7]**.
- Full step-by-step teaching / custom course authoring by Bosla itself in the MVP — Bosla integrates partner content rather than becoming an LMS author in Phase 1–3 **[MOM Decision #6]**.
- Presenting career/personality signals as a validated psychometric or clinical diagnosis **[MOM — Key Product Risks]**.
- Generated (AI-synthesized) role-preview video in the MVP — curated existing content is used first **[MOM Decision #4]**; AI-assisted generation is a later phase (§14), not MVP.
- Autonomous, unsupervised job-application submission to employers. Jobify's confirmed design defaults to `whitelist`-only auto-submit and ships the real Greenhouse submit path as a deliberate stub **[Jobify]** — Bosla has decided against ever building this (§8): the Job Readiness module (§29 Phase 8) is scoring/matching only.
- Legal, financial, or licensed mental-health advice from the AI agent or community layer (§17.8, §19.7).
- Desktop/Windows distribution of Bosla itself — the two desktop source projects are capability donors, not the shipping form factor **[Brief]**.

---

## 8. Scope and Product Boundaries

**In scope for this PRD:** full product definition across MVP + 8 phases for a **React web MVP that re-platforms into a native cross-platform mobile app (React Native) from Phase 2 onward** (§12), its backend/APIs, and its admin panel — **including, as of this revision, a subscription-tier monetization model and a marketing/reseller-partner model (§13.9–13.10), resolving what was previously an out-of-scope item.**

**Out of scope for this PRD (by construction, not by document gap):** exact price points/currency-by-market and a full GTM/marketing plan (the tier *structure* is defined in §13.10; specific prices are not); detailed UI visual design (wireframes/mockups) — functional and IA requirements are specified, pixel-level design is not; legal contract terms with education/reseller partners (the commercial *model* is now defined in §13.10, but signed contract language is still a legal-team deliverable, not drafted here).

**Boundary decision — Jobify's autonomous agent scope [DECIDED, this revision]:** Bosla adopts Jobify's *scoring and matching intelligence* (ATS scoring, CV tailoring, job matching) as a **[Proposal]** "Job Readiness" module (Phase 8), but **does not adopt, and will not build, Jobify's autonomous multi-site scraping/auto-apply agent** — not as an MVP feature, and not on the current roadmap at all. Per explicit stakeholder decision, auto-submission is ignored/out of scope for now, full stop, rather than deferred pending a boundary review. Rationale unchanged: (a) it wasn't named in the brief's required phases, (b) it changes Bosla's risk profile (ToS compliance across third-party job boards, credential handling, anti-bot detection), and (c) Jobify's own README flags its auto-submit path as unfinished/stub-only **[Jobify]**. Revisiting this later requires a fresh scoping decision, not a resumption of OQ-11 (now closed).

---

## 9. Confirmed Source-Project Capabilities

This section is the traceability backbone: every later functional requirement cites back to one of these rows, or is explicitly marked **[Proposal]**/**[Assumption]** if it isn't.

> **MVP scope note (v1.1):** Bosla's MVP (Phase 1, §30) draws only from §9.1 (Habit Tracker) and §9.2 (Masar.ai). §9.3 (Jobify), §9.4 (Questify), §9.5 (CohereVoice Studio), and the fuller MOM-proposed product in §9.6 remain confirmed source material for post-MVP phases (§29) — they are documented in full below because they still govern real, committed later-phase scope, not because they're in MVP.

### 9.1 Habit Tracker — "Adaptive Habit League" **[Habit Tracker]**

| Capability | Confirmed detail |
|---|---|
| Platform (as built) | Windows desktop, Electron 43 + React 19, SQLite (`better-sqlite3`), fully offline-capable |
| Scheduling model | App owns recurrence, time-of-day, duration target, difficulty; expands to daily "occurrences" on a rolling horizon |
| Scoring philosophy | **Nothing is incremented — everything is recomputed** from source rows (`occurrence`, `time_log`) whenever anything changes; five consecutive recomputes are byte-identical |
| Time-of-effort provenance | Every time log is tagged `timer` \| `manual` \| `assumed`, and `assumed` entries are visibly badged in the UI |
| Points | Full completion +2, partial (≥25%) +1, justified skip 0, unjustified miss −1; weekly bonuses for beating a points target (+5), completing your historically worst weekday (+3), 7-day consistency (+10) |
| Streaks / XP / Levels | Streaks walk backward through consecutive scheduled-and-completed days; XP scales with difficulty; 8 named levels (Beginner → Formidable) on a rising curve |
| Adaptive difficulty | A habit completed ≥90% of scheduled days in a week gets a proposal to raise its target; <70% gets a proposal to lower it — proposals are surfaced, never auto-applied |
| Google Tasks/Calendar sync | Two-way completion sync via Google Tasks (the only Google resource with real completion semantics); Calendar used write-only for timed reminder mirroring |
| AI Goals planner | Turns an underspecified goal ("Learn Spanish") into schedulable habits + to-dos via an **Actor → Intervenor → Reflexion** loop: Actor researches (web_search tool) and drafts a plan; Intervenor runs a deterministic schedule-conflict check (no model call), an independent link-resolution check per cited resource, then one model-based critique; verdicts are accept / fix-in-place / redirect / halt-with-warnings (iteration cap 3) |
| AI provider abstraction | A provider-agnostic `AiClient` interface, implemented today for Anthropic (native tool use) and Groq (OpenAI-compatible, absorbs rate-limit/reasoning-budget differences in the adapter) |
| Not built (explicitly, per the project's own status) | Friend groups, leaderboards, challenges (that project's own future Phase 3 — needs a hosted backend); a Chrome extension (that project's Phase 4) |

**Interpretation for Bosla [Proposal]:** Bosla reuses the *scheduling, recompute-honesty, adaptive-difficulty, and Goals-planner* design patterns; Bosla replaces the bespoke points/streak/level formulas with Questify's gamification engine per the brief's explicit Questify-integration instruction (§7 of the brief; see §16 below).

### 9.2 Masar.ai — Autonomous Career Guidance Platform **[Masar.ai]**

| Capability | Confirmed detail |
|---|---|
| Architecture | 8-stage pipeline: env/deps → local quantized LLM inference (`Qwen2.5-7B`) → PDF/CV ingestion (`PyPDF2`) → Agents 1&2 (assessment + skill-gap, single-pass LangChain prompts against "market profiles") → pipeline orchestration → Agent 3 (stateful, context-aware mentorship chat) → Agent 4 (PDF report compilation, ReportLab PLATYPUS) → Gradio 2-tier UI |
| Input | Student background attributes (major, interests, experience) + uploaded resume/CV text |
| Output | Structured career vectors, skill-development roadmaps, a stateful mentorship Q&A grounded in the user's own evaluation, and an exportable PDF report |
| UX mechanics | Real-time token streaming (LangChain `stream`), session-state persistence across the chat |

**Interpretation for Bosla:** this is the closest existing prototype to the MOM's proposed experience; its agent decomposition (assessment/skill-gap agent, mentorship-chat agent, report-export agent) is reused conceptually for Bosla's Career Discovery + Mentorship-chat modules (§11, §17).

### 9.3 Jobify — Job Application Agent **[Jobify]**

| Capability | Confirmed detail |
|---|---|
| Job matching | Two-stage: query expansion (Position → equivalent titles) then retrieval (token-match + semantic/embedding path) unioned and deduped, then 8-factor weighted ranking (skills 32%, semantic similarity 20%, experience 16%, title 12%, location 8%, education 4%, salary 4%, seniority 4%); missing-data factors score neutral, not zero |
| ATS scoring | Two generations: legacy 4-pillar blend (keyword 45%, formatting 22%, section completeness 18%, experience alignment 15%) and current default, a deterministic requirement-level engine (`config.SCORING_ENGINE="requirements"`) that matches each posting requirement against CV evidence (exact/synonym/narrower-term/model-judged) — scores from the two engines are explicitly **not comparable** |
| CV tailoring | Jobs below `FIT_THRESHOLD` (default 0.7) get an automatic CV rewrite; the rewrite is re-scored against the same job and shown side-by-side with a "Why?" breakdown; the system explicitly never fabricates CV content — it only reframes real experience |
| Auto-apply safety model | Three-way `AUTO_APPLY_MODE`: `off` (draft only, default-safe), `any` (auto-submit anywhere — but real submission is still limited to a Greenhouse stub, `NotImplementedError`), `whitelist` (default; only explicitly whitelisted boards auto-submit) |
| Idempotency | Dedupe by job URL — never applies to the same job twice |
| Skill-gap tracking | Surfaced on the dashboard alongside applications |
| Reporting | Daily/weekly summaries via Telegram; full email log (sent/dry-run/failed) for every Gmail send attempt |
| Debuggability | Every search run writes a multi-sheet Excel trace (funnel, query expansion, per-source results, ranking factor contributions, what the match gate held back) |

**Interpretation for Bosla:** the ATS-scoring/CV-tailoring/skill-gap intelligence is a strong fit for a "Job Readiness" capability late in the user journey; the autonomous multi-site search-and-apply agent is **not** adopted wholesale (§8).

### 9.4 Questify — Layered Gamification Engine **[Questify]**

| Layer | Confirmed mechanics |
|---|---|
| Progression | XP (append-only `XPEvent` log: user, course, amount, source); Level = `floor(sqrt(XP/100)) + 1`, recalculated on every XP change, emits `UserLeveledUp` on change; documented level titles Novice/Pathfinder/Adventurer/Legend (thresholds not specified in the source — **[Gap]**, do not invent) |
| Habit/consistency | Daily streaks (consecutive-day activity); streak status evaluated at app start **and** via nightly background job; documented milestones at 7/30/100 days (reward values not specified — **[Gap]**); streak-freeze inventory items consumed one-per-missed-day, insufficient freezes let the streak break |
| Recognition | 5 badge families (Login streak, Quests completed, Courses completed, Bosses defeated, Total XP) × 4 tiers (Bronze/Silver/Gold/Legendary), threshold-based, awarded idempotently on qualifying event; achievements are rule-based JSON (`{"metric":..., "threshold":...}`), one-shot or counter-based, general or course-scoped, awarded via atomic conditional DB updates |
| Economy | Coins (separate from XP) earned from quest rewards, spent in a virtual shop on cosmetic avatar items and streak-freezes; purchase validates balance, ownership, and freeze-inventory limits; avatar has Head/Body/Lower-body equip slots, one item per slot |
| Goals | Daily/weekly challenges, admin-defined (metric, threshold, period, reward XP/coins); progress increments per matching event; **self-healing** — a missing progress record is created on demand rather than dropping the event |
| Competition | 3 leaderboard types — Weekly Global, Monthly Global, Weekly Per-Course — computed from *period* XP (current XP − period baseline), not lifetime XP, via background-computed, cached `LeaderboardSnapshot`s |
| Learning structure | Course → Section → Quest → Stage, stage types Informational / MCQ / Boss Battle; **linear gating** (LOCKED→UNLOCKED→IN_PROGRESS→COMPLETED), completing a quest unlocks the next in its section, completing all sections completes the course |
| Mastery | Stage marked MASTERED after 2 consecutive correct answers; tracks total/right/wrong attempts and first-wrong timestamp; mastery never regresses once achieved |
| Architecture | In-process **typed event bus** (publish/subscribe) decouples the quest module from XP/badge/achievement/challenge/notification/audit consumers; background jobs (via `pg-boss`) handle leaderboard snapshotting and scheduled streak checks; idempotency via atomic conditional DB updates; login-dedup per calendar day; NFR target < 300ms p95 on hot paths |
| Roles & security | JWT auth, RBAC, three roles — STUDENT, LECTURER, ADMIN; content creators (lecturers) manage courses/sections/quests/stages/difficulty/rewards + an AI content-generation pipeline; admins manage platform-wide gamification rules, shop, reports, notifications, analytics, audit |
| Anti-abuse (confirmed, by design) | Server-only reward grants (never trust client-sent coin/XP amounts); daily login dedup; atomic idempotent achievement awarding; ownership validation before purchase; server-side balance validation; streak-freeze inventory caps; linear-gating prevents skipping prerequisites |

**Additional confirmed detail from the official thesis documentation** (`Questify Documentation.md`, Ain Shams University, June 2026 — now readable; supersedes the earlier gap markers below) **[Questify]:**

| Area | Confirmed detail |
|---|---|
| Tech stack | A single TypeScript monorepo, three deployable apps: Express 5 + Prisma 7 REST API, an Expo/React Native (SDK 56) mobile client, and a React admin dashboard — bound together by one shared Zod schema package as the single source of validation truth across all three |
| Data layer | PostgreSQL with the `pgvector` extension (no separate vector database); 30 Prisma entities; `pg-boss` runs the background job queue (leaderboard snapshots, streak-freeze cron, AI content generation) directly on PostgreSQL |
| Auth | Email/username + bcrypt-hashed password with a verify-before-register email-code flow, or Google OAuth 2.0; JWT bearer tokens in platform-secure mobile storage; RBAC middleware enforces STUDENT / LECTURER / ADMIN at the API layer |
| **RAG-powered course chatbot ("course-ask") — confirmed built and shipped, not hypothetical** | Instructor PDFs are chunked (~1000 chars, overlapping, `RecursiveCharacterTextSplitter`) and embedded **locally** (Transformers.js/ONNX, `all-MiniLM-L6-v2`, 384-dim — no external embedding API call); at query time, the top-10 most similar chunks (pgvector cosine distance) ground an LLM answer instructed to "answer solely from the provided material," scoped to the learner's own enrolled course |
| **AI content-generation pipeline — confirmed built and evaluated, not hypothetical** | Admin uploads a source PDF → chunked → an LLM (Vercel AI SDK, OpenRouter gateway) generates structured draft stages (`DraftStage`) → admin reviews/edits/approves/rejects each, or bulk-approves with auto-resolution of the enclosing section/quest structure → approved drafts materialize into live `QuestStage` records. Self-reported evaluation across 75 AI-generated stages / 4 courses: 4.95/5 mean correctness, **0% hallucination rate**, 84.6% of quests rated "good or excellent" needing little/no revision |
| Question reports & content safety | Learners can report a stage with a reason/comment; the system **automatically disables a stage** once its open-report count crosses a configured threshold, logging the reason and timestamp, pending admin review |
| Audit logging (confirmed schema) | Every privileged action logs actor, action type, severity, outcome, target type/id, and metadata (JSON), with a timestamp; the admin UI supports filter/search/inspect |
| Notifications | In-app, event-bus-subscribed (achievement/badge earned, challenge completed/claimed, streak-at-risk, stage mastered, course published); admins can broadcast platform-wide; notification failures are isolated and never block the domain event that triggered them |
| Content-authoring detail | Course → Section → Quest → Stage, each level fully CRUD + reorderable via a dedicated ordering service; course lifecycle ENROLLED→IN_PROGRESS→COMPLETED is tracked separately from content-item lifecycle LOCKED→UNLOCKED→IN_PROGRESS→COMPLETED |
| Confirmed NFRs (Questify's own stated targets) | <300ms p95 on the learner hot path; stateless API scaled horizontally behind a load balancer for "tens of thousands of concurrent learners"; atomic critical writes (progress, XP, streaks); mobile client caches locally and auto-retries on network interruption; version-controlled DB migrations; DB-level constraints prevent double-enrollment/overlapping challenge periods |
| Confirmed future work (Questify's own backlog — not Bosla's invention) | (1) A dedicated **INSTRUCTOR role** with class-cohort scoping and per-cohort analytics is explicitly planned but **not yet released**; the admin dashboard already exposes the needed primitives and RBAC is "structured to accommodate it with minimal surface-area change." (2) A 3-phase social layer: friend graph + friend-scoped activity feed (reusing existing leaderboard/quest-completion events, no new data) → cooperative shared boss battles → async/real-time PvP duels (needs matchmaking, anti-cheat, fairness invariants). (3) Broader stage types (timed drills, drag-to-order, code-input, branching scenarios) plus a per-user rolling-accuracy adaptive-difficulty item-selection layer. (4) A planned controlled study (~60–90 undergraduates, within-subjects, Questify vs. non-gamified control) measuring learning gain, one-week retention, and engagement via an adapted intrinsic-motivation inventory |

**Interpretation for Bosla [Proposal]:** the confirmed, already-evaluated RAG-chatbot and AI-content-generation pipelines are strong existing precedent — not a from-scratch design — for Bosla's §13.2 (partner content generation) and part of §19 (the multimodal agent). The key caveat: Questify's confirmed RAG is single-course, text-only, and instructor-document-grounded, whereas Bosla's brief asks for a cross-domain, multi-source, eventually-multimodal agent — the course-scoped version is the proven starting point, the broader scope is still net-new design.

### 9.5 CohereVoice Studio — Speech Intelligence **[CohereVoice]**

| Capability | Confirmed detail |
|---|---|
| ASR model routing | Arabic media auto-routes to `CohereLabs/cohere-transcribe-arabic-07-2026` (finetuned for Egyptian/Arab dialects, colloquial slang, rapid dialogue); other languages route to `CohereLabs/cohere-transcribe-03-2026` (14-language base model) |
| Diarization / alignment | PyAnnote speaker diarization + wav2vec 2.0 forced word alignment; unalignable code-switched characters safely interpolated |
| LLM-backed outputs | Structured meeting-notes/summary generation and translation via a pluggable provider (OpenAI, Groq, or Gemini), selected explicitly — **fails closed** (no silent spend against an unselected provider) if the chosen provider has no API key |
| Output artifacts | Timestamped transcript JSON with confidence scores and speaker tags; a machine-readable subtitle QC report; a "models used" provenance file recording exact ASR/alignment/diarization/LLM versions used per run |
| Deployment posture (as built) | Local workstation tool bound to `127.0.0.1`; uploaded media is deleted from temp storage after each job; not hardened for public network exposure as shipped |

**Interpretation for Bosla:** the ASR + confidence/provenance plumbing is the confirmed dependency for Feature 4 (Voice Evaluation, §18); the *evaluation-of-understanding* logic itself is new — CohereVoice Studio produces subtitles/meeting-notes, not correctness judgments.

### 9.6 The MOM's proposed product (career discovery) **[MOM]**

Already detailed in §3–§5; restated as a capability table for traceability:

| Capability | MOM section |
|---|---|
| Adaptive discovery conversation (rephrases on misunderstanding, gathers interests/dislikes/preferences/strengths/skills/experience/motivations) | Proposed Experience §1 |
| Explainable, multi-option recommendations (3–5 ranked profiles, each with supporting signals + stated uncertainty) | Proposed Experience §2 |
| Realistic role previews (curated existing video/content preferred over generated video for MVP) | Proposed Experience §3 |
| Actionable next-step roadmap (universities, foundational subjects, skills, portfolio steps) | Proposed Experience §4 |
| Persistent profile carried across sessions, evidence sources = CV/LinkedIn/portfolio/projects/work history, consent-gated | Proposed Experience §5 |
| Saveable/downloadable summary; follow-up chat for "why," comparisons, next steps | Candidate Features table |

---

## 10. Bosla's Unified End-to-End User Journey

```
Onboarding & consent
       ↓
Adaptive career-discovery conversation  [MOM]
       ↓
3–5 explainable career profiles + role-preview videos  [MOM] + [Brief §2]
       ↓
Accept/save a direction → next-step roadmap  [MOM]
       ↓
Roadmap converts into habits + to-dos (AI Goals planner pattern)  [Habit Tracker]
       ↓
Daily habit practice, scored honestly, gamified via Questify  [Habit Tracker]+[Questify]
       ↓
Partner course enrollment for roadmap skill gaps  [Brief §1]
       ↓
Learning inside Questify-style quest/stage structure, with mastery tracking  [Questify]
       ↓
Voice-based understanding checks at key checkpoints  [Brief §4]+[CohereVoice]
       ↓
Mentor matching + community for stuck moments  [Brief §3]
       ↓
Multimodal RAG agent available throughout, grounded in the user's own journey data  [Brief §5]
       ↓
(Proposed) CV/ATS job-readiness check once skills reach roadmap targets  [Jobify]→[Proposal]
       ↓
Progress dashboard for the user; parallel analytics dashboard for admins  [Admin Doc]
```

This is the single journey every later functional section maps back into.

---

## 11. Functional Requirements — Career Discovery (Phase 1–2 core)

### 11.1 Adaptive Discovery Conversation

**User stories**
- As a confused student, I want to answer an adaptive conversation instead of a fixed quiz, so the questions actually respond to what I've already told the app. **[MOM]**
- As a user, I want the app to rephrase a question I didn't understand rather than forcing me to guess an answer. **[MOM]**

**Functional requirements**

| ID | Requirement | Source |
|---|---|---|
| FR-CD-001 | The system shall conduct career discovery as a multi-turn adaptive conversation, not a fixed-order questionnaire. | MOM |
| FR-CD-002 | The conversation shall gather evidence on: interests, dislikes, working-style preferences, strengths, existing skills, experience, and motivations. | MOM |
| FR-CD-003 | The system shall detect an unclear/ambiguous user answer and offer a rephrased question rather than proceeding on a low-confidence answer. | MOM |
| FR-CD-004 | The system shall optionally ingest a CV, LinkedIn profile, or portfolio as additional evidence, subject to explicit consent. | MOM (classified "Could have" in the source MVP table) |
| FR-CD-005 | The system shall persist the evolving user profile (accepted insights, skills, prior conversation state) across sessions. | MOM |

**User flow:** Onboarding → consent screen (data use) → conversational intake (chat-style, voice-optional — mobile note in §12) → optional CV upload → live-updating profile summary panel → "ready for recommendations" checkpoint.

**Business rules**
- BR-CD-001 **[DECIDED]**: the system must not claim a fixed number of required questions; the conversation ends adaptively once every profile dimension named in FR-CD-002 (interests, dislikes, preferences, strengths, skills, experience, motivations) has at least one signal at medium-or-higher confidence, subject to a minimum of 8 exchanges (so it never ends prematurely on one lucky early answer) and a hard cap of 20 exchanges (so a low-signal user isn't trapped indefinitely — past the cap, the system proceeds with whatever confidence it has and surfaces the lower-confidence dimensions in the recommendation's uncertainty notes, FR-CD-011).
- BR-CD-002: A user may skip CV/LinkedIn/portfolio ingestion entirely and still receive recommendations from conversational evidence alone. **[MOM]**

**Data requirements:** DR-CD-001 user profile schema (interests, strengths, preferences, skills, experience, constraints, confidence/uncertainty per signal) — **[MOM]** explicitly names this schema as an open action item, not yet defined in detail; DR-CD-002 raw conversation transcript, retained per the consent/retention policy in §24.

**Technical/AI dependencies:** LLM for conversation management + entity/signal extraction; extracted signals are normalized against the decided ISCO-08+ESCO taxonomy (§11.2 DR-CD-011).

**Edge cases:** user gives contradictory answers across turns; user refuses all consent-gated inputs; user abandons mid-conversation and returns days later; non-native-language input.

**Acceptance criteria**

| ID | Criterion |
|---|---|
| AC-CD-001 | Given a user completes the adaptive conversation, when they reach the summary checkpoint, then a persisted profile with interests/strengths/preferences/skills/experience/confidence fields exists. |
| AC-CD-002 | Given the user's answer is flagged low-confidence, when the system detects this, then it offers a rephrased follow-up before moving on. |
| AC-CD-003 | Given a user declines CV upload, when they proceed, then recommendations are still generated from conversational evidence alone. |

**Success metrics:** conversation completion rate; average turns to reach recommendation-ready state; % of answers requiring a rephrase (a proxy for question quality, should trend down over releases).

**Phase:** MVP (Phase 1–2).

### 11.2 Explainable Career Recommendations

**User stories**
- As a user, I want several plausible career options, not one deterministic label, so I don't feel boxed in by a single answer. **[MOM]**
- As a user, I want to see *why* each recommendation was made and where the system is uncertain, so I can trust it. **[MOM]**

**Functional requirements**

| ID | Requirement | Source |
|---|---|---|
| FR-CD-010 | The system shall return 3–5 ranked career profiles per completed discovery session, never a single deterministic answer. | MOM |
| FR-CD-011 | Each recommendation shall state which user signals support the match and where uncertainty remains. | MOM |
| FR-CD-012 | The system shall provide a follow-up chat allowing the user to challenge a recommendation, ask "why," or compare two options. | MOM |
| FR-CD-013 | The system shall let the user save/download an assessment summary. | MOM |
| FR-CD-014 (Should) **[DECIDED]** | Each profile shall include salary, remote-work potential, and local market-demand context, with data source/date shown for freshness. Data source: ILOSTAT (the ILO's public labor-statistics database) and each target market's national statistical agency (e.g., Egypt's CAPMAS) — freely licensed, cross-walked to the ISCO-08 taxonomy already adopted (§11.2 DR-CD-011) — refreshed quarterly, with the refresh date always shown per BR-CD-011. | MOM ("Should have") |

**Business rules**
- BR-CD-010: The system must never present output as a validated psychometric or clinical assessment. **[MOM — Key Product Risk: Assessment validity]**
- BR-CD-011: Any salary/market-demand figure must carry location, date, and source provenance, or must not be shown. **[MOM — Key Product Risk: Data quality]**

**Data requirements:** DR-CD-010 career-profile schema (role, fit rationale, supporting signals, uncertainty notes, activities, required skills, market context, preview-video link); DR-CD-011 career taxonomy/skill framework — **[DECIDED, this revision]** ISCO-08 (the ILO's International Standard Classification of Occupations) as the base occupation taxonomy, cross-walked with ESCO's open-licensed skills/competency taxonomy, localized into Arabic and English by Bosla. This resolves MOM Open Question 4. Licensing **[DECIDED]**: ESCO is published by the European Commission under an open, free-to-reuse license requiring attribution only (no fee); Bosla's ISCO-08+ESCO cross-walk carries that attribution wherever taxonomy data is shown. Localization **[DECIDED]**: an initial Arabic pass covers the ~500 highest-frequency occupations/skills in Phase 0 (enough for the MVP's discovery/recommendation flow), with the long tail localized incrementally through Phase 2.

**Technical/AI dependencies:** LLM reasoning over the user profile against the decided career taxonomy (§11.2 DR-CD-011); retrieval of market-data from the decided sources, ILOSTAT and each market's national statistical agency (FR-CD-014).

**Edge cases:** no confident match found (system must say so rather than force-fitting a role); market-data source unavailable for the user's location; user disputes a recommendation's rationale in the follow-up chat.

**Acceptance criteria**

| ID | Criterion |
|---|---|
| AC-CD-010 | Given a completed discovery session, when recommendations are generated, then between 3 and 5 profiles are returned, each with a stated rationale and an explicit uncertainty note. |
| AC-CD-011 | Given a user asks "why" in the follow-up chat, when the system responds, then the response cites the specific user-profile signals behind that recommendation. |
| AC-CD-012 | Given a user requests a summary, when they confirm, then a saved/downloadable artifact is produced. |

**Success metrics:** % of sessions where the user accepts/saves a recommendation (goal metric, §6); average number of follow-up "why" questions per session (engagement/trust proxy); MOM's own success criterion — the user can explain why the options fit, name one worth testing, and name a first concrete action. **[MOM]**

**Phase:** MVP (Phase 1–2).

### 11.3 Realistic Role Previews → see §14 (Career Daily-Routine Videos), which supersedes the MOM's "curated video" MVP scope with the brief's Phase-2 video requirement.

### 11.4 Actionable Next-Step Roadmap

**Functional requirements**

| ID | Requirement | Source |
|---|---|---|
| FR-CD-020 | Once a user accepts/saves a career direction, the system shall generate a roadmap: relevant study paths, foundational subjects, skills to develop, and portfolio steps. | MOM |
| FR-CD-021 | The roadmap shall be scoped to guide exploration, not function as a full course-delivery syllabus, in the MVP. | MOM (Decision #6) |
| FR-CD-022 (Phase 3+) | The roadmap shall be convertible into schedulable habits and to-dos, reusing the Habit Tracker's Goals-planner pattern (Actor drafts, deterministic conflict check, resource-link verification, capped-iteration critique). | Proposal, built on [Habit Tracker] |

**Business rules:** BR-CD-020: a roadmap-to-habit conversion must run the same deterministic schedule-conflict check before any model-based critique, mirroring the Habit Tracker's cost/certainty ordering rationale. **[Habit Tracker]**

**Edge cases:** roadmap references a resource that later 404s (must be independently re-verified, not trusted from the model's memory — **[Habit Tracker]** pattern); user accepts a roadmap step that conflicts with an existing habit/course commitment.

**Acceptance criteria:** AC-CD-020 — given an accepted career direction, a roadmap with at least study-path, skills, and portfolio-step sections is generated within the session.

**Success metrics:** % of roadmaps converted into at least one scheduled habit.

**Phase:** MVP for roadmap generation (Phase 1). **(v1.1)** Roadmap→habit conversion is now also targeted for MVP/Phase 1–2 rather than Phase 3, since Habit Tracker is itself an MVP source project (§9.1, §15) — both donor capabilities ship together.

### 11.5 Masar.ai-Grounded Agent Capabilities (MVP)

Masar.ai's confirmed multi-agent architecture (§9.2) is, alongside the MOM, a primary MVP source per the v1.1 scope instruction. The following capabilities are carried into Bosla's MVP career-discovery module, reusing Masar.ai's confirmed agent decomposition directly rather than treating it only as background inspiration.

**User stories**
- As a user, I want to upload my CV/resume and have it actually inform my career assessment, not just sit as an attachment. **[Masar.ai]**
- As a user, I want to keep asking follow-up questions about my results in a chat that remembers my evaluation, not one that forgets context every message. **[Masar.ai]**
- As a user, I want a polished, exportable report of my results I can keep or share. **[Masar.ai]**

**Functional requirements**

| ID | Requirement | Source |
|---|---|---|
| FR-CD-030 | The system shall ingest an uploaded CV/resume PDF, extracting and normalizing its text as evidence for the discovery profile (DR-CD-001), mirroring Masar.ai's confirmed document-ingestion stage. | Masar.ai |
| FR-CD-031 | An assessment/skill-gap agent shall evaluate the combined conversational + CV evidence against career/market profiles in a structured pass, producing the career-profile output specified in FR-CD-010–011. | Masar.ai |
| FR-CD-032 | A mentorship-chat agent shall power the follow-up "why"/comparison chat (FR-CD-012) as a **stateful** conversation that keeps reference to the user's own completed assessment across turns, not a stateless Q&A. | Masar.ai |
| FR-CD-033 | Chat and assessment responses shall stream token-by-token rather than appear only on full completion, matching Masar.ai's confirmed real-time streaming UX. | Masar.ai |
| FR-CD-034 | The saveable/downloadable summary (FR-CD-013) shall be exportable as a formatted PDF report, mirroring Masar.ai's confirmed report-compilation agent. | Masar.ai |

**Business rules:** BR-CD-030 — the assessment agent and the mentorship-chat agent are logically separate stages (assessment first, chat second, grounded in the assessment's own output), mirroring Masar.ai's own agent boundary; the chat agent must not silently re-run or contradict the assessment agent's output without the user re-triggering an assessment.

**Data requirements:** DR-CD-030 parsed-CV text and extraction metadata, linked to the user profile (DR-CD-001) as one evidence source among several (conversation, CV, optional LinkedIn/portfolio per FR-CD-004).

**Technical/AI dependencies:** a document-ingestion/text-extraction service (PDF at minimum, mirroring Masar.ai's confirmed `PyPDF2`-based stage — the exact library is an implementation choice, not fixed by this PRD); a PDF-compilation service for report export (mirroring Masar.ai's confirmed ReportLab/PLATYPUS-based stage); an LLM with streaming-output support.

**Edge cases:** an uploaded CV is a scanned image with no extractable text (the system must detect this and prompt the user rather than silently proceeding on empty extraction); a user's CV contradicts what they said conversationally (the assessment agent should surface the discrepancy, not silently prefer one source, consistent with the MOM's own explainability principle, §11.2).

**Acceptance criteria**

| ID | Criterion |
|---|---|
| AC-CD-030 | Given a user uploads a CV, when text extraction succeeds, then the extracted evidence is visibly reflected in the resulting career-profile rationale (AC-CD-010). |
| AC-CD-031 | Given a user opens the follow-up chat after receiving results, when they ask a question, then the response demonstrably references their specific assessment (not a generic answer), and streams rather than appearing all at once. |
| AC-CD-032 | Given a user requests their summary as a PDF, when export completes, then a formatted, downloadable PDF is produced. |

**Success metrics:** CV-upload attach rate (opt-in, since FR-CD-004 keeps it optional); PDF-export rate as a proxy for perceived value of the summary.

**Phase:** MVP (Phase 1).

---

## 12. Platform Requirements: React Web MVP and Native Mobile App

Both Habit Tracker and Jobify exist today only as Windows desktop applications **[Habit Tracker]** **[Jobify]** — Masar.ai ships as a Gradio web UI **[Masar.ai]**, and CohereVoice Studio as a local Streamlit tool bound to `127.0.0.1` **[CohereVoice]**. **None of the four-plus-one source projects has a confirmed mobile client.** Everything in this section is therefore **[Proposal]** unless otherwise cited, designed to carry forward the *behavioral* guarantees of the source projects (recompute-honesty, offline-first scheduling, fail-closed AI providers) into each platform layer.

**Platform strategy [DECIDED, this revision]:** the MVP (Phase 1) ships as a **React web app**, not a mobile app — a deliberate sequencing choice to validate the product faster before committing to native mobile engineering. The Product Vision's "through one mobile application" requirement (§2, **[Brief]**) is fulfilled at the **native mobile app** milestone (React Native, iOS + Android), which follows once the web MVP has validated the product, starting Phase 2. Both layers are React-based, so data-fetching logic and business-rule hooks can be shared between the web and native UI where their primitives allow it — one reason to keep the web MVP in React rather than a different web framework.

### 12.1 Phase 1 — React Web MVP

None of the source projects has a confirmed web client either (Habit Tracker is desktop Electron, Masar.ai is a Gradio UI) — everything here is Proposal, carrying the same behavioral guarantees (recompute-honesty, fail-closed AI providers) into a responsive web app.

| ID | Requirement | Notes |
|---|---|---|
| FR-WEB-001 | The MVP shall ship as a responsive **React** web app (desktop and mobile-browser breakpoints), not a native app. | [DECIDED, this revision] — resolves OQ-1 for the MVP platform |
| FR-WEB-002 | Authentication shall support email/password and at least one OAuth provider (Google, given Habit Tracker's existing Google OAuth/PKCE integration pattern). | [Habit Tracker] pattern reused |
| FR-WEB-003 | AI-dependent features (discovery conversation, mentorship chat) shall show a clear "needs connection" / retry state on failure — never a silent failure. | [Proposal], mirrors CohereVoice's "fail closed" principle |
| FR-WEB-004 | The web app shall support at minimum English and Arabic, including right-to-left (RTL) layout for Arabic. | [CohereVoice] + [Proposal] |
| FR-WEB-005 | The habit-tracking core's recompute-honest scoring (§15) shall run against the same backend API the eventual native app will use, so no scoring logic is web-only. | [Proposal] — avoids rework when porting to native |
| FR-WEB-006 | The web app shall meet WCAG 2.1 AA-equivalent accessibility baselines (keyboard navigation, screen-reader labels, contrast) — see §25. | [Proposal] |

**Edge cases:** a user starts on web and later installs the native app — their account/history must carry over identically (shared backend, §23), not a separate web-only dataset; a user completes the MVP discovery conversation on a mobile browser (the responsive layout must remain usable at phone width even though this is not yet the native app).

**Acceptance criteria:** AC-WEB-001 — a new user can complete onboarding, the discovery conversation, and reach recommendations entirely in a desktop or mobile browser, with no native app install required.

**Phase:** Phase 1 (MVP).

### 12.2 Phase 2+ — Native Mobile App (React Native)

Once the web MVP validates the product, Bosla re-platforms to a native mobile app, fulfilling the Product Vision's "through one mobile application" requirement.

| ID | Requirement | Notes |
|---|---|---|
| FR-MOB-001 | Bosla's native app shall ship as a single cross-platform mobile app (iOS + Android) from one codebase, built on **React Native** (Expo-managed). | [DECIDED, this revision] — resolves OQ-1 for the native platform; see §23 for the full rationale, including the deliberate match with Questify's own confirmed Expo/React Native client |
| FR-MOB-002 | Release strategy: closed beta → phased regional rollout → GA, gated per phase in §29. | [Proposal] |
| FR-MOB-003 | Navigation shall be a bottom-tab IA: Discover, Habits, Learn, Community, Profile, with the RAG agent reachable as a persistent floating entry point. | [Proposal] |
| FR-MOB-004 | Onboarding shall front-load consent screens (data use, notification permission, optional microphone permission) before the discovery conversation begins. | [Proposal], informed by MOM's privacy risk callout |
| FR-MOB-005 | Authentication shall reuse the same account/credentials a user created on the web MVP (FR-WEB-002) — no forced re-registration when moving from web to native. | [Proposal], ensures continuity across the platform-strategy transition |
| FR-MOB-006 | Habit reminders shall be deliverable as native push notifications; a date-only reminder must resolve to a timed local notification, not silently fail — mirroring the Habit Tracker's reason for mirroring Google Tasks into a timed Calendar event. | [Habit Tracker] |
| FR-MOB-007 | The habit-tracking core (recurrence, timer/manual/assumed time-of-effort tagging, streaks) shall function fully offline on native, syncing when connectivity returns — a capability the web MVP does not need to provide. | [Habit Tracker] design principle carried forward |
| FR-MOB-008 | AI-dependent features (discovery conversation, RAG agent, voice evaluation) shall degrade gracefully offline: queue the request, or show a clear "needs connection" state — never a silent failure. | [Proposal], mirrors CohereVoice's "fail closed" principle |
| FR-MOB-009 | The app shall support at minimum English and Arabic (including Egyptian Arabic dialect handling for voice, per CohereVoice's confirmed model routing). | [CohereVoice] |
| FR-MOB-010 | Mobile permissions (microphone, notifications, storage) shall be requested contextually, at first point of use, not all at onboarding. | [Proposal] |
| FR-MOB-011 | The app shall meet platform accessibility baselines (dynamic type, screen-reader labels, minimum contrast) — see §25. | [Proposal] |

**Business rules:** BR-MOB-001: an `assumed` vs. `measured` distinction for habit effort (per Habit Tracker's provenance tagging) must remain visible in the native UI, not collapsed for simplicity — this is a confirmed product principle worth preserving, not just a technical detail. **[Habit Tracker]**

**Edge cases:** device clock skew during offline habit completion (Habit Tracker's sync watermark logic — advance from the server's max `updated` timestamp, never the local clock — is the confirmed defensive pattern to reuse); app killed mid-sync; user has no Google account (Google Tasks sync becomes optional, not required, for habit completion).

**Acceptance criteria:** AC-MOB-001 — a habit can be created, scheduled, and completed with the device in airplane mode, and reconciles correctly once connectivity returns, producing no duplicate or lost completions (mirrors Habit Tracker's own five-consecutive-recompute and orphan-adoption tests).

**NFR dependencies:** see §27 for perf/availability targets.

**Phase:** Phase 2+ (begins once the Phase 1 web MVP is validated) → hardened progressively through later phases.

---

## 13. Education-Partner Ecosystem Requirements

Everything in this section answers the brief's "Define:" list for Phase 4; there is no source document describing an existing education-partner integration, so **every requirement here is [Proposal]** unless it explicitly reuses a confirmed mechanic from Questify's course/quest model **[Questify]**.

### 13.1 Partner onboarding model [Proposal]

**Partner types [DECIDED, this revision — resolves part of OQ-8]:** Bosla recognizes two distinct partner types, both onboarded through this section's flow but with different downstream rights:

- **Content Partners** — education-service providers whose courses/quests are integrated into Bosla (the rest of §13 as originally specified).
- **Marketing/Reseller Partners** — organizations with contractual authority to sell Bosla to *their own* clients as an education service (e.g., a training company, a school district, a corporate L&D provider), without necessarily authoring content themselves. See §13.9.

A single partner organization may hold both roles if their agreement covers both.

| ID | Requirement |
|---|---|
| FR-EDU-001 | Partners shall apply through an admin-mediated onboarding flow (no self-serve signup in Phase 4) requiring: organization identity verification, content-licensing attestation (Content Partners) or resale-authority attestation (Marketing/Reseller Partners), and a designated content-owner or account-owner account. |
| FR-EDU-002 | Each partner organization shall map to one or more admin roles scoped to *their own* content and/or *their own* attributed users only (parallel to Questify's LECTURER role, which manages content but not platform-wide gamification rules **[Questify §51]**). |
| FR-EDU-003 | A partner's account shall carry a status: `pending`, `active`, `suspended`, `offboarded`, with admin-only transitions and an audit entry per transition (see §22 audit logs). |
| FR-EDU-004 **(v1.1)** | The system shall record a partner's type(s) (`content`, `marketing_reseller`, or both) and gate downstream capabilities accordingly — a Marketing/Reseller-only partner shall not get content-authoring access, and a Content-only partner shall not get reseller/attribution tooling. |

### 13.2 Course and content integration [Proposal, structured on Questify's confirmed model]

| ID | Requirement |
|---|---|
| FR-EDU-010 | Partner content shall be structured using Questify's confirmed hierarchy: Course → Section → Quest → Stage, with stage types Informational / MCQ / Boss Battle. **[Questify]** |
| FR-EDU-011 | Partner content creators shall be able to set quest difficulty (Easy/Medium/Hard) and reward values (`rewardXp`, `rewardCoins`), consistent with Questify's confirmed quest-reward model. **[Questify]** |
| FR-EDU-011b **(v1.1)** | Partner content creators may generate draft quest stages from an uploaded source document via Questify's confirmed AI content-generation pipeline (upload → chunk → LLM draft → human review/edit/approve/reject, with bulk-approve auto-resolving section/quest structure); nothing generated this way publishes without human approval. Questify's own self-reported evaluation (75 stages, 4 courses) found 0% hallucination and 96% mean correctness — a strong precedent, not a guarantee for Bosla's own content mix. | Questify |
| FR-EDU-012 | Linear gating (LOCKED→UNLOCKED→IN_PROGRESS→COMPLETED) shall apply to partner courses identically to Questify's confirmed behavior — no partner may bypass gating without an explicit admin override, logged as an audit event. **[Questify]** + [Proposal for the override control] |
| FR-EDU-013 | Certificates: where a partner offers one, Bosla shall display and let the user download/share it on course completion. | [Proposal] — **[Gap]**: no source document confirms a certificate data model; treat as net-new. |

### 13.3 Content ownership and permissions [Proposal]

- BR-EDU-001: Partner-authored content remains the partner's IP; Bosla's license is display/distribution within the app, revocable on offboarding (content is unpublished, not deleted, pending a data-retention decision — OQ-9).
- BR-EDU-002: A partner admin can edit/retire only their own organization's content; platform-wide gamification rules (badge thresholds, XP formula, leaderboard periods) remain admin-only, mirroring Questify's LECTURER/ADMIN boundary. **[Questify]**

### 13.4 Enrollment and access flows [Proposal]

FR-EDU-020: A user enrolls in a partner course either directly (catalog browse) or as a roadmap-recommended step (§11.4 linkage). FR-EDU-021 **(v1.1, resolved)**: Enrollment access shall be gated by the user's subscription tier (§13.10) and, where relevant, the partner's own bundled-catalog allowance — not a per-course purchase model, per the tier structure decided this revision.

### 13.5 Progress synchronization [Proposal, reusing Questify's confirmed mechanics]

FR-EDU-030: Stage-level attempts, correctness, consecutive-correct counters, and mastery status shall sync in near-real-time to the same event-bus architecture Questify uses (`QuestCompleted`, `StageMastered`, etc.), so XP/badges/achievements/challenges update consistently. **[Questify]**

### 13.6 Course quality standards [Proposal — DECIDED, this revision]

FR-EDU-040: Partner courses shall pass a pre-publish content review before appearing in the catalog, combining (a) a structural check (has all required sections/stages) and (b) a pedagogical-quality rubric **reused directly from Questify's own confirmed content-evaluation criteria** (§9.4): correctness, difficulty fit, relevance, clarity, and engagement, each scored 1–5. FR-EDU-041 **(v1.2)**: a course publishes only if every stage scores ≥3/5 on every criterion and the course-wide mean is ≥4/5 — mirroring the quality bar Questify's own AI-content-generation pipeline was evaluated against and cleared (0% hallucination, no stage below 3/5, §9.4). Scoring may be assisted by an automated pass (for AI-generated or AI-assisted partner content, §13.2 FR-EDU-011b) but always carries a required human-reviewer sign-off before publish.

### 13.7 Revenue and partnership considerations [Proposal — RESOLVED at the model level, this revision]

The commercial model is now defined contextually against Bosla's subscription-tier structure: see §13.10 for the full tier table and BR-EDU-071/072 for the content-partner revenue-share and reseller-commission principles. What remains undecided is **exact percentages/pricing**, which is a finance-team deliverable — see OQ-23. This PRD intentionally does not invent numbers for those, consistent with the instruction not to fabricate unconfirmed specifics.

### 13.8 User experience for partner-provided content [Proposal]

FR-EDU-050: Partner-provided content shall be visually distinguishable (partner attribution/badge) from Bosla's own roadmap/discovery content, so trust and sourcing stay transparent.

### 13.9 Marketing/Reseller Partners [Proposal — resolves the "marketing partners" requirement of this revision]

**User stories**
- As a corporate L&D provider, I want to resell Bosla to my own employees/clients under a commercial agreement, so I can offer career-development benefits without building my own platform.
- As Bosla, I want every reseller-attributed user tracked back to the reseller relationship, so revenue share and reporting are accurate.

**Functional requirements**

| ID | Requirement |
|---|---|
| FR-EDU-060 | A Marketing/Reseller Partner shall receive a unique attribution mechanism (referral code/link or bulk-invite flow) so users they bring to Bosla are tracked to that partner. |
| FR-EDU-061 **[DECIDED]** | The system shall record, per user, at most one attributed Marketing/Reseller Partner, assigned on a **first-touch, lifetime-sticky** basis: the first reseller referral link/code a user signs up through is permanent for that account and is never overwritten by a later referral. |
| FR-EDU-062 | A Marketing/Reseller Partner's admin view shall show only aggregate/anonymized performance of their attributed users (engagement, tier distribution, retention) by default — individual learner data requires the same consent-gating as any other party accessing user data (§24). |
| FR-EDU-063 | A Marketing/Reseller Partner may be assigned a negotiated subscription-tier pricing/bundle (§13.10) distinct from Bosla's public consumer pricing, without altering the underlying feature set per tier. |

**Business rules:** BR-EDU-060 — a Marketing/Reseller Partner's *authority to sell* is a signed-agreement fact recorded on the partner account (§13.1 FR-EDU-001), not a technical permission a partner can self-grant. BR-EDU-061 — reseller attribution never grants the reseller access to an individual user's learning/career data beyond aggregate reporting, without that user's separate explicit consent.

**Data requirements:** DR-EDU-060 partner-attribution record (partner id, user id, attribution timestamp, referral mechanism); DR-EDU-061 partner commercial-terms record (tier bundle, negotiated pricing reference, contract reference — **[Gap]**, actual contract terms are a legal-team deliverable, not modeled here).

**Edge cases:** a user was referred by one reseller but later also engages with a second reseller's link — resolved by the first-touch rule above: the second link has no attribution effect, though the UX should tell the user their account is already attributed rather than silently ignoring the second link; a reseller's agreement lapses while its attributed users are still active (their access continues per their subscription terms — attribution stops driving new revenue share, but existing users are never cut off mid-subscription).

**Acceptance criteria:** AC-EDU-060 — a user who signs up via a reseller's referral link is attributed to that reseller and appears in the reseller's aggregate dashboard, without exposing that individual user's learning data beyond consented aggregates.

**Success metrics:** reseller-attributed user count and retention vs. direct-signup users; reseller-driven revenue share of total.

**Phase:** Phase 4 (alongside Content-Partner onboarding, since both partner types share the same onboarding flow, §13.1).

### 13.10 Subscription Tiers & Monetization Model [Proposal — resolves OQ-8, configured contextually per this revision's business-model decision]

**Design principle [DECIDED, this revision]:** tiers are configured to unlock progressively along the same phase sequence the roadmap already ships in (§29) — a user's subscription tier gates *which shipped phases' features* they can access, not a separate feature list invented independently of the roadmap.

| Tier | Unlocks (cumulative) | Primary phase(s) | Notes |
|---|---|---|---|
| **Free** | Career discovery (adaptive conversation, CV ingestion, 3–5 recommendations, mentorship chat, PDF export — §11) + full habit-tracking core on its native engine (§15) | Phase 1–2 | The entire MVP is free — this is the acquisition funnel, matching the MOM's own framing of a self-contained, useful first session **[MOM]** |
| **Plus** | Questify-unified gamification (§16), education-partner course access (§13) up to a bundled catalog allowance, voice-based knowledge evaluation (§18) | Phase 3–5 | The first paid tier; priced to cover LLM/ASR inference cost, which free-tier discovery/chat already incurs, so Plus is where that cost is recovered |
| **Pro** | Unlimited/expanded partner-course catalog access, community & mentorship (§17), the multimodal RAG agent (§19) | Phase 6–7 | Positioned as the "serious career growth" tier |
| **Partner-Sponsored / Enterprise** | Negotiated bundle (often Pro-equivalent or custom), sold via a Marketing/Reseller Partner (§13.9) at partner-negotiated pricing, potentially org-branded | Any phase, sold wherever the partner's agreement starts | Not a feature tier so much as a *distribution channel* — the feature set is one of the above three, chosen contractually |

**Business rules**
- BR-EDU-070: a subscription downgrade must never retroactively delete a user's earned progress/history (XP, badges, habit history) — it only gates *forward* access to gated features, consistent with the product's broader "never silently discard earned progress" principle (§16 FR-GAM-B06, §15 FR-HAB-003).
- BR-EDU-071 **[DECIDED]**: Content Partners are compensated via a **70/30 revenue-share pool** (70% to the partner pool, 30% retained by Bosla) on the portion of subscription revenue attributable to paid users actively engaged with partner content that billing period, distributed within the pool proportional to attributable learner engagement/completion — a pool-based model, not a flat license fee, and not a per-partner-negotiated number, so it scales cleanly to any number of partners.
- BR-EDU-072 **[DECIDED]**: Marketing/Reseller Partners earn a **20% commission** on subscriptions sold through their attribution (§13.9 FR-EDU-061), or may instead negotiate a **30% wholesale discount** for a bulk/enterprise bundle they resell directly at their own price — a partner picks one model per agreement, not both. These are Bosla's initial default commercial terms, set here as a product decision; either may still be adjusted per future negotiation without changing the underlying mechanics.

**Data requirements:** DR-EDU-070 subscription record (user id, tier, billing reference, status, start/renewal/cancel dates, attributed reseller if any); DR-EDU-071 revenue-share ledger (content partner id or reseller id, period, attributable amount) feeding the admin panel's reporting (§20).

**Edge cases:** a user on a Marketing/Reseller Partner's enterprise bundle also has a personal Free/Plus account — **[DECIDED]**: the enterprise bundle always supersedes a concurrent personal paid subscription for feature access (the user is never charged twice); any remaining personal-subscription-period credit is paused and banked, resuming automatically if the enterprise bundle attribution ever ends. A partner's content moves in/out of a tier's bundled catalog (must not strand an already-enrolled learner's access mid-course, consistent with §13.8's offboarding edge case).

**Acceptance criteria:** AC-EDU-070 — the entire MVP (Phase 1–2 feature set) remains accessible on the Free tier with no paywall. AC-EDU-071 — a Plus/Pro downgrade never removes a user's already-earned XP/badges/habit history from their profile, even if it re-gates forward access to Questify-unified features.

**Success metrics:** Free→Plus conversion rate; reseller-channel share of paid subscriptions; content-partner revenue-share payout accuracy (audit-reconciled against DR-EDU-071).

**Phase:** Tier *infrastructure* (subscription record, gating logic) should ship by Phase 3 (the first point any feature is actually gated); the tier *definitions* above are forward-looking through Phase 7.

**Edge cases:** a partner offboards mid-course for an actively enrolled learner (learner's progress and any earned badges/certificates must be preserved read-only for 12 months then archived — the concrete retention default set in §24); two partners offer overlapping content for the same skill gap (ranking/dedup logic needed — **[Gap]**, remains a genuine content-curation judgment call, not a policy question); a partner's content fails the linear-gating structural check.

**Acceptance criteria:** AC-EDU-001 — a partner's course, once approved, appears in the catalog and can be completed end-to-end with XP/badges/achievements awarded exactly as they would be for Bosla's own content.

**Success metrics:** partner content completion rate vs. Bosla-authored content; time-to-first-publish for a new partner.

**Phase:** Phase 4.

---

## 14. Career Recommendation and Career-Video Requirements

### 14.1 Career recommendations — see §11.2 (MVP, confirmed **[MOM]**).

### 14.2 Career daily-routine videos [Proposal — entire feature is a Phase-2 brief requirement with no source-document precedent beyond the MOM's MVP-scoped preference for curated existing content]

**User stories**
- As a user evaluating a recommended career, I want to see what a realistic day actually looks like, so I can picture myself doing the work. **[MOM]**

**Functional requirements**

| ID | Requirement |
|---|---|
| FR-VID-001 | Every recommended career profile shall link to a video covering: a realistic daily routine, typical responsibilities, work environment, required tools, common challenges, and career progression. |
| FR-VID-002 | MVP sourcing shall prefer curated, rights-cleared existing content over generated video, consistent with the MOM's explicit MVP decision. **[MOM Decision #4]** |
| FR-VID-003 (Phase 2+) | Where no curated video exists for a niche/local role, the system may generate a video via an AI content-generation pipeline, clearly labeled as AI-generated. |
| FR-VID-004 | Videos shall carry captions by default and support the app's supported languages (§25). |
| FR-VID-005 | Video appearance points: (a) inline on each career-profile card, (b) inside the role-preview step of the discovery flow, (c) linked from the roadmap. |

**Personalization rules [Proposal]:** video selection should prefer content matching the user's stated location/market where multiple variants exist for the same role; falls back to a general variant otherwise.

**Content-generation workflow [Proposal, only for FR-VID-003]:** script draft (LLM, grounded in the same career-taxonomy data used for recommendations) → fact-check pass against structured career data (not the model's unverified claims — mirrors the Habit Tracker Goals planner's "never trust the model's own citation memory, always independently verify" principle **[Habit Tracker]**) → human moderation review before publish → video synthesis → caption generation → publish.

**Video quality and moderation requirements:** BR-VID-001: no video (curated or generated) may claim guaranteed salary/outcomes; BR-VID-002: generated video must be labeled as AI-generated in-player, not just in metadata; BR-VID-003: every video passes a human moderation gate before it's attached to a live career profile.

**Accessibility, captions, and language support:** captions mandatory (§25); at least English/Arabic per §12.

**Risks of inaccurate career representation:** flagged directly by the MOM as a differentiation/trust risk — an unexplained or inaccurate portrayal undermines the whole product's credibility. **[MOM — Key Product Risks]** Mitigation: the fact-check + human-moderation gate above, plus a visible "report inaccurate" control on every video.

**Success metrics:** % of recommendation sessions where the user watches ≥50% of a linked video; "did this feel realistic" post-video rating.

**Data requirements:** DR-VID-001 video metadata (role, source: curated/generated, rights/license reference, moderation status, language/caption tracks).

**Edge cases:** no video exists for a hyper-specific or emerging role; licensed curated content is later taken down by its original host; generated video's script cites a fact not present in verified career data.

**Acceptance criteria:** AC-VID-001 — every one of the 3–5 recommended profiles in a session has an associated video or an explicit "coming soon" state, never a broken link.

**Phase:** Phase 2 (curated video); AI-generated video is Phase 2+/backlog, explicitly gated behind the moderation workflow above.

---

## 15. Habit Tracker and Gamification Requirements (habit-side)

**MVP scope note (v1.1):** Habit Tracker is now an MVP (Phase 1) source project alongside Masar.ai. In the MVP, this section's requirements ship using **Habit Tracker's own native scoring engine** — points, streaks, XP, its own 8-level curve, all as confirmed in §9.1 — exactly as built in the source project. The Questify-based *unification* of this engine described in §16 (Track B) is explicitly **post-MVP** (Phase 3): it replaces the native XP/level formulas with Questify's shared engine once Questify joins the product, and §16's intro now states the migration implication this creates. Until then, this section is the full, standalone specification of the habit-tracking core, including its own native gamification mechanics — §16 covers only the later Questify-based unification, not a duplicate spec.

This section covers the **habit-tracking core**; the shared gamification *mechanics*, once Questify joins, are specified once in §16 to avoid duplicating Questify's engine, per the brief's explicit instruction to avoid duplication between the two.

**User stories**
- As a user with a roadmap step "learn Python basics," I want that turned into an actual daily habit I can track, not just a bullet point. **[Habit Tracker pattern]**
- As a user who missed a day, I want my history to reflect what actually happened — not lose all my progress, and not get silently credited for something I didn't do. **[Habit Tracker]**

**Functional requirements**

| ID | Requirement | Source |
|---|---|---|
| FR-HAB-001 | Habits shall support recurrence, time-of-day, duration target, and difficulty, owned by the app (not by any external calendar). | Habit Tracker |
| FR-HAB-002 | Time-of-effort shall be tagged `timer` / `manual` / `assumed`, and `assumed` entries shall be visibly marked in the UI. | Habit Tracker |
| FR-HAB-003 | Completion state shall be **recomputed** from source records on every relevant change (a completion, an untick, a settings change), never incrementally patched — reverting a completion must claw back exactly what it granted, no more, no less. | Habit Tracker (core design principle) |
| FR-HAB-004 | A habit completed ≥90% of its scheduled days in a week shall trigger a surfaced (never auto-applied) proposal to raise its target; <70% triggers a proposal to lower it. | Habit Tracker |
| FR-HAB-005 | Habits may optionally sync completion state with Google Tasks two-way, with reminders mirrored to a write-only, app-owned Calendar for timed push notifications. | Habit Tracker |
| FR-HAB-006 | A goal (e.g., "learn Spanish") may be converted into a set of ordinary habits + to-dos via an AI planning flow; the plan runs a deterministic schedule-conflict check before any model-based critique, and independently re-verifies any cited resource link rather than trusting the model's memory of it. | Habit Tracker |
| FR-HAB-007 | Subtasks belong to a specific occurrence and are never "carried forward" to another day (carrying a subtask would silently rewrite what happened on the original day); manual to-do items *are* carried forward if unfinished. | Habit Tracker |

**Business rules**
- BR-HAB-001: deleting a goal must sever its link to the habits/to-dos it created without deleting their history (`ON DELETE SET NULL`, not cascade). **[Habit Tracker]**
- BR-HAB-002: an adaptive-difficulty proposal is never auto-applied — a change the user didn't consent to isn't measurement, it's the app rewriting its own rules. **[Habit Tracker]**

**Data requirements:** DR-HAB-001 habit definition (recurrence, time, target/baseline minutes, difficulty, optional `goal_id`); DR-HAB-002 occurrence (one concrete day of one habit, unique per habit+date, local date string never an instant — a confirmed defensive pattern against timezone off-by-one bugs); DR-HAB-003 time_log (measured/manual/assumed span).

**Technical/AI dependencies:** an `AiClient`-style provider abstraction (mirrors Habit Tracker's Anthropic/Groq adapters) so the Goals planner isn't locked to one LLM vendor; independent link-fetch service for resource verification.

**Edge cases:** device timezone change mid-streak; a Google Task completed on another device while the phone is offline; a goal's proposed session conflicts with an existing habit (must be caught by the deterministic conflict check, not left to the model); un-ticking a habit three days after logging it (points/XP must be clawed back exactly, no residue).

**Acceptance criteria**

| ID | Criterion |
|---|---|
| AC-HAB-001 | Given a completion is reverted, when the system recomputes, then exactly the points/XP that completion granted are removed — no more, no less. |
| AC-HAB-002 | Given a habit hits ≥90% completion for a week, when the week closes, then a raise-target proposal is surfaced (not auto-applied). |
| AC-HAB-003 | Given a Goals-planner draft schedules a session that conflicts with an existing habit, when the Intervenor reviews it, then the conflict is caught by the deterministic check without needing a model call. |

**Success metrics:** habit 7/30-day completion retention (§6); % of adaptive-difficulty proposals accepted; % of roadmap steps converted into an active habit.

**Phase:** Phase 1 (MVP), using Habit Tracker's native engine as built. The Questify-based unification of this engine is Phase 3 (§16).

---

## 16. Questify Integration Requirements (gamification engine, per the brief's two-track split)

The brief requires two clearly separated integrations of Questify. This section specifies both and states the boundary explicitly so they are never merged in implementation.

**MVP scope note (v1.1):** since the MVP (Phase 1) ships Habit Tracker's *native* gamification engine (§15) without Questify, this entire section — both tracks — is **post-MVP**. Track B additionally now carries a one-time migration requirement that didn't exist in the pre-v1.1 design: users will already have habit-tracking history scored under Habit Tracker's native formulas (points +2/+1/0/−1, its own 8-level curve) before Questify joins in Phase 3; that history must be reconciled against Questify's confirmed `level = floor(sqrt(XP/100)) + 1` formula (§9.4) without silently discarding or re-scoring a user's earned progress. See FR-GAM-B06 below.

### 16.1 Track A — Education-partner learning content: full Questify feature set [Questify, applied per §13]

| ID | Requirement |
|---|---|
| FR-GAM-A01 | Partner/Bosla-authored courses shall use the full Questify structure: Course→Section→Quest→Stage, quest difficulty, dynamic XP/coin rewards, linear gating, boss battles, and mastery tracking (2 consecutive correct). |
| FR-GAM-A02 | Course-scoped badges, achievements, and challenges (as distinct from general/cross-course ones) shall be available to partner content, consistent with Questify's confirmed "general vs. course-scoped" achievement-rule design. |
| FR-GAM-A03 | A Weekly Per-Course leaderboard shall exist per Questify's confirmed 3-leaderboard-type model (Weekly Global, Monthly Global, Weekly Per-Course). |

### 16.2 Track B — Habit Tracker: gamification mechanics only [Questify, restricted per the brief's explicit instruction]

| ID | Requirement |
|---|---|
| FR-GAM-B01 | Habit completions shall emit events onto the same typed event bus Questify uses, consumed by XP, streak, badge, and challenge evaluators — but **not** by the quest/stage/mastery/boss-battle entities, which are education-only. |
| FR-GAM-B02 | Habit-side XP shall use Questify's confirmed level formula, `level = floor(sqrt(XP/100)) + 1`, so a user has **one unified level**, not two competing numbers from two different engines. |
| FR-GAM-B03 | Streaks, streak-freezes, and login-dedup shall apply to habit activity using Questify's confirmed mechanics (nightly background check + app-start check; one freeze consumed per missed day; insufficient freezes let the streak break). |
| FR-GAM-B04 | Habit-only badge families and challenges shall be scoped separately from course-linked ones (e.g., a "Login streak" badge draws on overall app activity; a "Courses completed" badge draws only on education content) — no habit-only challenge may require course completion, and no course-only badge may be satisfied by habit activity alone. |
| FR-GAM-B05 | Coins and the shop (avatar items, streak-freezes) are shared across both tracks — a coin earned from a habit streak and a coin earned from a quest spend identically in the shop. |
| FR-GAM-B06 **(v1.2, DECIDED)** | At the Track-B migration point, each user's pre-existing Habit-Tracker-native level (one of its confirmed named tiers, Beginner through Formidable — §9.1) shall be converted into a seed Questify XP balance via a fixed, auditable mapping: native level ordinal *N* (Beginner=1 … Formidable=7) seeds the user at Questify level *N+1*'s XP floor, computed directly from Questify's own confirmed formula, `XP = ((level−1)²)×100`. This credits every migrated user above Questify's Level 1 floor without inventing XP out of nothing, and is fully auditable against the two formulas already confirmed in this PRD (§9.1, §9.4). | Proposal, required by the MVP resequencing |

**Business rule (the explicit separation the brief requires):** BR-GAM-001 — Educational quests (with stages, mastery, boss battles) must never be defined *inside* the habit-tracking module, and habit-tracking's recurrence/adaptive-difficulty engine (§15) must never be defined *inside* Questify's course structure. The two integrate only through: (1) the shared event bus, (2) the shared XP/level number, (3) the shared coin economy/shop. This avoids the duplication/conflict the brief warns against.

**Data requirements:** one `User` progression record (xp, level, coins) shared across both tracks, per Questify's confirmed model **[Questify]**; `XPEvent.source` distinguishes `habit:*` vs `quest:*` origins for the append-only history.

**Technical/AI dependencies:** typed event bus (Questify's confirmed architecture); background job runner for leaderboard snapshots and streak checks (Questify uses `pg-boss`; Bosla's mobile-backend equivalent is an architecture decision, §23).

**Edge cases:** a user has a habit named identically to a course quest (must not merge XP sources); a badge family's metric spans both tracks ambiguously (must be explicitly scoped to one track per BR-GAM-001, not left ambiguous); concurrent habit-completion and quest-completion events for the same user (both must be processed atomically/idempotently per Questify's confirmed anti-abuse design); **(v1.1)** a user's native-engine level title (e.g., "Disciplined") doesn't map cleanly onto Questify's sqrt-XP level number at migration time — the migration (FR-GAM-B06) must not silently reset a user to Level 1.

**Acceptance criteria:** AC-GAM-001 — a user's level is identical whether viewed from the Habits tab or the Learn tab, because both read the same `User.xp`. AC-GAM-002 — a course-scoped achievement cannot be completed by habit activity alone, and a habit-only challenge cannot be completed by course activity alone.

**Success metrics:** XP-event volume by source (habit vs. quest) as an engagement-mix indicator; leaderboard-driven session-return rate.

**Phase:** Phase 3 (Track B, habit-side) and Phase 4 (Track A, education-side) — sequenced because Track B has no partner-content dependency and can ship first.

---

## 17. Community and Mentorship Requirements [Proposal — entire section is net-new per the brief; no source document defines mentorship/community mechanics. Masar.ai's Agent 3 confirms only a 1:1 AI mentorship-*chat* pattern, not human mentorship.]

**User stories**
- As a user unsure whether a recommendation is right, I want to talk to someone who's actually done the job, not just read about it. [Proposal, motivated by MOM's differentiation risk callout]
- As a mentor, I want my expertise verified and visible so learners trust my guidance.

**Functional requirements**

| ID | Requirement |
|---|---|
| FR-COM-001 | The system shall support mentor discovery via career-tag/skill-tag matching against the user's saved career profile (§11.2). |
| FR-COM-002 | Mentor profiles shall display verification status (e.g., work-history/credential check) and a reputation signal (rating + completed-session count). |
| FR-COM-003 | Career-specific community groups shall exist, scoped to a recommended-career taxonomy tag (reusing DR-CD-011's taxonomy, once defined). |
| FR-COM-004 | The system shall support direct messaging and group discussions within a community. |
| FR-COM-005 | The system shall support scheduled workshops/office-hours/events, bookable by users. |
| FR-COM-006 | All community content and DMs shall be moderatable: report, review queue, and admin action (warn/mute/ban), logged to the audit trail (§22). |
| FR-COM-007 | Users shall control visibility of their profile/activity to the community independent of their app-wide privacy settings. |

**Business rules**
- BR-COM-001: mentor verification must complete before a mentor profile is publicly discoverable.
- BR-COM-002: the AI agent (§19) and any mentor/community content must never present professional legal, financial, or licensed mental-health advice; such topics trigger a disclaimer and, where appropriate, a referral prompt rather than a direct answer.
- BR-COM-003 **[DECIDED]**: a 3-tier moderation SLA applies — (1) high-confidence severe categories (explicit threats, illegal content, doxxing) are auto-hidden immediately pending review; (2) medium-confidence/ambiguous categories (harassment, spam) stay visible, queued for human review within 24 hours; (3) low-severity/borderline reports stay visible, queued for review within 72 hours. Category-to-tier mapping is admin-configurable but ships with this 3-tier default.

**Data requirements:** DR-COM-001 mentor profile (verification evidence, credentials, tags, reputation aggregate); DR-COM-002 community group (career tag, membership, moderation state); DR-COM-003 report record (reporter, target, reason, resolution, moderator, timestamp — feeds §22 audit logs).

**Technical/AI dependencies:** a matching/ranking service for mentor discovery (reuses the *pattern*, not the code, of Jobify's weighted multi-factor ranking **[Jobify]**); automated content-moderation classifier for the report-severity triage in BR-COM-003.

**Edge cases:** a mentor is reported while actively in a paid/booked session; a user in crisis raises a mental-health topic in a public group (must trigger the BR-COM-002 referral path, not silence); cross-border mentor-mentee legal/compliance differences (flagged as an open question, not solved here).

**Acceptance criteria**

| ID | Criterion |
|---|---|
| AC-COM-001 | Given a user searches by career tag, when results return, then only verified mentors matching that tag are shown by default, with an explicit toggle to include unverified. |
| AC-COM-002 | Given a message is reported and crosses the severity threshold, when the report is filed, then the message is hidden pending human review within the SLA defined in §22. |
| AC-COM-003 | Given the AI agent or a community post touches a legal/financial/mental-health topic, when it responds, then a disclaimer and referral prompt is shown instead of direct advice. |

**Success metrics:** mentor-match acceptance rate; average time-to-first-mentor-response; report-to-resolution median time; % of flagged advice-boundary triggers correctly deflected (sampled human audit).

**Phase:** Phase 6.

---

## 18. Voice-Transcription and Knowledge-Evaluation Requirements

This feature's required flow is stated verbatim in the brief; it is treated as **[Brief]**-confirmed at the flow level, with implementation detail marked **[Proposal]**, and its ASR foundation marked **[CohereVoice]**.

**Required flow (verbatim from the brief):** record → Cohere voice transcription → transcript + lesson context to an LLM → LLM evaluates understanding → constructive feedback + gap identification + next-activity recommendation. **[Brief]**

**User stories**
- As a learner, I want to explain what I understood out loud instead of picking a multiple-choice answer, so the check reflects real understanding.
- As a learner with an unclear recording, I want a chance to redo it rather than get penalized for a technical audio problem.

**Functional requirements**

| ID | Requirement | Source |
|---|---|---|
| FR-VOI-001 | The system shall let a user record a spoken explanation tied to a specific lesson/quest/stage. | Brief |
| FR-VOI-002 | The recording shall be transcribed via CohereVoice's confirmed ASR routing (Arabic-dialect model for Arabic input, multilingual model otherwise), preserving confidence scores per segment. | CohereVoice |
| FR-VOI-003 | The transcript plus the relevant lesson context (content summary, key concepts, mastery criteria) shall be sent to an LLM for evaluation. | Brief |
| FR-VOI-004 | The LLM shall return: a structured judgment of demonstrated understanding, specific identified gaps, and recommended next learning activities — not a bare pass/fail. | Brief |
| FR-VOI-005 | Low-confidence transcript segments (below a defined ASR-confidence threshold) shall be flagged to the user for re-recording before evaluation proceeds, rather than silently evaluated. | Proposal, built on CohereVoice's confirmed per-segment confidence scoring |
| FR-VOI-006 | The user shall be able to request human review of an AI evaluation they disagree with. | Proposal |

**Recording and transcription experience [Proposal]:** tap-to-record with a live waveform/timer, a re-record option before submission, and a visible "processing" state (transcription → evaluation are two distinct, separately-shown steps, mirroring CohereVoice's own separation of ASR output from LLM-generated output).

**Consent and data retention [DECIDED]:** explicit microphone-use consent at first use (§12); raw audio deleted within 30 days of evaluation, or immediately after any dispute/appeal window closes, whichever is later (§24); transcript text retained as part of the learner's progress record, deletable on request within 30 days per §24.

**Supported languages:** English + Arabic (incl. Egyptian/dialect via CohereVoice's confirmed routing) at MVP; other CohereVoice-supported languages considered as a backlog expansion. **[CohereVoice]**

**Evaluation rubric and scoring approach [Proposal — Gap: no source document defines an educational rubric; CohereVoice evaluates nothing today, it only transcribes/summarizes]:** the LLM evaluation shall be grounded in the specific lesson's stated learning objectives/mastery criteria (reusing Questify's confirmed stage-mastery concept as the target the spoken explanation is checked against **[Questify]**), returning a rubric-scored breakdown (e.g., concept coverage, accuracy, depth) rather than one opaque score — modeled on Jobify's confirmed "always explain the score by pillar, never a bare number" UX pattern. **[Jobify]**

**Feedback format [Proposal]:** plain-language strengths, plain-language gaps, 1–3 recommended next activities (linking back into the partner-course/quest structure of §13/§16).

**Handling unclear or poor-quality audio:** see FR-VOI-005; if re-recording still fails confidence thresholds after **3 attempts** — matching the Habit Tracker Goals-planner's own confirmed iteration cap (§9.1), reused as Bosla's house default for "stop asking the user to retry, offer a fallback instead" — the system offers a text-input fallback rather than blocking the learner. **[DECIDED, this revision]**

**Human-review or appeal options:** FR-VOI-006 above; escalates to an admin/mentor review queue (§20, §22).

**Guardrails against incorrect or overconfident AI assessment [Proposal, directly modeled on the Habit Tracker Goals-planner's Intervenor pattern of never trusting a single model pass]:** the evaluation shall never be based on the transcript alone without the lesson's grounding context attached in the same call (prevents evaluating "in a vacuum"); the system shall never state a numeric score with false precision beyond what the rubric supports; a confidence/uncertainty note accompanies every evaluation, mirroring the MOM's own explainability requirement for career recommendations. **[MOM pattern reused]**

**Accessibility requirements:** a text-input alternative to voice must always be available (§25) — voice is an option, never the only path to demonstrate understanding.

**Data requirements:** DR-VOI-001 voice-evaluation record (lesson reference, transcript, per-segment confidence, rubric scores, feedback text, gaps, recommended activities, review status).

**Technical/AI dependencies:** CohereVoice ASR service (confirmed, needs a hosted/API-accessible deployment — its current form is a local `127.0.0.1`-bound tool, not a multi-tenant service, so productionizing it is a real dependency, not a detail — **[Gap]**, flagged in §22); an LLM with the lesson context injected per call; a moderation/appeal queue (shared with §20 admin panel).

**Edge cases:** background noise/multiple speakers in the recording; code-switched Arabic/English explanation (CohereVoice's confirmed alignment layer safely interpolates unalignable code-switched characters, but the evaluation LLM must also handle mixed-language transcripts); a learner reads a definition verbatim rather than explaining in their own words (a "did you actually explain this vs. recite it" check is a **[Gap]** — not solved by any source document; flagged as a design risk, not silently assumed solved).

**Acceptance criteria**

| ID | Criterion |
|---|---|
| AC-VOI-001 | Given a learner submits a recording, when ASR confidence for a segment falls below the defined threshold, then the learner is prompted to re-record that portion before evaluation runs. |
| AC-VOI-002 | Given an evaluation completes, when the learner views feedback, then it includes at least one strength, one gap, and one recommended next activity — never a bare score. |
| AC-VOI-003 | Given a learner disputes an evaluation, when they request review, then the item enters a human-review queue visible to an admin/mentor role. |

**Success metrics:** % of recordings requiring re-record due to low confidence; appeal rate (goal target §6, <5%); correlation between voice-evaluation results and subsequent quest/stage performance (a validity check, not a vanity metric).

**Phase:** Phase 5.

---

## 19. Multimodal RAG Agent Requirements [Proposal — entire section responds to the brief's "Define:" list. No source document specifies a *multimodal, cross-domain* RAG implementation, but Questify's confirmed "course-ask" chatbot **[Questify]** — instructor-PDF chunking, local embedding via pgvector, top-k retrieval, "answer solely from the provided material" grounding — is a real, already-evaluated single-course/text-only precedent, not a hypothetical one; Masar.ai's stateful mentorship chat **[Masar.ai]** and the Habit Tracker's Actor/Intervenor loop **[Habit Tracker]** round out the confirmed design patterns this section reuses. What's genuinely net-new for Bosla is the **cross-source, cross-domain, eventually-multimodal** scope FR-RAG-002 asks for — Questify's version never leaves one course's own documents.]

**User stories**
- As a user, I want one assistant that knows my career goals, my habits, my course progress, and my quiz results, instead of repeating my context to five different chat boxes.

**Functional requirements**

| ID | Requirement |
|---|---|
| FR-RAG-001 | The agent shall accept text and voice input, and produce text output; image/video input is a stated future modality (see supported-modality table below), not MVP-of-this-feature. |
| FR-RAG-002 | The agent's retrieval index shall cover, subject to per-source consent flags: user goals/interests/skills/preferences (§11.1), career/market data (§11.2), partner course/quest content (§13/§16), uploaded documents, habit-tracking activity (§15), quest/gamification progress (§16), voice-evaluation results (§18), and community/mentorship context where privacy permissions allow (§17). |
| FR-RAG-003 | Every factual claim the agent makes about the user's own data shall be traceable to a retrieved source; the agent shall cite what it grounded an answer in when asked. |
| FR-RAG-004 | The agent shall refuse or hand off (not guess) when relevant information is absent, low-confidence, or outside its authorized scope (e.g., legal/financial/mental-health, per BR-COM-002). |
| FR-RAG-005 | The agent shall never take an irreversible action (enrolling in a paid course, sending a message on the user's behalf, submitting a job application) without explicit in-turn user confirmation. |

**Supported input/output modalities**

| Modality | In MVP of this feature | Notes |
|---|---|---|
| Text | Yes | |
| Voice | Yes | Reuses the CohereVoice ASR pipeline from §18 |
| Images | No (backlog) | e.g., a photo of handwritten notes or a whiteboard |
| Video | No (backlog) | e.g., grounding on a watched career video's content |
| Output: text | Yes | |
| Output: voice (TTS) | No (backlog) | |

**Knowledge sources and ingestion process [Proposal]:** each source system (career-discovery profile, habit DB, Questify progress store, community graph) emits events/records into a central ingestion pipeline; each record carries an owner-user-id and a consent scope; ingestion respects per-source consent — e.g., a user who opted out of community-context sharing is excluded from that retrieval index slice even if other data is indexed.

**Multimodal indexing and retrieval strategy [Proposal]:** text-first embedding index (career/course/habit/voice-transcript text) at MVP-of-this-feature; a true multimodal (image/video) embedding index is explicitly deferred, not silently assumed — reusing the brief's own instruction to distinguish confirmed scope from future scope.

**Personalization and memory rules [Proposal]:** long-lived memory (goals, career profile, skill gaps) is retrieved every turn; short-lived memory (current conversation) is session-scoped; the agent must not let a stale long-lived fact silently override a more recent contradicting one without surfacing the conflict to the user — a direct analog to the Habit Tracker's rule that the client never guesses server state locally. **[Habit Tracker pattern]**

**Source grounding and citations:** FR-RAG-003 above; implemented as an explicit "grounded in: [source list]" affordance the user can expand.

**Agent capabilities and prohibited actions**

| Capability | Allowed |
|---|---|
| Answer questions about the user's own progress/goals | Yes |
| Recommend next learning activities | Yes |
| Explain a career recommendation's rationale | Yes |
| Draft a message to a mentor for the user to review | Yes, draft-only |
| Send a message on the user's behalf without confirmation | No |
| Enroll the user in a paid course without confirmation | No |
| Submit a job application on the user's behalf | No (ties to the §8 boundary decision on Jobify's auto-apply) |
| Give licensed legal/financial/mental-health advice | No — disclaim + refer (BR-COM-002) |
| Access another user's data | No |

**Hallucination prevention [Proposal, directly modeled on the Habit Tracker Goals-planner's Intervenor design]:** a deterministic, no-model check runs first wherever one exists (e.g., "does this course exist in the catalog" is a database lookup, not a model guess); any link/resource the agent cites is independently verified, not trusted from the model's own memory of having seen it — the same rationale the Habit Tracker documents for why link verification is a separate fetch, never the model's word for it. **[Habit Tracker]**

**Privacy, consent, and access control:** every retrieval source is consent-gated per FR-RAG-002; access control mirrors Questify's confirmed RBAC pattern (a user's own data only, unless a mentor/admin role and an explicit sharing permission apply). **[Questify pattern reused]**

**Evaluation and monitoring [Proposal]:** sampled human review of agent transcripts for grounding accuracy and boundary-violation (advice-topic) detection; logged separately from the general audit trail (§22) given its higher review sensitivity.

**Fallback behavior when information is unavailable or uncertain:** FR-RAG-004; the agent states what it doesn't know rather than filling the gap, mirroring the MOM's own explainability/uncertainty requirement for career recommendations. **[MOM pattern reused]**

**Data requirements:** DR-RAG-001 a unified retrieval index schema tagging each record with source-system, owner, consent-scope, and modality.

**Technical/AI dependencies:** an embedding/retrieval store; an LLM with tool-use/function-calling for cross-source retrieval; a provider-agnostic client abstraction (reusing the Habit Tracker's confirmed `AiClient` interface pattern so Bosla isn't locked to a single LLM vendor). **[Habit Tracker]**

**Edge cases:** a user revokes consent for a data source mid-conversation (must immediately stop being retrievable, not just on next login); conflicting data from two sources (e.g., a stale career goal vs. a newer one — must surface the conflict, not silently pick one); the agent is asked something requiring a modality it doesn't support yet (image) — must say so, not attempt a text-only guess.

**Acceptance criteria**

| ID | Criterion |
|---|---|
| AC-RAG-001 | Given the agent answers a question about the user's own progress, when asked to show its source, then it cites the specific retrieved records. |
| AC-RAG-002 | Given the agent lacks grounding for a question, when it responds, then it explicitly states uncertainty/absence rather than fabricating an answer. |
| AC-RAG-003 | Given the agent is asked to take an irreversible action, when it responds, then it requests explicit confirmation before proceeding, or declines if the action is prohibited (per the capability table). |
| AC-RAG-004 | Given a user revokes a data-source consent, when the agent is next queried, then that source is excluded from retrieval immediately. |

**Success metrics:** grounded-citation rate (sampled audit); hallucination rate (sampled audit, target trend toward zero for factual claims about the user's own data); user-reported helpfulness rating.

**Phase:** Phase 7.

---

## 20. Admin-Panel Requirements

**Source split, stated explicitly per the brief's instruction not to add unsupported functionality without labeling it:**
- The **Admin Panel document** `bosla_questify_learning_analytics.md` is authoritative for the **analytics/ML/at-risk-detection** capability set (§20.1–20.4 below) — **[Admin Doc]**.
- Questify's guide confirms **roles and a content/platform management split** (§20.5) — **[Questify]**.
- Everything else the brief's required list asks for (broad user management, career/recommendation management, content moderation tooling, AI-agent monitoring, security/operational controls, audit-log specifics) is **not described in either provided document** and is marked **[Gap]** with a **[Proposal]** minimal definition so the requirement isn't silently dropped.

### 20.1 Learning Analytics Engine [Admin Doc]

| ID | Requirement |
|---|---|
| FR-ADM-001 | The admin panel shall compute a **Learning Progress Score** per learner from: lessons completed, skills mastered, quiz performance, assignment performance, learning consistency, and improvement over time — not completion percentage alone. |
| FR-ADM-002 | The system shall detect five confirmed learner-difficulty patterns: low engagement (no login for a configurable period, example given: 10 days), slow progression (active but not improving), repeated mistakes on a topic, high effort with low performance, and sudden performance decline. |
| FR-ADM-003 | The system shall compare Bosla-user vs. non-Bosla-user learner cohorts on progress, quiz average, completion rate, weekly learning time, and dropout/inactivity rate. |
| FR-ADM-004 | Any Bosla-vs-non-Bosla comparison shown to an admin shall be labeled as an **association**, not a causal claim, and shall note plausible confounders (prior ability, motivation, resource access, mentor support, available time, demographics). |
| FR-ADM-005 | The system shall support hypothesis testing (e.g., two-sample t-test) between learner groups, displaying the test statistic/p-value alongside the standard caveat that observational-group results require careful interpretation. |
| FR-ADM-006 | The system shall support correlation analysis between behavior and outcome variables (e.g., active days ↔ progress), always paired with a "correlation is not causation" disclosure. |
| FR-ADM-007 | The system shall support regression modeling to estimate learner progression from behavioral features (learning hours, active days, lessons completed, quiz attempts/average, assignment completion, failed attempts, recency, Bosla usage), presented as an estimate, not a guarantee. |
| FR-ADM-008 | The system shall support decision-tree-based rule extraction to give admins human-interpretable behavior rules. |
| FR-ADM-009 | The system shall support **at-risk classification** (yes/no, with a risk probability and its contributing signals), using calibrated/validated models (logistic regression, decision tree, or random forest are the confirmed candidate algorithms). |
| FR-ADM-010 | At-risk predictions shall **support human review, not auto-label or auto-penalize** a learner — the model output is a triage aid, not an autonomous decision. |

### 20.2 Administrator Dashboard [Admin Doc]

| ID | Requirement |
|---|---|
| FR-ADM-020 | The dashboard shall show platform-level metrics: total learners, active learners, average progress, average quiz score, at-risk-learner count, inactive-learner count. |
| FR-ADM-021 | The dashboard shall show a progression-over-time view, selectable at individual, group, course, and skill level. |
| FR-ADM-022 | The dashboard shall show a "problem areas" view ranking topics/skills by the percentage of learners struggling. |
| FR-ADM-023 | The dashboard shall show the Bosla-vs-non-Bosla comparison (FR-ADM-003) with its statistical test result, carrying the same causation caveat (FR-ADM-004) directly in the UI, not just in documentation. |
| FR-ADM-024 | An at-risk learner list shall show, per learner: risk probability and the specific contributing signals (e.g., "12 days inactive," "repeated failures in Algebra") that drove the score. |

### 20.3 Course/Gamification/Content Administration [Questify]

| ID | Requirement |
|---|---|
| FR-ADM-030 | Content creators (partner/lecturer role) shall manage courses, sections, quests, and stages, including setting quest difficulty and reward values, and may use an AI content-generation pipeline. |
| FR-ADM-031 | Platform administrators shall manage platform-wide gamification rules, the shop, reports, notifications, analytics, and audit information — distinct from and a superset of the content-creator role's scope. |

### 20.4 Roles and permissions [Questify confirmed baseline + Gap for anything beyond it]

**[Questify]** confirms three roles: STUDENT, LECTURER, ADMIN, enforced via JWT + RBAC + API-layer validation. **[Gap]**: neither source document defines finer-grained roles (e.g., a support-only admin, a read-only analyst, a partner-org-scoped admin distinct from a course-content lecturer) that a real operations team would likely need. **[DECIDED, this revision]**: the 5-role model is adopted as final — `SUPER_ADMIN`, `OPS_ADMIN` (user mgmt, moderation, no billing), `CONTENT_ADMIN` (platform-wide content/gamification rules, including the taxonomy tooling in §20.6), `PARTNER_ADMIN` (scoped to one partner org, mirrors LECTURER but with org-boundary enforcement per BR-EDU-002), `MENTOR` (community-scoped, §17). This is a deliberate, precedented extension beyond Questify's own 3-role baseline — Questify's own thesis documentation independently confirms it was already planning a comparable expansion (a future INSTRUCTOR role, §9.4), which validates that extending past STUDENT/LECTURER/ADMIN is a normal evolution of this exact role model, not a deviation from it.

### 20.5 Bosla Insights — Internal Product & Business Analytics [Proposal — resolves this revision's admin-panel decision: the panel must give Bosla itself insight into user performance/usage, not just partner-facing content analytics]

This is distinct from both the Admin Doc's confirmed **learner** analytics engine (§20.1–20.2, which is about learners' *educational* progress) and any partner-facing reporting (§13.9 FR-EDU-062, §13.10 DR-EDU-071, scoped to a partner's *own* attributed users). Bosla Insights is the internal, company-wide view across the *entire* product, for Bosla's own product/growth/business teams.

| ID | Requirement |
|---|---|
| FR-ADM-050 | Bosla Insights shall report cross-journey performance and engagement of Bosla's user base as a whole: career-discovery funnel conversion (§11), habit-tracking consistency and retention (§15), subscription-tier distribution and conversion (§13.10), Questify-engine engagement once live (§16), and voice-evaluation/community engagement once live (§18, §17) — i.e., every funnel step instrumented in §26, rolled up for internal use, not just for the learner-level Admin Doc dashboard. |
| FR-ADM-051 | Bosla Insights shall be restricted to `SUPER_ADMIN`/`OPS_ADMIN`-tier roles (§20.4) — it is not exposed to `PARTNER_ADMIN` or `CONTENT_ADMIN` roles, whose visibility stays scoped to their own org/content per BR-EDU-002. |
| FR-ADM-052 | Bosla Insights shall reuse, not duplicate, the Admin Doc's confirmed statistical-rigor conventions (§20.1) — e.g., any engagement-vs-outcome comparison it shows must carry the same association-not-causation and confounder disclosure as FR-ADM-004/FR-ADM-006. |

**Business rules:** BR-ADM-050 — Bosla Insights aggregates are computed from the same consent-scoped analytics pipeline as §26, so a user who opted out of analytics sharing is excluded here too, not just from partner/learner-facing views.

**Data requirements:** reuses DR-ADM-001 (per-learner analytics record) and the §26 event stream; no new PII beyond what's already collected elsewhere in this PRD.

**Success metrics:** this module's own success metric is qualitative/operational — whether Bosla's product team can answer the goal-tracking questions in §6 (habit retention, conversation completion, appeal rate, etc.) from this dashboard without ad-hoc data-team queries.

**Phase:** Phase 6, alongside the rest of the admin panel's analytics build-out (§20.1–20.2), since it depends on the same underlying event/analytics pipeline.

### 20.6 Admin Tooling Baseline — Decided Scope (v1.2)

| Area the brief requires | Decision |
|---|---|
| User management | Search/filter, view profile + consent state, suspend/reinstate, role change (within the role model, §20.4), admin-mediated account-merge requests (never self-serve, always audit-logged), and data export/delete requests fulfilled within the 30-day SLA set in §24. |
| Career and recommendation management | Taxonomy editing tools (the ISCO-08/ESCO cross-walk, §11.2, §21) scoped to `CONTENT_ADMIN`; a flagged-recommendation review queue feeding the same human-review principle as at-risk/analytics output (FR-ADM-010). |
| Community and mentor moderation tooling | The 3-tier report/review flow in §17 (BR-COM-003) plus mentor-verification approval/revocation, both scoped to `OPS_ADMIN`. |
| AI-agent monitoring and review | A sampled-transcript review queue plus the grounded-citation-rate/hallucination-rate metrics already specified in §19's Evaluation and Monitoring subsection. |
| Security and operational controls | Admin-account 2FA required for all admin roles; session timeout and IP-allowlisting available per-organization for `PARTNER_ADMIN` accounts; API-layer rate limiting on all admin/partner endpoints. |
| Audit logs | Every admin/partner state-change (status transitions, content publish/unpublish, moderation action, role change) is logged with actor, timestamp, and before/after state, retained ≥ 2 years, exportable, append-only — per the §24 regulatory-framework decision. |

This closes what were open Gaps in v1.1 at a scoping level; exact UI/workflow design remains an engineering task, not re-opened here.

**Business rules:** BR-ADM-001: at-risk model outputs must never automatically restrict a learner's access or silently change their content difficulty — human-review-only, per FR-ADM-010. BR-ADM-002: any comparison chart drawing on Bosla-vs-non-Bosla data must render the causation disclaimer in the same view, not a separate help page.

**Data requirements:** DR-ADM-001 per-learner analytics record (the feature list in FR-ADM-007); DR-ADM-002 model registry (which model version produced which at-risk score, for auditability and BR-ADM-001 accountability); DR-ADM-003 audit-log entry schema (actor, action, target, before/after, timestamp).

**Technical/AI dependencies:** a batch/streaming analytics pipeline; a model-serving layer for regression/classification, retrained on a **quarterly cadence by default [DECIDED]**, with an earlier out-of-cycle retrain triggered automatically if live calibration drift (predicted-vs-actual at-risk outcomes) exceeds 10 percentage points between scheduled retrains; RBAC/JWT auth service shared with the mobile backend.

**Edge cases:** a learner crosses "at-risk" and then self-corrects before any admin acts (status must update, not stay stale); a partner-scoped admin attempts to view another partner's analytics (must be blocked at the API layer, not just hidden in the UI); a model's calibration drifts and risk probabilities become unreliable — handled by the quarterly-retrain-plus-drift-trigger policy above.

**Acceptance criteria**

| ID | Criterion |
|---|---|
| AC-ADM-001 | Given the admin dashboard loads, when an admin views the Bosla-vs-non-Bosla comparison, then a p-value/statistical-test result and a causation-caveat notice are both visible in the same view. |
| AC-ADM-002 | Given a learner is flagged at-risk, when an admin opens the learner's detail view, then the specific contributing signals (not just a bare probability) are shown. |
| AC-ADM-003 | Given an admin performs any state-changing action (suspend a partner, unpublish content, resolve a report), when the action completes, then an audit-log entry with actor/timestamp/before-after state is created. |

**Success metrics:** median time from at-risk flag to admin action (§6); % of dashboard sessions that lead to a logged admin action (a proxy for whether the dashboard is actionable, not just descriptive, echoing the Admin Doc's own stated goal — "not simply display completion percentages" **[Admin Doc]**).

**Phase:** Phase 6 (baseline analytics + dashboard, since it depends on habit/course data existing from Phases 3–4); role/security hardening continues into Phase 8.

---

## 21. Data Model and Primary Entities

High-level entity map (full field-level schemas belong in engineering design docs, not this PRD; this is the traceability-level model):

| Entity | Key attributes (confirmed source in parentheses) | Owner module |
|---|---|---|
| `User` | id, auth identity, locale, consent flags, xp, level, coins (**[Questify]** shared progression fields) | Platform-wide |
| `CareerProfile` | interests, strengths, preferences, skills, experience, constraints, confidence-per-signal (**[MOM]**, schema itself an open item per MOM) | §11 |
| `CareerRecommendation` | role, rationale, supporting signals, uncertainty note, market-context+provenance, linked video (**[MOM]**) | §11, §14 |
| `RoadmapItem` | study path / subject / skill / portfolio step, optional linked habit (**[MOM]**, habit-link is **[Proposal]**) | §11.4 |
| `Habit` | recurrence, time, target minutes, difficulty, `goal_id` (**[Habit Tracker]**) | §15 |
| `Occurrence` | habit_id+date unique, local date string, provisioning state (**[Habit Tracker]**) | §15 |
| `TimeLog` | origin `timer`/`manual`/`assumed`, minutes (**[Habit Tracker]**) | §15 |
| `Goal` | title, target date, weekly budget, status (**[Habit Tracker]**) | §15 |
| `Course` / `Section` / `Quest` / `Stage` | difficulty, `rewardXp`, `rewardCoins`, gating state (**[Questify]**) | §13, §16 |
| `XPEvent` | userId, courseId (nullable for habit-sourced events), amount, source (**[Questify]**) | §16 |
| `BadgeDefinition` / `UserBadge` / `UserFeaturedBadge` | family, tier, threshold, metric (**[Questify]**) | §16 |
| `Achievement` / `UserAchievement` | JSON rule, general/course-scoped (**[Questify]**) | §16 |
| `ChallengeDefinition` / `UserChallenge` | metric, threshold, period, rewards (**[Questify]**) | §16 |
| `ShopItem` / `UserInventory` / `UserEquippedItem` | price, type, rarity, slot (**[Questify]**) | §16 |
| `LeaderboardSnapshot` | period type, ranking, computed-at (**[Questify]**) | §16 |
| `MentorProfile` | verification status, tags, reputation (**[Proposal]**) | §17 |
| `CommunityGroup` / `Report` | career tag, membership, moderation state (**[Proposal]**) | §17 |
| `VoiceEvaluation` | lesson ref, transcript, per-segment confidence, rubric scores, feedback, gaps, review status (**[Brief]**/**[CohereVoice]**/**[Proposal]**) | §18 |
| `RagRetrievalRecord` | source-system, owner, consent-scope, modality (**[Proposal]**) | §19 |
| `LearnerAnalyticsRecord` | learning hours, active days, lessons completed, quiz avg, attempts, progress, at-risk score+signals (**[Admin Doc]**) | §20 |
| `AuditLogEntry` | actor, action, target, before/after, timestamp (**[Proposal]**, baseline) | §20, §22 |
| `PartnerOrg` | status (pending/active/suspended/offboarded), content ownership (**[Proposal]**) | §13 |

**[DECIDED, this revision]**: `CareerTaxonomy`/skill-framework entity is now specified as an ISCO-08 + ESCO cross-walk (§11.2 DR-CD-011), resolving what was the single highest-leverage open modeling question in v1.0 (formerly OQ-4) — it powers career recommendations (§11.2), community group tagging and mentor matching (§17), and partner content skill-gap mapping (§13). Licensing and localization scope are both decided (§11.2): ESCO's open license requires attribution only, and an initial ~500-item Arabic localization pass ships in Phase 0.

---

## 22. Integrations and Dependencies

| Dependency | Status | Notes |
|---|---|---|
| CohereVoice ASR pipeline | **[CohereVoice]** confirmed capability, **not yet a multi-tenant hosted service** | Currently a local, `127.0.0.1`-bound Streamlit/CLI tool; productionizing (hosted API, auth, scaling, media-retention policy beyond its current "delete after job" behavior) is real engineering work, not a detail — **[Gap]** on hosting model |
| LLM provider(s) for career discovery, RAG agent, voice-evaluation scoring | **[DECIDED, this revision]** Multi-provider via a Bosla-managed abstraction (pattern reused from Habit Tracker's provider-agnostic `AiClient` **[Habit Tracker]**): **OpenAI, Anthropic, OpenRouter, and Groq.** All provider API keys are provisioned, held, and billed centrally by Bosla — never a user-supplied/BYOK key — so every AI feature fails closed exactly as CohereVoice's confirmed design does if Bosla's own configured provider is unavailable **[CohereVoice]**. | OQ-1 resolved; provider-to-feature routing (e.g., which provider powers voice-evaluation scoring vs. the RAG agent) remains an engineering implementation detail |
| Google Tasks/Calendar OAuth (habit sync) | **[Habit Tracker]** confirmed, optional | Mobile OAuth flow replaces the desktop loopback+PKCE flow |
| Questify-style event bus + background job runner | **[Questify]** confirmed architecture (`pg-boss` in the source project) | Mobile-backend equivalent is an architecture decision (§23) |
| Jobify's ATS/CV-scoring and job-matching logic | **[Jobify]** confirmed, reused only as scoring/matching intelligence (§8 boundary) | Autonomous multi-site scraping/auto-apply explicitly not adopted |
| Education-partner content APIs/feeds | **[Gap]**, no source document | Partner-by-partner integration contracts, TBD per partner |
| Payment/commerce (subscriptions, partner revenue-share payouts) | **[Proposal]**, model and percentages decided (§13.10 BR-EDU-071/072) | Payment processor selection is an implementation decision, not modeled here |
| Push notification service | **[Proposal]** | Standard mobile push (FCM/APNs) |
| Analytics/event-tracking pipeline | **[Proposal]**, feeds §20's Admin Doc-confirmed analytics engine | §26 |

---

## 23. High-Level Technical Architecture

```
          Bosla App — Phase 1: React web MVP; Phase 2+: React Native mobile
        Discover | Habits | Learn | Community | Profile | RAG-agent entry
                                   |
                         Mobile Backend / API Gateway
                                   |
   +------------+------------+------------+------------+------------+
   |            |            |            |            |            |
Career-      Habit         Learning/     Community/    Voice-       RAG Agent
Discovery    Service       Gamification  Mentorship    Evaluation   Service
Service      (recompute-    Service       Service       Service      (retrieval +
(adaptive     honest,       (event bus:                              tool-using LLM)
 convo +      Google-       XP/level/                   |
 LLM)         Tasks-        badges/                     v
   |          optional      achievements/           CohereVoice
   v          sync)         challenges/               ASR API
LLM provider     |          leaderboards,             (hosted)
 abstraction     v          shop — Questify-               |
   |         Background     confirmed engine,               v
   v         job runner     shared across                Evaluation LLM
Career/Market   (streak     Habit + Learning              (grounded on
 data source    checks,     tracks per §16)               lesson context)
 (ILOSTAT/     snapshots)      |
                national stats,
                decided §11.2)
                                v
                        Partner Content
                        Integration Layer
                        (Course/Section/
                         Quest/Stage, per
                         partner contract)
                                   |
                         Shared Data Layer
              (User/progression, consent, analytics,
                        audit — relational + event log)
                                   |
                      Admin Panel (web) — Analytics/ML
                   engine (§20.1), RBAC, moderation, audit
```

**Architectural principles carried forward from confirmed source projects, not invented for this diagram:**
- **Recompute, don't increment** for anything score-like — the single most load-bearing correctness principle in Habit Tracker, reused for both habit and (per Questify's own design) gamification state. **[Habit Tracker]**
- **Event bus, not direct coupling**, between "an activity happened" and "everything that reacts to it" (XP, badges, notifications, audit). **[Questify]**
- **Deterministic checks before model calls**, everywhere a cheap certain check exists (schedule conflicts, catalog existence, link resolution) — never spend an LLM call discovering something code already knows for free. **[Habit Tracker]**
- **Fail closed on AI providers** — no feature silently proceeds against an unconfigured/unintended provider. **[CohereVoice]**
- **Provider-agnostic AI client interface**, so no single feature is hard-locked to one LLM vendor. **[Habit Tracker]**

**Technology decisions [DECIDED, this revision — resolves OQ-1/OQ-2]:**

| Layer | Decision | Rationale |
|---|---|---|
| MVP web framework | **React** (web app) | FR-WEB-001; ships fast, browser-only, no app-store review cycle for the MVP |
| Native mobile framework (Phase 2+) | **React Native** (Expo-managed, mirroring Questify's own confirmed Expo/React Native mobile client **[Questify]**) | One codebase for iOS+Android (FR-MOB-001); Questify's app is already built this way, lowering integration risk once Questify joins in Phase 3–4; sharing React as the base across web and native lets data/business-logic hooks carry over |
| LLM providers | OpenAI, Anthropic, OpenRouter, Groq — Bosla-managed keys, server-side only | See §22; matches Habit Tracker's confirmed provider-agnostic `AiClient` pattern, now with a named roster instead of "TBD" |
| Backend language/framework | Node.js/TypeScript (Express or NestJS) services | Directly mirrors Questify's own confirmed, already-working Express 5 + Prisma 7 stack **[Questify]** — since Questify's engine is integrated wholesale in Phase 3–4 (§16), matching its language/runtime avoids a costly rewrite-at-the-seam and lets Bosla reuse Questify's own event-bus/job-queue patterns directly |
| Primary database | PostgreSQL, with the `pgvector` extension for embeddings | Matches Questify's confirmed choice **[Questify]**; one database technology serves both relational data and the RAG agent's (§19) and Questify's course-ask's (§9.4) vector retrieval needs, avoiding a separate vector-database service |
| Background jobs | `pg-boss` (Postgres-backed queue) | Matches Questify's confirmed choice **[Questify]** for leaderboard snapshots, streak checks, AI content generation, and RAG ingestion |
| Object storage | S3-compatible object storage | For CVs, voice recordings, generated PDFs, video assets |
| Hosting | Managed cloud (e.g., AWS or GCP) — managed Postgres, containerized (Docker) API services, autoscaled behind a load balancer, CDN for video/media delivery | Matches Questify's own confirmed statelessness/horizontal-scaling NFR target (§9.4) so Bosla's backend can absorb Questify's engine without an architecture mismatch |
| CohereVoice ASR hosting | Separate, GPU-backed managed service, not co-located with the stateless API tier | CohereVoice's confirmed local/`127.0.0.1` deployment is model-inference-heavy (§9.5, §22) and needs different scaling characteristics than the stateless API |

This closes OQ-1 and OQ-2. Residual, lower-priority decisions (exact cloud vendor, exact managed-Postgres product, CI/CD tooling) are an infrastructure-team implementation choice, not re-opened here.

---

## 24. Privacy, Security, Safety, and Responsible-AI Requirements

| ID | Requirement | Source |
|---|---|---|
| NFR-001 | CVs, portfolios, conversations, inferred traits, and career decisions are sensitive personal data requiring explicit consent and user-initiated deletion. | MOM — Key Product Risks: Privacy |
| NFR-002 | Salary/market-demand claims must show location, date, and source, or must not be shown. | MOM |
| NFR-003 | Recommendations/assessments must never be presented as a validated psychometric or clinical diagnosis. | MOM |
| NFR-004 | Voice recordings: explicit consent before first use; raw audio deleted within 30 days of evaluation or immediately after any dispute window closes, whichever is later (§24, decided); transcript retained as part of the learner record, user-deletable. | Brief + Proposal, DECIDED |
| NFR-005 | AI-generated career videos must be labeled as AI-generated in-player. | Proposal (§14) |
| NFR-006 | Server-side-only reward/currency grants — a client must never be trusted to report its own XP/coin amount. | Questify (confirmed anti-abuse design) |
| NFR-007 | Achievement/badge awarding must be idempotent under concurrent/duplicate events. | Questify |
| NFR-008 | Daily login-based progression must be deduplicated per calendar day. | Questify |
| NFR-009 | RBAC + JWT-style auth for all admin/partner/mentor privileged actions. | Questify |
| NFR-010 | The RAG agent must never access another user's data, and must respect per-source consent revocation immediately (§19 FR-RAG's consent rules). | Proposal |
| NFR-011 | The RAG agent and community/mentor content must disclaim and refer rather than directly answer legal/financial/licensed-mental-health questions. | Proposal (§17 BR-COM-002) |
| NFR-012 | CohereVoice's confirmed media-retention behavior (delete uploaded media from temp storage after each job) must be preserved or strengthened, not weakened, when productionized as a hosted service. | CohereVoice |
| NFR-013 | Every admin/partner state-changing action is audit-logged with actor, timestamp, before/after state. | Proposal (§20, §22) |
| NFR-014 | At-risk/analytics model outputs must remain human-review-only — never an automated access/content restriction. | Admin Doc (§20 FR-ADM-010) |
| NFR-015 | OAuth token storage (e.g., Google Tasks/Calendar) must be encrypted at rest, mirroring the Habit Tracker's confirmed DPAPI-encrypted token vault design intent (mobile equivalent: platform keystore). | Habit Tracker |

**[DECIDED, this revision]:** the target regulatory framework is a GDPR-equivalent baseline applied globally (the strictest common denominator), anchored by **Egypt's Personal Data Protection Law (Law No. 151 of 2020)** as the home-market law given Bosla's Egypt-rooted, Arabic-first positioning (CohereVoice's Egyptian-Arabic ASR focus, §9.5; Questify's Ain Shams University origin, §9.4), extended per-market as Bosla expands into new regions. This resolves OQ-3/OQ-17. Concrete defaults this now unlocks — proposed, pending legal review, not yet contractually final:

| Retention item | Proposed default | Resolves |
|---|---|---|
| Raw voice recordings (§18) | Deleted within 30 days of evaluation, or immediately after any dispute/appeal window closes, whichever is later | OQ-13 |
| Voice transcripts / evaluation records | Retained for account lifetime, deletable on request (GDPR-style erasure) within 30 days of a verified request | OQ-13 |
| Partner-offboarded content (§13.8) | Retained read-only for enrolled learners for 12 months, then archived (not deleted) | OQ-9 |
| Audit log entries (§20, §22) | Retained ≥ 2 years, exportable, append-only/tamper-evident | OQ-15 |
| User data export/delete request SLA | Fulfilled within 30 days (GDPR standard) | Feeds OQ-14's admin user-management scope |

These are proposed defaults consistent with the chosen framework, not a substitute for legal sign-off before launch.

---

## 25. Accessibility and Localization Requirements

| ID | Requirement | Source |
|---|---|---|
| NFR-020 | Career videos carry captions by default. | Brief (§14) |
| NFR-021 | Voice evaluation always offers a text-input alternative — voice is never the only path to demonstrate understanding. | Proposal (§18), directly protects users who can't or don't want to use voice |
| NFR-022 | English and Arabic supported at MVP, including Egyptian/dialect Arabic for voice input, per CohereVoice's confirmed model routing. | CohereVoice |
| NFR-023 | Mobile UI meets platform accessibility baselines: dynamic type support, screen-reader labels on all interactive elements, minimum contrast ratios. | Proposal |
| NFR-024 | AI-generated content (videos, agent responses) is presented in the user's selected language, with translation quality bounded by the underlying provider's confirmed multilingual capability. | CohereVoice (14-language base ASR/translation model) |

**[Gap]**: no source document lists a target language set beyond English/Arabic; further-language rollout is a backlog decision.

---

## 26. Analytics and Event-Tracking Requirements

Bosla's own product analytics (funnel/engagement tracking for the product team) is distinct from the learner-facing **Learning Analytics Engine** in §20, though they may share infrastructure.

| ID | Requirement |
|---|---|
| FR-ANL-001 | Every major funnel step (onboarding complete, discovery-conversation complete, recommendation accepted, roadmap generated, habit created, first habit completion, course enrolled, quest completed, voice-evaluation submitted, mentor matched) shall emit a trackable event. |
| FR-ANL-002 | Events shall carry enough context to compute every metric named in §6's goals table without ad-hoc joins against production data. |
| FR-ANL-003 | Event tracking shall respect the same consent scopes as §24/§19 — a user who opts out of analytics sharing is excluded from aggregate reporting, not just anonymized after the fact. |

**Phase:** Phase 0 (instrumentation plumbing) so every later phase ships with metrics from day one, rather than retrofitted.

---

## 27. Non-Functional Requirements (performance, reliability, scale)

| ID | Requirement | Source |
|---|---|---|
| NFR-030 | Gamification hot-path requests (award XP, check badge, update challenge progress) target < 300ms p95, matching Questify's own confirmed nonfunctional target. | Questify |
| NFR-031 | Leaderboards must never be computed synchronously per-request against live data — background-computed, cached snapshots only, per Questify's confirmed design. | Questify |
| NFR-032 | The habit-tracking core's recompute logic must be deterministic (five consecutive identical syncs must produce a byte-identical result, mirroring Habit Tracker's own confirmed test guarantee); full offline operation and reconnect-reconciliation is a native-app (Phase 2+) requirement, per §12.2. | Habit Tracker |
| NFR-033 | Sync watermarks must advance from the server's authoritative clock, never the local device clock, to stay correct across clock skew. | Habit Tracker |
| NFR-034 | AI-provider calls must have an explicit timeout/retry/fallback policy, including honoring provider-supplied retry-after signals, mirroring the Habit Tracker's confirmed Groq-adapter behavior. | Habit Tracker |
| NFR-035 | The system must be resilient to partial failure in secondary paths (e.g., a failed notification must never invalidate a successfully completed quest), per Questify's confirmed failure-isolation design. | Questify |

**[DECIDED, this revision]**: initial production targets are Questify's own confirmed scale target — "tens of thousands of concurrent learners" (§9.4) — reused as Bosla's baseline since Questify's engine is integrated wholesale from Phase 3 onward; a 99.9% uptime SLA (standard for a consumer mobile app at this stage); and regional latency handled via the CDN-backed hosting decision in §23 rather than a fixed numeric per-region target. These are revisited once real production traffic data exists, not treated as permanent ceilings.

---

## 28. Risks, Constraints, and Mitigations

| Risk | Source | Mitigation |
|---|---|---|
| Differentiation risk — conversational UI alone looks like "a nicer personality test" | MOM | Lead with explainability + role previews + roadmap, not just the conversational format |
| Trust risk — unexplained recommendations don't convince users or reviewers | MOM | FR-CD-011 mandatory rationale + uncertainty on every recommendation |
| Scope risk — learning personalization, simulations, continuous coaching, and fine-tuning can't all fit one release | MOM | Phased roadmap (§29), explicit non-goals (§7) |
| Assessment-validity risk — presenting AI output as a clinical/psychometric diagnosis | MOM | BR-CD-010, NFR-003 |
| Data-quality risk — unsourced salary/market claims | MOM | BR-CD-011, NFR-002 |
| Privacy risk — CVs, conversations, voice, inferred traits are sensitive | MOM | §24 |
| Cold-start risk — the product needs a useful first session before longitudinal data exists | MOM | MVP's discovery+recommendation flow is deliberately self-contained and useful in one sitting |
| Feedback-loop/bias risk — learning from outcomes can reinforce biased recommendations if ungoverned | MOM | At-risk/recommendation models stay human-review-only (NFR-014); model registry for accountability (DR-ADM-002) |
| Two of four source engines are desktop-only, not mobile | Habit Tracker, Jobify | §12 treats mobile porting as first-class architecture work, not a detail |
| CohereVoice is a local single-tenant tool, not a hosted multi-tenant service | CohereVoice | Flagged explicitly in §22 as real engineering scope, not assumed solved |
| Jobify's autonomous auto-apply is unfinished/stub-only in its source form | Jobify | Decided: not adopted, at all (§8) |
| No confirmed career taxonomy/skill framework existed anywhere in the source material | MOM (Open Question 4) | Decided: ISCO-08 cross-walked with ESCO, localized into Arabic/English (§11.2, §21) |
| Gamification abuse (self-awarded currency, duplicate achievements, exploit loops) | Questify | NFR-006–NFR-008 reuse Questify's confirmed, already-designed anti-abuse mechanisms |
| Voice evaluation could feel punitive or unfair if audio quality issues are mistaken for poor understanding | Brief | FR-VOI-005/006, re-record + human-review path |
| Community/mentorship could surface legal/financial/mental-health advice liability | Brief | BR-COM-002, NFR-011 |

---

## 29. Roadmap and Phased Implementation Plan

Sequencing rationale, stated explicitly per the brief's requirement, updated for the v1.1 scope change: the MOM's own scope discipline (freeze a small, coherent MVP; push personalization/simulation/coaching/fine-tuning later) remains the discipline behind keeping MVP small **[MOM]** — but per explicit instruction, **the MVP is now defined by source project, not by journey stage**: it ships everything confirmed in §9.1 (Habit Tracker) and §9.2 (Masar.ai) together, since both are fully-built engines that don't depend on any other source project. Questify (§9.4) is deliberately excluded from MVP and introduced starting Phase 3 — both because it wasn't named as an MVP source, and because introducing it later means the habit-tracking core ships and gets validated on its own native engine first, with a single, explicit, auditable migration step (§16 FR-GAM-B06) onto Questify's shared engine, rather than building that migration complexity into the MVP itself. Track B is still sequenced before Track A within the post-MVP Questify work, for the reason established in v1.0: it has no partner-content dependency and validates the shared XP/event-bus architecture before Track A's course-structure complexity is added on top.

| Phase | Focus | Key deliverables | Primary sources |
|---|---|---|---|
| **Phase 0** | Product foundation, architecture, mobile design system | Architecture (§23), consent/privacy framework (§24), analytics instrumentation (§26), provider-agnostic AI client, career-taxonomy decision (resolves MOM OQ-4) | Cross-cutting |
| **Phase 1** | Bosla **React web** MVP — Masar.ai + Habit Tracker only **(v1.1; web platform decided this revision, §12.1)** | Onboarding, auth, adaptive discovery conversation (§11.1), CV ingestion + assessment/mentorship-chat/PDF-export agents (§11.5), 3–5 explainable recommendations (§11.2), saveable summary; **full habit-tracking core on its native engine** (§15): recurrence, recompute-honest scoring, streaks/XP/levels, adaptive difficulty, optional Google sync, AI Goals planner | MOM, Masar.ai, Habit Tracker |
| **Phase 2** | Career discovery + personalized planning + native mobile re-platform begins | Roadmap generation (§11.4), curated role-preview videos (§14, curated-only), optional LinkedIn/portfolio ingestion (CV ingestion itself is now MVP, §11.5); **native mobile app (React Native) development starts here, porting the validated web MVP (§12.2)** | MOM |
| **Phase 3** | Questify-based gamification unification (Track B) **(v1.1, re-scoped)** | Migrate the MVP's native Habit Tracker engine onto Questify's shared engine (§16 FR-GAM-B01–B06, including the one-time XP/level migration), unlocking unified badges/challenges/leaderboards for habits; roadmap→habit conversion (§11.4) if not already shipped in MVP | Habit Tracker, Questify |
| **Phase 4** | Education-provider course integrations | Partner onboarding (§13), full Questify course/quest/mastery engine (§16.1) — reusing Questify's already-built, evaluated RAG-chatbot and AI content-generation pipeline (§9.4) — partner-content UX | Proposal, Questify |
| **Phase 5** | Voice-based learning assessment | CohereVoice ASR productionized, evaluation LLM + rubric, human-review path (§18) | Brief, CohereVoice |
| **Phase 6** | Community, mentorship, and networking | Mentor discovery/verification, groups, DMs, moderation (§17); Admin Panel analytics engine goes live (§20), since it needs Phase 3–4 data to be meaningful | Proposal, Admin Doc |
| **Phase 7** | Multimodal personalized RAG agent | Retrieval index across all prior phases' data, grounded agent (§19) | Proposal |
| **Phase 8** | Scale, optimization, and partner-ecosystem expansion | Job-readiness/ATS module (Jobify-derived, scoring/matching only per the §8 auto-apply exclusion), broader language support, admin RBAC hardening (§20.4), scale/uptime targets (§27) | Jobify, cross-cutting |

**AI-generated career video** (§14 FR-VID-003) ships as backlog/opportunistic work within Phase 2, filling gaps only where no curated video exists, now that its commercial gating (§13.10) and moderation workflow (§14) are both decided. **The Job Readiness module** (§8, §9.3) is confirmed at Phase 8, now that both its commercial gating (subscription tier, §13.10) and its auto-apply exclusion (§8) are decided — it ships as a scoring/matching-only feature.

---

## 30. MVP Definition

**Scope statement (v1.1):** the MVP is Phase 1, and per explicit instruction is scoped **by source project**: everything confirmed for Habit Tracker (§9.1) and Masar.ai (§9.2), re-platformed to mobile, plus the MOM's discovery-conversation vision that Masar.ai's agents implement. Questify, Jobify, CohereVoice Studio, and every brief-only "Define:" feature (education partners, career video, community, voice evaluation, the RAG agent, and most of the admin panel) are explicitly **not** MVP.

| MVP includes | Source | Excludes (explicitly) | Reason |
|---|---|---|---|
| Conversational onboarding + adaptive questions | MOM | Course matching / step-by-step learning coach | MOM "Later"/out-of-scope |
| Personality/interest/skill/experience profile, informed by CV ingestion | MOM + Masar.ai | Personalized learning-style detection | MOM "Later" |
| 3–5 ranked, explainable career profiles (assessment/skill-gap agent) | MOM + Masar.ai | Generated (AI-synthesized) job-preview video | MOM "Later" (§14 is Phase 2+) |
| Explanation + evidence for every recommendation | MOM | Fine-tuned proprietary model | MOM Decision #7, §7 |
| Stateful, streaming mentorship follow-up chat | Masar.ai | Mini-games/work simulations | MOM "Could have" |
| Saveable/downloadable (PDF) assessment summary | Masar.ai | Curated role-preview videos | Deferred to Phase 2 (§14) |
| Full habit-tracking core: recurrence, recompute-honest scoring, streaks/XP/8-level curve, adaptive-difficulty proposals, `timer`/`manual`/`assumed` effort tagging | Habit Tracker | Any Questify-sourced gamification (badges/challenges/leaderboards/shop/avatar, course-linked or otherwise) | New MVP-scope decision, v1.1 — see §15/§16 |
| Optional two-way Google Tasks/Calendar habit sync | Habit Tracker | Education-partner content, community/mentorship, voice evaluation, the multimodal RAG agent, the analytics-driven admin panel | Not named as MVP source projects, v1.1 |
| AI Goals planner (goal → habits/to-dos, Actor/Intervenor/Reflexion) | Habit Tracker | Job-readiness/ATS toolkit (Jobify-derived) | Decided at Phase 8, scoring/matching only (§8) |

**MVP success criteria**, combining both MVP source projects' own confirmed value propositions: (1) from the MOM — the user can explain why the recommended career options fit them, identify one option worth testing next, and name the first concrete action they'll take **[MOM]**; (2) from Habit Tracker — a habit created from that first concrete action can be scheduled, tracked, corrected (untick/retick), and scored with zero drift against the web MVP's backend, matching the source project's own confirmed test guarantees (§9.1, §27 NFR-032) **[Habit Tracker]** — full offline operation is a native-app guarantee tested from Phase 2+ (§12.2 AC-MOB-001).

---

## 31. Acceptance Criteria (cross-cutting, MVP-level)

| ID | Criterion |
|---|---|
| AC-MVP-001 | A new user completes onboarding, the adaptive discovery conversation, and reaches 3–5 explainable career recommendations in a single session, in a desktop or mobile browser, showing a clear retry/connection state on failure per FR-WEB-003 (updated for the web-MVP platform decision, §12.1). |
| AC-MVP-002 | Every recommendation shown states its supporting signals and uncertainty (AC-CD-010) — none are presented as a single deterministic answer. |
| AC-MVP-003 | The user can save/download a summary and return later to a persisted profile (AC-CD-001, FR-CD-005). |
| AC-MVP-004 | No MVP screen presents output as a validated psychometric/clinical diagnosis (BR-CD-010 spot-checked in QA copy review). |
| AC-MVP-005 | No MVP screen shows a salary/market-demand figure without visible location/date/source (BR-CD-011 spot-checked). |
| AC-MVP-006 **(v1.1)** | Given a user uploads a CV, when extraction succeeds, then its content measurably informs at least one recommendation's stated rationale (AC-CD-030). |
| AC-MVP-007 **(v1.1)** | Given a user requests a PDF summary, when export completes, then a downloadable PDF is produced (AC-CD-032). |
| AC-MVP-008 **(v1.1, updated for the web-MVP platform)** | Given a user creates a habit and completes/reverts it repeatedly against the web MVP's backend API, then the recomputed score matches exactly what the sequence of actions should produce — no drift, no duplication (AC-HAB-001, NFR-032). Full offline reconciliation (airplane mode) is a native-app capability, tested separately at AC-MOB-001 (§12.2) once Phase 2+ ships. |
| AC-MVP-009 **(v1.1)** | Given a habit reaches ≥90% weekly completion, when the week closes, then a raise-target proposal is surfaced, never auto-applied (AC-HAB-002). |

Per-feature acceptance criteria for every later phase are defined in their respective sections (§13–§20).

---

## 32. Glossary

| Term | Definition |
|---|---|
| **Bosla** | This product — the unified mobile career/growth platform defined in this PRD. |
| **MOM** | The Minutes of Meeting document (`MOM_audio_validated_en.md`) capturing the 2026-09-05 hackathon brainstorming session; the primary foundation for Bosla's career-discovery vision. |
| **Adaptive discovery conversation** | The MOM's core mechanic: a multi-turn, rephrase-capable conversation that replaces a fixed questionnaire for career profiling. |
| **Explainable recommendation** | A career profile shown with its supporting signals and stated uncertainty, never a bare label. |
| **Recompute, don't increment** | The Habit Tracker's core scoring principle: derived state (points, XP, streaks) is always recalculated from source records, never patched incrementally — the reason reverting an action always claws back exactly what it granted. |
| **Assumed time log** | A Habit Tracker–confirmed provenance tag for effort that was ticked complete without a timer run — visibly badged so honesty about measured-vs-assumed effort is preserved. |
| **Actor / Intervenor / Reflexion loop** | The Habit Tracker's AI-planning pattern: a proposing model (Actor), a reviewing layer that runs deterministic checks before any model-based critique (Intervenor), and a capped iteration loop (Reflexion) that halts with surfaced warnings rather than looping forever. |
| **Linear gating** | Questify's confirmed course-progression rule: LOCKED→UNLOCKED→IN_PROGRESS→COMPLETED, where finishing a quest unlocks the next one in its section. |
| **Stage mastery** | Questify's confirmed rule that a stage is marked mastered after 2 consecutive correct answers, and mastery never regresses once achieved. |
| **Event bus (typed)** | Questify's confirmed publish/subscribe architecture decoupling "an activity happened" from "everything that reacts to it" (XP, badges, achievements, challenges, notifications, audit). |
| **Leaderboard snapshot** | A background-computed, cached leaderboard result (Questify-confirmed) — never computed synchronously per request. |
| **Learning Progress Score** | The Admin Doc's confirmed composite metric for learner progression, deliberately distinct from raw completion percentage. |
| **At-risk learner** | A learner flagged by the Admin Doc's confirmed classification approach (logistic regression / decision tree / random forest) as likely to struggle or fall behind; always human-review-only, never an automated restriction. |
| **Track A / Track B (Questify integration)** | This PRD's naming for the brief's required split: Track A = full Questify feature set for education-partner content; Track B = gamification mechanics only, applied to the Habit Tracker. |
| **ATS score** | Jobify's confirmed CV-vs-job-posting fit score; current default is a deterministic requirement-matching engine, explicitly not comparable to its earlier 4-pillar legacy scorer. |
| **RAG (Retrieval-Augmented Generation)** | The architecture pattern behind Bosla's multimodal personalized agent (§19): retrieving grounded, consent-scoped user/context data before generating a response, rather than relying on the model's unverified memory. |

---

