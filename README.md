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
| `bosla-api` | `apps/api` | FastAPI | `AI_PROVIDER`, matching AI key, `DATABASE_URL` (external Postgres), `CORS_ORIGINS=https://YOUR_WEB_DOMAIN`, `WEB_APP_URL=https://YOUR_WEB_DOMAIN`, `SESSION_COOKIE_SECURE=true`, `SESSION_COOKIE_SAMESITE=none` |
| `bosla-web` | `apps/web` | Vite | `VITE_API_URL=https://YOUR_API_DOMAIN` |

Deploy the API first, then copy its production URL into `VITE_API_URL` on the web project. Never use SQLite on Vercel: serverless filesystem storage is not durable. Add every value in Vercel Project Settings → Environment Variables for Production and Preview, then redeploy both projects.

## Authentication and integrations

- Email/password registration uses PBKDF2 password hashes and secure HTTP-only sessions.
- Google sign-in is optional. Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_REDIRECT_URI` in `apps/api/.env`; configure the redirect URI in Google Cloud as well.
- Google Calendar/Tasks uses a separate OAuth web client. Enable the Google Calendar API and Google Tasks API, then configure:

  ```env
  GOOGLE_SYNC_CLIENT_ID=your_sync_client_id
  GOOGLE_SYNC_CLIENT_SECRET=your_sync_client_secret
  GOOGLE_SYNC_REDIRECT_URI=http://localhost:8000/integrations/google/callback
  GOOGLE_TOKEN_ENCRYPTION_KEY=your_fernet_key
  GOOGLE_SYNC_TIMEZONE=Africa/Cairo
  ```

  Generate the encryption key once with `python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"` and keep it stable and secret. Register the exact local callback above and `https://YOUR_API_DOMAIN/integrations/google/callback` for production. The integration requests only `calendar.events` and `tasks`; Calendar is a write-only reminder mirror, while Tasks completion is synchronized both ways from Settings → Calendar & Tasks.
- Use `SESSION_COOKIE_SECURE=true` behind HTTPS in production.
- AI keys are server-only. Do not add any `.env` file or API key to Git.

## Personal career evidence and retrieval

Bosla accepts optional **PDF, DOCX, and TXT** documents: CVs/resumes,
recommendations, certificates, project documentation, thoughts, and journals.
It extracts text, chunks it, and stores user-isolated vectors in Neon Postgres with
the `pgvector` extension. Relevant excerpts are retrieved for discovery, assessment,
career matching, and mentor guidance; the adaptive conversation remains mandatory
before career matches can be generated.

Users can also import a public GitHub profile. The importer stores public profile details
and reads documentation/supported text from up to 12 recent, public, non-fork projects
(80 files total); it never clones or executes code. Private repositories need a separate
user-authorized GitHub integration; `GITHUB_TOKEN` is optional for public API rate limits
and must remain server-side.

Native PDF extraction is used first. To enable OCR for scanned PDFs, deploy the companion
service in `F:\Cultiv\Sahll\cloud_vision_trial` to an authenticated HTTPS endpoint, then set
`OCR_FALLBACK_URL` and `OCR_FALLBACK_TOKEN` in the API project's Vercel environment. OCR is
disabled by default; enabling it can incur Google Cloud Vision charges.

## MVP quality checks

```powershell
cd apps/web; npm run build
cd ..\api; python -m compileall -q app
# With the API running on port 8000:
python validate_mvp.py
```

The AI flow requires a valid provider key and network access. The Settings screen makes provider status visible before a user starts a discovery session.
