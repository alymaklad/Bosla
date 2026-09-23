# bosla-web

The Bosla React web MVP frontend (PRD §12.1, FR-WEB-001). Vite + React 19 + TypeScript +
Tailwind v4 + React Router, talking to the FastAPI backend in `../api`.

```bash
npm install
npm run dev      # http://localhost:5173 — proxies /api/* to the backend on :8000
npm run build
```

Start the backend first (see `../api/README.md`) — the dev server proxies
`/api/*` to `http://127.0.0.1:8000` (see `vite.config.ts`), so cookies and requests
are same-origin from the browser's point of view.

## Design system — "Bosla Compass"

Defined in `src/index.css` (`@theme` tokens) and mirrored in the Stitch export in
`../design/stitch-export/`.

| Token | Value | Used for |
|---|---|---|
| Ink (primary) | `#0F1115` | buttons, headings, nav, the logo |
| Indigo (secondary / guidance) | `#1E3A8A` | links, active nav, career-recommendation accents |
| Amber (tertiary / progress) | `#F59E0B` | XP bars, streaks, level badges **only** |
| Page | `#FAFAF8` | warm off-white background |
| Line | `#E6E7EA` | 1px borders (borders over shadows) |

Type: Space Grotesk (headlines), IBM Plex Sans (body). 8px radius throughout.

## Structure

```
src/
  api.ts                  Typed fetch client for every backend endpoint, incl. an SSE reader
  context/AppContext.tsx  Current-user context (cookie session), used to gate routes
  components/
    Shell.tsx              Post-onboarding layout: Sidebar + TopBar + MobileTabs + Ask Bosla FAB
    Sidebar.tsx / TopBar.tsx / MobileTabs.tsx
    Card.tsx                Card, Chip, FitRing, ConfidenceDot primitives
    Dashboard.tsx           The dashboard screen (data-driven)
  pages/
    Landing, SignIn, Consent, CvUpload      onboarding (public)
    Discovery                                chat + live "what we've learned" panel (SSE)
    Matches, MatchDetail                     ranked career matches + mentor chat (SSE)
    Roadmap, HabitWizard                     roadmap steps → goal-planner wizard (SSE)
    TodayHabits, WeeklyReview, Progress, Settings
```

Every page fetches real data from the FastAPI backend — there is no demo/hardcoded data
left in the app. Streaming screens (Discovery, MatchDetail's mentor chat, HabitWizard) use
`api.ts`'s `streamSSE` helper to read `text/event-stream` responses.

## Routing

```
/                        Landing (public)
/signin                  Sign in (public, cookie-based demo auth)
/onboarding/consent      Consent + persona (redirect target when signed in without consent)
/onboarding/cv           Optional career evidence: PDF/DOCX/TXT uploads + public GitHub import
/onboarding/discovery    Discovery conversation
/matches, /matches/:id   Career matches, match detail + mentor chat
/roadmap                 Roadmap (auto-generates once a direction is chosen)
/habit-wizard            Turn a roadmap step into a habit (goal planner)
/dashboard, /habits, /habits/review, /progress, /settings   Shell-wrapped app pages
```

`Shell` (used for the post-onboarding routes) redirects to `/` if there is no signed-in
user — see `src/components/Shell.tsx`.
