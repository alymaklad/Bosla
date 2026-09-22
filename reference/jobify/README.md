<p align="center">
  <img src="frontend/assets/logo.png" alt="Job Application Agent logo" width="140">
</p>

# Job Application Agent

Autonomous job-search & application agent. Searches for jobs, scores them against
your profile, tailors your CV when the fit is low, auto-applies only on boards you've
explicitly whitelisted, drafts applications everywhere else for your approval,
tracks skill gaps, and sends daily/weekly reports.

Built entirely on free tools — see [Tech stack](#tech-stack) below. For a
file-by-file technical walkthrough of how `agents/` and `jobs/` actually
work, see [ARCHITECTURE.md](ARCHITECTURE.md). For how a CV is matched
against a job description end to end, see [MATCHING.md](MATCHING.md); for
the ATS scoring pipeline built on top of it, see [SCORING.md](SCORING.md).

## Design principles

1. **Whitelist-only auto-submit by default.** The agent only submits automatically
   on sources you explicitly whitelist in `.env` (`WHITELISTED_SOURCES`). Everywhere
   else it prepares a complete draft and waits for your approval. A three-way mode
   (`AUTO_APPLY_MODE`, also in the Settings page's **Auto-Apply Behavior** panel —
   Off / Auto-Apply from any website / Auto-Apply from whitelist only) controls
   this — see [Enabling auto-submit](#enabling-auto-submit).
2. **Everything is logged.** Every job seen, scored, drafted, or applied to is
   stored in SQLite — this powers the daily/weekly reports.
3. **Your profile, not your CV file, is the single record of you.** Uploading a
   CV extracts a structured profile and replaces the stored one; every stage —
   search, ranking, scoring, tailoring — reads that profile, not the file, so an
   edit on the Profile page reaches every stage the next time it runs. See
   [Your profile](#your-profile) below.
4. **A requirement-level ATS score, always explained and always auditable.**
   Each requirement in a posting is matched against evidence in your profile —
   deterministically where possible, backed by semantic retrieval and a single
   adjudication call where it isn't — and the final number is computed in
   Python from a credit table, never returned by a model. Every application
   shows a plain-English "why this score" breakdown tracing each point back to
   a line of your CV. See [ATS scoring](#ats-score--why-explanations) below.
5. **Two-stage job matching: retrieve wide, then rank.** Retrieval is
   recall-biased — your Position is expanded into equivalent job titles, and
   jobs whose *title* doesn't match are still recovered if their description
   is semantically close to your profile. Ranking then scores the narrowed pool on
   eight weighted factors. See [Job matching](#job-matching) below.
6. **Idempotent runs.** The agent never applies to the same job twice — dedupe
   on job URL before acting.
7. **Dry-run by default.** `DRY_RUN=true` in `.env` logs every send/submit
   action instead of executing it, until you've verified the system works.

## Tech stack (all free)

| Component | Tool |
|---|---|
| Orchestration | LangGraph |
| LLM | Ollama (local, free), Gemini free tier, Groq free tier (fast hosted inference), or OpenRouter (~400 models behind one key) |
| Embeddings | Ollama `nomic-embed-text` (local, free, default) or `qwen3-embedding:4b` (local, free, multilingual) or Gemini `gemini-embedding-001` (free tier) |
| Job search | Greenhouse + Lever public APIs (free), SerpAPI free tier (100/mo, optional) |
| Watchlist | Google Sheets via `gspread` (free service account) |
| CV parsing | `pdfplumber` / `python-docx` (reads your uploaded .pdf/.docx into your profile) |
| Tailored CV output | `reportlab` (renders each rewrite as a real formatted .pdf) |
| Email | Gmail API (OAuth, your own account, free) |
| Reports | Telegram Bot API (free, unlimited) |
| Scheduling | APScheduler |
| Storage | SQLite via SQLAlchemy |

## Setup

Pick one environment manager -- both install the exact same packages from
`requirements.txt`, so it's a matter of preference.

**venv:**

```bash
python -m venv .venv && source .venv/bin/activate   # or .venv\Scripts\activate on Windows
pip install -r requirements.txt
```

**conda:**

```bash
conda env create -f environment.yml
conda activate job-agent
```

(`conda env update -f environment.yml --prune` to sync after `requirements.txt` changes.)

Either way:

```bash
playwright install chromium   # only needed if you enable JS-rendered scraping
cp .env.example .env          # fill in the values you plan to use
```

Minimum to run in dry-run mode with zero external accounts: nothing else —
Greenhouse/Lever need no key, and `DRY_RUN=true` is the default.

To use free LLM scoring, pick one:
- Install [Ollama](https://ollama.com), run `ollama pull qwen3:4b`, leave `LLM_PROVIDER=ollama`
  — fully local and unmetered, and at ~2.5GB it fits in VRAM alongside the `nomic-embed-text`
  embedding model (see [Job matching](#job-matching)) on a typical 6–8GB laptop GPU. A larger
  model writes better tailored CVs; the Settings page's Ollama panel shows whether the daemon
  is running and which models are pulled. `qwen3:4b` is a thinking model, so the app forces
  non-thinking mode and strips any reasoning that leaks through before it can become a "CV"
  or a confident 0% score — if you swap in a different local model, a non-thinking instruct
  model (e.g. `llama3.1:8b`, `qwen2.5:7b-instruct`) needs none of that and is the more
  reliable choice at this size, or
- Get a free [Gemini API key](https://aistudio.google.com/apikey) and set `LLM_PROVIDER=gemini` + `GEMINI_API_KEY`, or
- Get a free [Groq API key](https://console.groq.com/keys) and set `LLM_PROVIDER=groq` + `GROQ_API_KEY`
  (`GROQ_MODEL` defaults to `openai/gpt-oss-120b`; pick a different one from the dropdown on the
  Settings page — Groq periodically retires models, check
  [console.groq.com/docs/models](https://console.groq.com/docs/models) if a model stops working)
  — hosted, no local install, and generally the fastest of these since Groq runs on its own
  inference hardware, or
- Get an [OpenRouter API key](https://openrouter.ai/keys) and set `LLM_PROVIDER=openrouter` +
  `OPENROUTER_API_KEY` — one key in front of ~400 models with automatic failover between
  providers. `OPENROUTER_MODEL` defaults to `openai/gpt-oss-120b:free`.

  **Read this before relying on OpenRouter's free tier:** ids ending in `:free` cost nothing
  but are capped by **request count, not tokens** — 20/minute and 50/**day** on an unfunded
  account (1,000/day once you've bought $10 of credits). This agent spends roughly 2–3 LLM
  calls per job that clears the match gate, so 50/day is only about 15–20 jobs. Paid model ids
  have no request cap. Free ids also change over time; if one starts returning 404, pick
  another from [openrouter.ai/models?q=free](https://openrouter.ai/models?q=free).

All four are switchable from the dashboard's **Settings** page too, not just `.env`.

The two hosted free tiers run out in opposite ways, which matters when picking one: Groq caps
**tokens per day** (200k), OpenRouter's free ids cap **requests per day** (50 unfunded). Ranking
is LLM-free precisely so ordinary search volume doesn't hit either — see
[Job matching](#job-matching).

Add your CV before running the daily job — either upload it through the
dashboard's **CV** page (`frontend/cv.html`), or place a file by hand at
`cv/current_cv.pdf` or `cv/current_cv.docx`. Either way, uploading extracts
your **profile** — see [Your profile](#your-profile) — which is what every
other stage actually reads.

## Your profile

Your CV file has exactly one job: filling your profile. `/api/cv/upload`
extracts a structured profile from whatever you upload and **replaces** the
stored one every time — the app deliberately favors always re-extracting
over silently protecting a hand edit you made on the **Profile** page
(`frontend/profile.html`). If you edit your profile directly after an
upload, a later re-upload of the same CV file will overwrite that edit; use
**Profile → Re-extract preview** to pull fresh fields from the CV without
losing edits you want to keep, or just edit the profile again afterward.

From there, the profile — not the CV file's raw text — is what every stage
reads: query expansion and embeddings use it to search, ranking scores
skills/experience/education against it, the ATS engine matches every
requirement against it, and tailoring rewrites from it. The CV file's text
is still read directly for exactly two things: the ATS parse-compatibility
check (that's a property of the *document*, not the profile) and as a
fallback before anything has ever been extracted.

## Running it

**Windows, one click:** double-click `run.bat` (venv) or `run_conda.bat`
(conda — creates/updates the `job-agent` environment automatically, no
manual `conda env create` needed). First run copies `.env.example` to `.env`
and opens it in Notepad so you can fill in real values — save, close, and
double-click the script again. After that it starts the API, the scheduler,
and opens the dashboard in your browser every time.

`run_conda.bat` needs `conda activate` to work in a plain Command Prompt,
which requires `conda init cmd.exe` to have been run once (the Anaconda/Miniconda
installer usually offers this). If the API/Scheduler windows show a "conda is
not recognized" or "CondaError: Run 'conda init'" error, either run that once
from an Anaconda Prompt and restart your terminal, or just launch the script
from an Anaconda Prompt directly.

`run_conda.bat` runs `conda env update -f environment.yml --prune` on
*every* launch to keep the environment in sync -- that's conda re-resolving
and diffing the whole environment, which is slow (often 10-60+ seconds) even
when nothing changed. Once you've run it successfully at least once, use
`run_conda_quick.bat` instead for everyday launches: same script minus that
sync step, so it just activates the existing `job-agent` env and starts
immediately. Go back to `run_conda.bat` only after actually editing
`environment.yml` (added/removed/upgraded a package), so the new env
actually gets synced.

To get a proper Desktop icon instead of digging into the project folder each
time, double-click `create_desktop_shortcut.vbs` once — it creates a
"Job Application Agent" shortcut on your Desktop that runs `run.bat`. One-time
setup; the shortcut itself is reusable forever. (Edit the `.vbs` file's
`targetBat` line to point at `run_conda.bat` instead if that's the one you use.)

**Manually / other OS:**

```bash
# one-off: search everything configured, score, draft/apply
python jobs/daily_run.py

# one-off: apply from a single URL you found manually (cv_path optional if
# you've already uploaded a CV via the dashboard's CV page)
python jobs/apply_from_link.py "https://boards.greenhouse.io/acme/jobs/123" [cv_path]

# start the always-on scheduler (daily search 08:00, daily report 20:00, weekly news Mon 09:00)
python scheduler.py

# dashboard API + frontend, in separate terminals
uvicorn api:app --host 127.0.0.1 --port 8000
python -m http.server 5500 --directory frontend
```

This is a local-only setup: the API, scheduler, and dashboard all run on your
own machine, so everything stops when your machine sleeps or shuts down —
there's no cloud host or scheduler keeping it running while you're away. See
[Deployment](#deployment) if you want it running unattended on always-on
infrastructure instead.

## Enabling auto-submit

Auto-apply behavior is controlled by `AUTO_APPLY_MODE` in `.env` (also the
Settings page's **Auto-Apply Behavior** panel), one of three values:

| Mode | What happens |
|---|---|
| `off` | Every job drafts for review. Nothing ever auto-submits. |
| `any` | Auto-submits regardless of source, ignoring the whitelist entirely. **Caveat:** real submission is still limited to what `auto_submit_greenhouse` implements (Greenhouse only, and still a stub below) — until that's built out further, this mode mostly changes what gets logged while `DRY_RUN=true`. |
| `whitelist` (default) | Only sources you've explicitly added to `WHITELISTED_SOURCES` auto-submit. Everywhere else drafts for review. The original, recommended default. |

Before whitelisting a board for `whitelist` mode:

1. Inspect that specific board's application form fields (browser dev tools or
   its public API) — every Greenhouse/Lever board can have different custom
   fields (screening questions, EEO fields, etc).
2. Implement the exact submit payload in `agents/apply_agent.py::auto_submit_greenhouse`
   (currently a deliberate stub — `NotImplementedError`).
3. Test end-to-end on one real or throwaway application with `DRY_RUN=true` first,
   then `DRY_RUN=false`.
4. Add `"greenhouse:<board_token>"` or `"lever:<company_slug>"` to `WHITELISTED_SOURCES`.

This is the one part of the system meant to be verified per employer, not automated blindly.

Two more settings, both in the same **Auto-Apply Behavior** panel, sit on top
of `AUTO_APPLY_MODE` without weakening it:

- **`FIT_THRESHOLD`** (default `0.7`, i.e. 70%) — the ATS score below which a
  job's CV gets rewritten instead of proceeding straight to the auto-apply
  decision. Editable as a percentage in the Settings page; read fresh on
  every job scored, so a change applies immediately, no restart needed.
- **`AUTO_APPLY_ON_TAILORED_SCORE`** (default `false`) — normally, a job whose
  *original* CV scores below `FIT_THRESHOLD` gets a rewritten CV and stops
  there for you to review, even if the tailored CV would have scored well.
  Turning this on lets a tailored CV that clears the threshold continue to
  the same auto-apply decision (`AUTO_APPLY_MODE`) a naturally good-fit job
  gets. Off by default because a higher ATS score doesn't guarantee the
  rewrite didn't overstate anything; turn it on deliberately once you trust
  the rewrite step.

## Job matching

Finding jobs happens in two stages, deliberately tuned in opposite directions:
**retrieval** casts wide (don't miss anything plausible), **ranking** narrows
precisely (order what's left).

**Stage 1 — Query expansion.** One LLM call turns your typed Position into the
set of job titles that describe the same role:

```
"AI Engineer"  →  AI Engineer, Machine Learning Engineer, Generative AI
                  Engineer, AI Software Engineer, Applied Scientist, ...
```

This matters because job boards phrase the same role a dozen ways. It's
profile-aware (the list is calibrated to your actual background), cached per
Position so the daily scheduler doesn't re-ask for an unchanged one, and your
typed Position is always kept — expansion only ever *widens* a search.

**Stage 2 — Retrieval, two parallel paths.** Sources that need a literal query
(SerpAPI, Wuzzuf, SimplyHired, generic career-page scraping) get searched once
per expanded phrase. Sources that return a whole board regardless of query
(Greenhouse, Lever, RemoteOK, We Work Remotely) get filtered two ways at once:

- **Token path** — job title matches any expanded phrase. Cheap, instant.
- **Semantic path** — the job *description* is close to your profile in
  embedding space, even though the title matched nothing. This is what catches
  a "Backend Developer" posting for a "Software Engineer" search when the
  content genuinely fits.

Both paths' results are unioned and deduplicated. Only the token path's
*misses* go through the semantic path — re-embedding a job the title filter
already accepted would pay for a decision that's already made.

**Stage 3 — Ranking.** Every candidate gets one 0–1 match score from eight
weighted factors, shown as a **Match** column on the Dashboard:

| Factor | Weight | Factor | Weight |
|---|---|---|---|
| Skills match | 32% | Location | 8% |
| Semantic CV/JD similarity | 20% | Education | 4% |
| Experience match | 16% | Salary | 4% |
| Job title match | 12% | Seniority | 4% |

This is a different question from the ATS score below: *"is this job right for
me"* versus *"would my CV survive this employer's ATS parser"*. A job can score
well on one and poorly on the other. Factors whose data isn't in the posting
(location and salary often aren't) score **neutral, not zero** — a job
shouldn't be punished for how its source happens to be structured.

**Setup.** Semantic matching needs an embedding model. The default is local,
free, and fast:

```bash
ollama pull nomic-embed-text
```

274 MB, 768 dimensions, 8K context, CPU-fast — which is what makes embedding
every span affordable, including the finer-grained per-requirement retrieval
described in [ATS scoring](#ats-score--why-explanations) below. It's
English-centric, though, so weak on the Arabic/mixed-language postings
Wuzzuf/Bayt/GulfTalent return. For those, switch **Settings → Job Matching →
Embedding provider** to `qwen3-embedding:4b` (`OLLAMA_EMBEDDING_MODEL`) —
2.5 GB, 40K context, 100+ languages, one `.env` line away and safe to switch
at any time since every embedding cache key includes the model name.

Or switch **Settings → Job Matching → Embedding provider** to Gemini to use
your existing API key instead (model: `gemini-embedding-001` — the older
`text-embedding-004` and `embedding-001` were shut down by Google in January
2026 and August 2025 respectively, and now return `404 NOT_FOUND`). If
neither is available the agent still runs — it just loses the semantic path's
extra recall.

**Free-tier budgets.** Ranking is deliberately LLM-free — it scores every
retrieved candidate, so one model call per job would burn a whole day of
Groq's token allowance on jobs you'll never apply to. Embeddings are capped
per run (`EMBEDDING_MAX_PER_RUN`, default 95) to stay inside Gemini's 100/min
free tier, which counts each job description individually. Jobs beyond the
budget still get ranked — they just score neutral on the semantic factor, and
the report says which. Switching to Ollama removes the limit entirely.

**Debugging a search.** Every run writes a multi-sheet Excel report to
`data/search_reports/` tracing what happened at each stage:

| Sheet | What it answers |
|---|---|
| Summary | The whole funnel — raw → filtered → deduped → ranked → processed — plus the settings in force |
| Query Expansion | What did my Position actually expand to? Was it cached? |
| Sources | Which source returned what, per phrase — and how many were dropped by the filter vs. the per-site cap |
| Retrieval | Every job seen, which path handled it, kept or dropped, and **why** |
| Ranking | Every candidate × every factor: score, weight, contribution, evidence |
| Match Gate | What the minimum-match-score setting held back |
| Source Errors | Which sources failed and with what error |
| Stage Timings | Where the time went |

Turn it off with `SEARCH_DEBUG_REPORTS=false`; keep more or fewer with
`SEARCH_REPORT_KEEP` (default 30, oldest pruned). Reports are gitignored —
they contain real job titles and URLs.

**Tuning.** Everything above is adjustable in **Settings → Job Matching**:
turn expansion off, change how many phrases are generated, cap how many reach
SerpAPI (its free tier is only 100 searches/month), set the semantic-match
threshold, and optionally set a **minimum match score** so low-scoring jobs
skip the expensive per-job LLM pipeline entirely. That gate ships **off** —
raise it only once you've seen real scores against real jobs.

## ATS score & why explanations

Every job is scored by a **requirement-level engine**, not one opaque number:
`agents/ats_agent.py` extracts each requirement from the posting (one LLM
call) and matches it against your profile, one requirement at a time, then
computes the final score deterministically in Python from a credit table —
the model never returns a number that reaches the score. ATS
parse-compatibility (headers, length, bullet consistency, section presence)
is scored separately as its own Pass/Warning/Fail check on the document
itself, since it's a property of the CV file, not of any one job.

Matching a single requirement runs through three layers, in order, and only
as far as it needs to (see [MATCHING.md](MATCHING.md) for the full
walkthrough):

1. **Deterministic rules decide first.** Exact term, alias, subset, or the
   curated *prerequisite* relation (`skill_matching.IMPLIED_BY` — a CV that
   evidences FastAPI, PyTorch, and LLM work is credited with Python even if
   "Python" itself is only listed, never mentioned in a bullet; naming a
   skill outright still counts for more than inferring it). A false-friend
   guard (`skill_matching.FALSE_FRIENDS`) stops same-spelling-different-thing
   terms — a LangGraph **ReAct** agent bullet does not also credit a **React**
   frontend requirement.
2. **Local semantic retrieval nominates, never scores.** For a requirement
   the rules can't resolve, an embedding search over your CV's own spans
   shortlists the handful of lines that might be relevant. It cannot itself
   credit a match or read from the scoring table — it only decides what the
   next step gets to look at.
3. **A single batched LLM call adjudicates the shortlist.** One call per job
   judges only the still-uncertain requirements against their nominated
   evidence — never the whole CV, never the ones already decided
   deterministically.

This three-level design (added 2026-08-31) is what lets the engine work
across job families without a hand-maintained vocabulary per profession,
while keeping the audit trail: every credited point still traces back to a
specific line of your CV.

Every application on the Dashboard has a **Why?** link that expands the
full requirement-by-requirement breakdown — which skills matched, at what
relation (exact/alias/implied/semantic), which sections were missing, and
why — built entirely from the scoring pass itself, with no extra LLM call
needed to explain it.

For jobs where the fit score was low enough to trigger a CV rewrite, the
tailored CV is scored again against the same job description (reusing the
already-extracted requirements, so this costs one extra LLM call, not two)
and shown alongside the original: its own ATS score, and a
requirement-by-requirement explanation of what changed. This shows up both
on the Dashboard (under a rewritten job's application row) and on the CV
page's Tailored CVs table. A **`ATS_SCORE_MODE`** setting (Settings page,
default `both`) controls whether both the original and tailored scores are
reported, or only the tailored one with the rewrite gated unconditionally
(`tailored_only`) — either way, every candidate is examined the same way,
the setting only changes what's reported and gated on.

See [SCORING.md](SCORING.md) for the full pipeline with a worked example on
a real posting, and [MATCHING.md](MATCHING.md) for how the three-level
matcher itself is built, calibrated, and tested. See also
[ARCHITECTURE.md](ARCHITECTURE.md#agentsats_agentpy--scoring-fit) for the
file-by-file technical breakdown.

**History.** A four-pillar scorer (keyword match / formatting / section
completeness / experience alignment, weighted 45/22/18/15) was the original
engine and was fully removed from the code on 2026-08-26 — not just made
unreachable. Applications scored before that date still carry a
`scoring_engine` field and render correctly on the Dashboard, but **scores
from the two engines are not comparable**: one real posting measured 0.319
under the current engine against 0.542 under the legacy one, which included
a constant that carried no ranking signal. `FIT_THRESHOLD` (0.7) was
deliberately left uncalibrated through that cutover — recalibrate it from
real runs, not from a guess.

## Frontend + dashboard API

`api.py` is a FastAPI layer over the same SQLite DB the agents write to, plus
endpoints that write local config, upload files, and trigger sends for a
single user. `frontend/` is a static, dependency-free HTML/CSS/JS dashboard
(off-white, minimalist) — no build step required. Eight pages, linked from the
nav bar on every page:

- **Dashboard** (`index.html`) — stats, applications table, skill gaps, and
  latest news digest. Every row has a **Why?** link that expands a
  plain-English breakdown of its ATS score — see [ATS score & why
  explanations](#ats-score--why-explanations) below — and, for jobs whose
  CV was tailored, a second block showing the tailored CV's own score and
  how it improved on the original.
- **Search** (`search.html`) — configures what the search-and-apply pipeline
  looks for, in three parts:
  - **Position** — a job title/keyword, saved to `.env`
    (`SEARCH_POSITION_QUERY`). Used as part of the SerpAPI/Google Jobs query,
    and as a word-based title filter applied to every other source
    (Greenhouse, Lever, RemoteOK, We Work Remotely, watchlist, added sites):
    a title matches if it contains every significant word from Position, in
    any order -- so "AI Engineer" matches "AI Software Engineer", "AI/ML
    Software Engineer", "Gen AI Engineer", and "Gen AI/Agentic AI Engineer"
    alike, not just titles containing that exact phrase
    (`agents/search_agent.py::_matches_position`). Leave blank to pull
    everything configured with no filter.
  - **Seniority** — a dropdown (Intern, Entry Level, Mid Level, Senior, Lead,
    Manager), saved to `.env` (`SEARCH_SENIORITY_LEVEL`). Also folded into
    the SerpAPI query, and matched against every other source's job titles
    via keyword heuristics (`agents/search_agent.py::SENIORITY_KEYWORDS` --
    e.g. "senior"/"sr." for Senior, "intern" for Intern; Mid Level matches
    titles with none of those keywords, since unlabeled titles are usually
    mid-level in practice). It's a heuristic, not an exact classification.
  - **Max time since posted** — a dropdown (Any time / 24 hours / 3 days /
    week / 2 weeks / month), saved to `.env` (`SEARCH_MAX_AGE_DAYS`). Only
    applied where a real posted date exists: Greenhouse's `first_published`,
    Lever's `createdAt`, or SerpAPI's relative `detected_extensions.posted_at`
    text ("3 days ago", etc). Added sites searched by the generic scraper
    have no structured date, so they're never excluded by this filter.
  - **Max results per site** — a dropdown (No limit / 10 / 25 / 50 / 100),
    saved to `.env` (`SEARCH_MAX_RESULTS_PER_SITE`). Caps the raw results
    kept from each individual Greenhouse board, Lever company, watchlist
    row, or added site *before* any filtering -- useful for a large board
    (some return 500+ jobs) or to keep the generic scraper's per-page
    fetching polite. Defaults to no limit, matching the original behavior.
  - **Default job boards** — Wuzzuf, Bayt.com, SimplyHired, Wellfound, and
    GulfTalent are pre-added to the Job boards list below the first time the
    app ever runs (`agents/search_agent.py::KNOWN_JOB_BOARD_TEMPLATES` +
    `seed_default_search_sites`). Each was confirmed server-rendered and
    scrapable with a plain unauthenticated request before being added;
    LinkedIn, Indeed, and NaukriGulf were tested the same way and all block
    unauthenticated requests or require JavaScript (LinkedIn's anti-bot HTTP
    999, Indeed's 403, NaukriGulf's JS-only shell), so they're deliberately
    excluded -- adding any of them manually to the list won't work either.
    Unlike a normal added site, each template's search URL is rebuilt from
    Position each run instead of being fixed (Wuzzuf/SimplyHired/Wellfound
    skip the run entirely if Position is blank, since there's no query to
    search with; GulfTalent's own query parameter doesn't actually filter
    results server-side, so it always points at its Software category page
    instead and relies on the position-filter applied to every source's
    combined results) -- but otherwise they're ordinary rows: remove any of
    them from the Search tab if you don't want them searched, same as any
    site you add yourself.
  - **Always-on structured sources** — RemoteOK (`agents/search_agent.py::
    search_remoteok`) and We Work Remotely (`search_weworkremotely`) are
    queried every run via their own free public JSON/RSS feeds, the same way
    Greenhouse/Lever are, rather than through the generic HTML scraper.
    They don't appear as rows on the Search tab (no per-user config needed)
    and can't be removed from there -- if you don't want them searched,
    that's currently a code change, not a dashboard toggle.
  - **Job boards** — add any *additional* website URL (a specific company's
    board, or another site not pre-added above). Greenhouse/Lever URLs
    are detected automatically and searched via their public APIs, same as
    the `.env`-configured boards; any other URL falls back to a best-effort
    scraper (`agents/search_agent.py::search_generic_site`) that looks for
    same-site links that look job-related — noisier than the API-backed
    path, and worth checking a site's Terms of Service before adding it.
    Stored in the `search_sites` table, editable (add/remove) from this page.
  - **Search now** — runs the same pipeline the scheduler fires at 8am, on
    demand, using whatever position/sites are currently saved. Blocks while
    running -- can take a few minutes since it's one LLM call per new job
    found.
- **CV** (`cv.html`) — shows the currently active CV (filename, parsed
  preview) and lets you upload a replacement (.pdf/.docx, drag-and-drop or
  file picker), which extracts and replaces your profile — see [Your
  profile](#your-profile) — plus a table of every tailored CV the rewrite
  step has generated for low-fit jobs, with download links, the original
  *and* tailored ATS score side by side, and a **Why?** link showing exactly
  how the tailored version improved — see [ATS score & why
  explanations](#ats-score--why-explanations). The active CV is saved to
  `cv/current_cv.<ext>`, which `jobs/daily_run.py` and `jobs/apply_from_link.py`
  auto-detect via `cv_parser.find_default_cv()` instead of a hardcoded path.
- **Profile** (`profile.html`) — the single record every stage actually
  reads: contact info, summary, experience, projects, education, skills,
  certifications, all editable by hand. Also where you re-extract from the
  current CV file without a fresh upload (**Re-extract preview** shows what
  would change before you apply it) — see [Your profile](#your-profile).
- **Email** (`email.html`) — connect your Gmail account (OAuth; needs a
  client file at `credentials/gmail_credentials.json` from Google Cloud
  Console first), send an email for any `pending_review` application (picks
  the application, prefills a subject/body you can edit, attaches its CV),
  and a table of every email ever sent — to, subject, job, status, date.
  Every attempt is logged to the `email_logs` table regardless of outcome
  (sent, dry-run, or failed), so the list is a real record, not just a cache
  of the last session.
- **Reports** (`reports.html`) — full history of daily application summaries
  and weekly news digests sent over Telegram, each with its status
  (sent/dry-run/failed) and the exact text that went out.
- **Features** (`features.html`) — what each part of the system does, with a
  couple of lines (current whitelist, dry-run state) pulled live from `/api/status`
  rather than being static marketing copy, and links into the relevant page
  for each capability's actual results.
- **Settings** (`settings.html`) — choose the LLM provider (Ollama, Gemini,
  Groq or OpenRouter) and enter/replace that provider's API key and model.
  Saved to `.env` on the machine running
  `api.py` (`env_store.py` upserts the specific keys, preserving everything
  else in the file). Takes effect immediately for `api.py` itself; the
  scheduler is a separate process and needs a restart to pick up the change —
  the page says so rather than pretending it's instant everywhere. A second
  panel, **Auto-Apply Behavior**, has the auto-apply mode (off / any website /
  whitelist only), the ATS fit threshold (as a percentage), and a toggle to
  let a rewritten CV that clears that threshold auto-apply too — see
  [Enabling auto-submit](#enabling-auto-submit). A third panel, **Job
  Matching**, controls query expansion, the embedding provider, and the
  semantic/match-score thresholds — see [Job matching](#job-matching); it's
  also where `ATS_SCORE_MODE` lives — see [ATS score & why
  explanations](#ats-score--why-explanations).

Search results, ATS scores, and the whitelist/draft split don't get their own
pages — they're already the Dashboard's Applications table (score column +
status column), so a separate tab would just duplicate the same rows with a
narrower view. Skill gap tracking is likewise already on the Dashboard.

```bash
# backend (serves /api/*)
uvicorn api:app --reload --port 8000

# frontend — just open index.html, or serve the folder
python -m http.server 5500 --directory frontend
```

Before deploying, edit `frontend/config.js` and change `API_BASE` to wherever
`api.py` ends up running (see [Deployment](#deployment)).

## Deployment

**Frontend** — it's static files, so any free static host works: Cloudflare
Pages, Netlify, Vercel, or GitHub Pages. Cloudflare Pages is a solid default:
unlimited bandwidth, no build step needed (publish `frontend/` as-is).

**Backend (`api.py` + `scheduler.py`)** — this needs a real, persistent Python
process (SQLite file, LangGraph, APScheduler), which **Cloudflare Workers/Pages
Functions can't run** — their Python runtime is WASM-based (Pyodide) and
doesn't support SQLite's C extension or long-running schedulers. Free options
that do work:
- **Cloudflare Pages (frontend) + Cloudflare Tunnel (backend).** Run `api.py`
  and `scheduler.py` on your own machine or a free VM, and use `cloudflared`
  to give it a free public HTTPS URL — no separate hosting bill, and no code
  changes needed.
- **Render / Fly.io / PythonAnywhere free tier** for `api.py` directly (Render's
  free web service sleeps when idle; Fly.io's free allowance stays warm).
- **Google Cloud Compute Engine (Always Free e2-micro)** — same idea as the
  Cloudflare Tunnel option above, on Google's forever-free VM instead of your
  own machine. Step-by-step guide + deploy scripts: [`deploy/gcp/README.md`](deploy/gcp/README.md).

## Testing

```bash
pytest

# matching engine precision/recall + score regression, separate from pytest
python -m bench.report
```

The pytest suite (`tests/`) covers the whole app: ATS score stays in 0-1
range, whitelist enforcement never lets a non-whitelisted (or spoofed) source
auto-submit, dedup prevents double-applying to the same job URL, the
profile-first pipeline (every stage reads the profile, an upload always
replaces it), the local-model guards (reasoning never becomes a CV or a false
0%), and the matching engine's deterministic/semantic/adjudication layers
each on their own.

`bench/` is separate from pytest: `bench/matching_cases.json` holds hand-
labelled cases across 9 job families, and `python -m bench.report` reports
precision/recall for the deterministic layer plus the SCORING.md worked
example's score. `python -m bench.report --calibrate` derives the semantic
similarity thresholds (`SEMANTIC_SIMILARITY_IGNORE` / `_STRONG`) from those
labelled cases against whichever embedding provider is actually configured —
run it after switching embedding models, since the thresholds are specific
to one model's score distribution and do not transfer.

## Project layout

```
config.py            # all settings, read from .env
models.py / db.py     # SQLite schema + session handling
cv_parser.py          # PDF/docx -> text
profile_store.py       # the stored profile: load/save, structured degree entries, profile_text()
agents/                # one module per capability -- search, ranking, ATS matching/scoring,
                        #   CV rewrite/render/targeting, apply, email, reporter, news, skill_gap,
                        #   plus the matching-engine internals: matching_types, requirement_normalizer,
                        #   evidence_retrieval, semantic_matching, recommendation, embeddings, llm
services/               # embedding_cache.py (persistent vector cache) + semantic_index.py (per-CV
                        #   cosine retrieval) -- the semantic layer agents/ calls into
orchestrator.py         # LangGraph state machine wiring the agents together
jobs/                   # entry points: daily_run, daily_report, weekly_news, apply_from_link
bench/                  # matching-engine bench: labelled cases, precision/recall + score regression report
ARCHITECTURE.md         # technical deep-dive: how every agents/ + jobs/ file works, end to end
MATCHING.md             # how a CV is matched against a job description, end to end
SCORING.md              # the ATS scoring pipeline built on top of the matcher, with a worked example
scheduler.py            # APScheduler cron triggers -> automatic daily/weekly execution
api.py                  # FastAPI layer: dashboard data + settings + CV/profile + email/reports
env_store.py             # upserts specific keys in .env, preserving the rest
cv/                      # current_cv.pdf/.docx lives here (gitignored -- personal data)
cv_output/               # tailored CVs generated by the rewrite step, served for download
data/                    # SQLite DB, embedding/profile caches, search debug reports (all gitignored)
requirements.txt        # pip package list -- single source of truth for versions
environment.yml         # conda env definition, installs from requirements.txt
run.bat                 # Windows one-click launcher (venv): API + scheduler + dashboard
run_conda.bat           # same, but creates/updates (syncs) then activates the conda env
run_conda_quick.bat     # same as run_conda.bat but skips the env sync -- faster everyday launch
create_desktop_shortcut.vbs  # one-time: creates a Desktop shortcut to run.bat
frontend/               # off-white dashboard: index/search/cv/profile/email/reports/features/settings.html
                        #   + config.js, no build step
tests/                  # pytest suite
deploy/gcp/             # Compute Engine (Always Free e2-micro) deploy scripts + guide
```

## Key cautions

- Never fabricate CV content — the rewriter reframes real experience, never invents skills.
- Respect job board Terms of Service — stick to public APIs or explicit permission.
- Rate-limit searches/applications — too many automated requests can get an IP or account flagged.
- Review before scaling auto-submit — start draft-for-review everywhere, whitelist one board at a time.
- If you upload a CV after hand-editing your profile, the upload wins — see [Your
  profile](#your-profile) before re-uploading.
- A thinking local model (like `qwen3:4b`) can leak its reasoning into a
  rewrite or an extraction; the app guards against that, but a non-thinking
  instruct model of similar size avoids the failure mode entirely.
</content>
