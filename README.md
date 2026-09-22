# Bosla MVP

Bosla is a full-stack career-discovery and habit-building MVP. The production code is deliberately isolated from the legacy prototype material:

```text
apps/web/       React + Vite client
apps/api/       FastAPI API, SQLite/Postgres persistence, AI integrations
design/          Stitch source, exports, user flow, and visual reference
docs/            PRD, research, architecture, and capability documentation
packages/ai-engines/
                 Reference TypeScript AI, planner, and habit-engine implementations
reference/       Capability-source prototypes; not part of the deployed runtime
```

## Run locally

1. Copy `apps/api/.env.example` to `apps/api/.env` and add one AI provider key:

   ```env
   AI_PROVIDER=groq
   GROQ_API_KEY=your_key_here
   # or use ANTHROPIC_API_KEY with AI_PROVIDER=anthropic
   ```

2. Install and run the API:

   ```powershell
   cd apps/api
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   uvicorn app.main:app --reload --port 8000
   ```

3. In a second terminal, run the web client:

   ```powershell
   cd apps/web
   npm ci
   npm run dev
   ```

Open `http://localhost:5173`.

## Deploy on Vercel

Deploy this monorepo as two Vercel projects. Set each project's Root Directory during import:

| Project | Root Directory | Framework | Required production variables |
| --- | --- | --- |
| `bosla-api` | `apps/api` | FastAPI | `AI_PROVIDER`, matching AI key, `DATABASE_URL` (external Postgres), `CORS_ORIGINS=https://YOUR_WEB_DOMAIN` |
| `bosla-web` | `apps/web` | Vite | `VITE_API_URL=https://YOUR_API_DOMAIN` |

Deploy the API first, then copy its production URL into `VITE_API_URL` on the web project. Never use SQLite on Vercel: serverless filesystem storage is not durable. Add every value in Vercel Project Settings → Environment Variables for Production and Preview, then redeploy both projects.

## Authentication and integrations

- Email/password registration uses PBKDF2 password hashes and secure HTTP-only sessions.
- Google sign-in is optional. Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_REDIRECT_URI` in `apps/api/.env`; configure the redirect URI in Google Cloud as well.
- Use `SESSION_COOKIE_SECURE=true` behind HTTPS in production.
- AI keys are server-only. Do not add any `.env` file or API key to Git.

## MVP quality checks

```powershell
cd apps/web; npm run build
cd ..\api; python -m compileall -q app
```

The AI flow requires a valid provider key and network access. The Settings screen makes provider status visible before a user starts a discovery session.
