# Bosla — User Flow (Web MVP)

Scope: the Phase-1 MVP (PRD §30) — Masar.ai career discovery + Habit Tracker, as a React web app.
Design goal: the user should reach a *saved career direction with one real habit scheduled* in a single
first session, then have a reason to come back tomorrow.

## Principles that shape the flow

1. **The conversation is the onboarding.** No separate quiz, no long form. The adaptive discovery chat
   collects everything (PRD FR-CD-001/002); a live "What we've learned" side panel makes progress visible.
2. **Reasoning is always one tap away.** Every recommendation shows its fit score, *why*, and an
   uncertainty note (FR-CD-011). Never a bare label.
3. **One primary action per screen.** Each step ends with exactly one obvious next move.
4. **Proposals, not decisions.** The AI proposes (career direction, roadmap, habit plan, difficulty
   change); the user confirms. Nothing auto-applies (BR-HAB-002, Intervenor review).
5. **Honest effort.** Un-timed completions are visibly `ASSUMED` (FR-HAB-002).
6. **Skippable, resumable.** CV upload, follow-up chat and roadmap→habit are all optional; leaving
   mid-conversation and returning days later resumes the same profile (FR-CD-005).

## The flow

```
0  Landing ──► 1 Sign up / in ──► 2 Consent & persona ──► 3 CV upload (optional)
                                                              │
                                                              ▼
                       4 Discovery conversation  (8–20 exchanges, live profile panel)
                                                              │
                                                              ▼
                       5 Career matches  (3–5 ranked, fit ring, why, uncertainty, preview)
                          │                        │
                          ▼                        ▼
                  6 Match detail + mentor chat   Save / export PDF
                          │
                          ▼
                       7 Choose direction ──► 8 Roadmap (study path · skills · portfolio steps)
                                                              │
                                                              ▼
                       9 Turn a step into a habit  (goal → AI plan → review conflicts → confirm)
                                                              │
                                                              ▼
                      10 Dashboard (home)  ◄──────────── daily loop ────────────┐
                          │                                                       │
                          ├─► 11 Today's habits: tick · timer · log · skip (justified) · ASSUMED badge
                          ├─► 12 Weekly review: completion, points, difficulty proposal (accept/reject)
                          ├─► 13 Progress: level & XP, streaks, achievements, personal records
                          └─► 14 Profile & settings: account, language (EN/AR, RTL), data & privacy
```

## Screen-by-screen

| # | Screen | Purpose | Primary action | Notes |
|---|---|---|---|---|
| 0 | Landing | Explain Bosla in one line; stacked logo hero | Get started | "Bosla means compass." Secondary: Sign in |
| 1 | Sign up / in | Email+password or Google | Continue | Minimal; no extra fields yet |
| 2 | Consent & persona | Data-use consent; pick where you are (student / graduate / early-career / switcher) | Continue | Consent up front (FR-MOB-004 / NFR-001). Persona seeds the conversation |
| 3 | CV upload | Optional PDF; shows extracted text preview | Continue / Skip | Scanned PDF with no text → clear prompt, not silent (FR-CD-030 edge case) |
| 4 | Discovery conversation | Chat UI; right panel "What we've learned" fills in: interests, strengths, skills, experience, motivations, each with a confidence dot | Send | Ends adaptively (BR-CD-001); a "Get my matches" button unlocks once every dimension has a signal; "rephrase" affordance on any question |
| 5 | Career matches | 3–5 ranked cards: fit ring, one-line why, uncertainty note, role-preview thumbnail | Choose a direction | Also: Ask a follow-up, Save PDF |
| 6 | Match detail + mentor chat | Full rationale, market context (source + date shown, BR-CD-011), streaming mentor chat grounded in the assessment | Choose this direction | Chat is stateful (FR-CD-032) |
| 7 | Choose direction | Confirmation moment; sets the "compass" | Build my roadmap | Cheap to change later |
| 8 | Roadmap | Study path, foundational subjects, skills, portfolio steps as a stepper | Turn a step into a habit | Each step has "Make it a habit" |
| 9 | Turn a step into a habit | Goal title/target date/weekly budget → AI plan (sessions, milestones, resources) → Intervenor findings (schedule conflicts, dead links) → confirm | Add to my week | Progress phases shown: researching → drafting → reviewing (GoalPlanProgress) |
| 10 | Dashboard | Streak, week completion, direction, today's habits, top matches, next roadmap steps | (contextual) | Already built in `bosla-web` |
| 11 | Today's habits | Tick / start timer / log minutes / justified skip | — | ASSUMED badge on untimed ticks; skip asks for a reason |
| 12 | Weekly review | Completion %, points, worst weekday, streaks; adaptive-difficulty proposal | Accept / Keep as is | Proposal explains itself (rationale string from `proposeAdjustment`) |
| 13 | Progress | Level + XP bar, streak history, achievements grid, personal records | — | Native Habit Tracker level curve for MVP (PRD §15) |
| 14 | Profile & settings | Account, language & RTL, notifications, data export/delete, AI provider status | Save | 30-day export/delete SLA (PRD §24) |

Global: persistent **Ask Bosla** mentor button on every post-onboarding screen; mobile bottom tabs
Discover · Habits · Learn · Progress · Profile (Learn is a placeholder in MVP).
