# Bosla MVP — Pre-submission QA Report

**Run date:** 25 September 2026
**Repository state tested:** `master` at `2a03649` plus the local release-candidate fixes in this commit
**Production targets:** `https://bosla-web.vercel.app` and `https://bosla-api.vercel.app`
**Scope:** English-only web MVP: onboarding, Career Context, discovery, recommendations, roadmap, habits, mentor, PDF export, AI resilience, integrations, accessibility, and data isolation.

## Executive verdict

The release candidate is verified locally and addresses the defects found during production testing. **The production deployment that was tested is not submission-ready until this commit is deployed**, because it has three material server-side defects:

1. A forged `bosla_user=<user id>` cookie authenticates as that user.
2. Re-generating career matches after a roadmap or mentor history exists returns HTTP 500.
3. Account deletion for a populated account returns HTTP 500.

The source changes in this commit fix those defects and add regression coverage. A production re-test is required after deployment.

## Test log index

| Check | Command / method | Result |
|---|---|---|
| Backend suite | `python -m unittest discover -s apps/api/tests -v` | **20 passed** in 7.636s |
| Frontend types | `node node_modules/typescript/bin/tsc -b` | Pass |
| Frontend lint | `node_modules/.bin/oxlint src` | Pass |
| Production frontend build | `node node_modules/vite/bin/vite.js build` | Pass; non-blocking warning for chunks larger than 500 kB |
| Patch hygiene | `git diff --check` | Pass; only Windows LF→CRLF informational warnings |
| Mobile audit | Deployed browser at 375px wide | Landing and Habits: `scrollWidth = viewportWidth = 375` |
| Keyboard audit | Deployed landing page | Focus reached the home link with browser-provided `outline: auto 1px` |
| PDF visual audit | Authenticated production PDF fetched, text-extracted, rendered at 144 DPI | 200 response, 9,478 bytes, 3 pages, no literal `<br>`, visually readable tables and transcript |

No production credentials, tokens, or personal content are stored in this report.

## Live production results

| PRD section | Status | Evidence and limitations |
|---|---|---|
| 1. Onboarding and sessions | Partial | Email sign-up, consent, sign-in, and session return worked. Google OAuth start returned HTTP 307. Production session authorization is insecure; see BUG-001. |
| 2. Career Context | Partial | Native document types, OCR fallback, GitHub evidence import, source listing, source deletion, and vector retrieval were exercised. Mentor reproduced a fact present only in an uploaded source. A deleted source was no longer listed or referenced. Match regeneration failed with HTTP 500; see BUG-002. |
| 3. Discovery | Partial | A clean account reached a complete profile exactly at turn 8. Prior production behaviour could return a summary instead of one follow-up question. The hardened contract is in the release candidate, not the tested deployment. |
| 4. Recommendations | Partial | The clean account received 4 ranked Cairo-targeted matches. API responses included location, source, and as-of metadata. The deployed UI did not consistently place those fields beside salary figures, and source-backed re-generation failed. |
| 5. Roadmap | Pass | A match was selected, a roadmap was generated, a roadmap module was converted into an AI weekly plan, and 4 habits were saved into the tracker. |
| 6. Mentor | Pass with privacy blocker | Replies streamed as SSE chunks, retained conversation context, retrieved a source-only marker, and correctly answered that a deleted source no longer existed. BUG-001 prevents accepting this as privacy-safe in production. |
| 7. PDF export | Pass | A populated account exported a valid, readable three-page PDF with assessment, recommendations, roadmap content, and mentor transcript. No raw HTML was present. |
| 8. Habit tracker | Partial | Roadmap-created habits appeared in the daily view. Manual completion and untick reverted the visible state. The deployed UI called an `ASSUMED` manual completion “Verified by timer”; fixed locally. Carry-forward and deletion rules are release-candidate tests, not a production re-test. |
| 9. Google Calendar and Tasks | Configuration-dependent | Runtime status reported Google OAuth/sync configured but not connected for the QA account. Real Google authorization and live Calendar/Tasks round-trip were not performed. Mocked end-to-end integration tests pass locally. |
| 10. AI failover | Local pass / production not forced | Production AI completed discovery, matching, roadmap, and mentor calls. A controlled all-provider failure and primary-to-fallback routing are covered in regression tests, but not forced against live paid-provider capacity. |
| 11. Web and accessibility | Partial | Responsive width and keyboard focus passed. Deployed axe audits found 6 contrast nodes on sign-in, 1 contrast node on landing, and 1 critical unnamed habit completion button. All are fixed locally. |
| 12. Data isolation and privacy | **Fail in production** | Account B could not retrieve Account A’s document marker, so vector retrieval was user-filtered. However, direct cookie forgery authenticated as Account A; BUG-001 is critical. |

## Confirmed bugs and traces

### BUG-001 — Critical: forged session cookie impersonates an account

- **Observed:** A fresh HTTP client with only `bosla_user=<Account A user id>` received HTTP 200 from `/auth/me` and Account A’s identity.
- **Impact:** Any actor who learns or guesses an account ID can impersonate that account, bypassing document, mentor, and career-data isolation.
- **Root cause trace:** the deployed dependency resolved `bosla_user` directly with `db.get(User, bosla_user)`.
- **Fix:** `apps/api/app/models.py` adds `UserSession`; `apps/api/app/routers/auth.py` issues a random 48-byte opaque cookie and stores only its SHA-256 hash; `apps/api/app/deps.py` validates hash, expiry, and user. Sign-out revokes the current token.
- **Regression:** `test_sessions_resist_forgery_and_retrieval_is_account_scoped` proves a bare user ID is rejected, sign-out revokes the session, and cross-account retrieval remains empty.
- **Deployment note:** existing sessions will need to sign in once after deployment because user-ID cookies are intentionally invalidated.

### BUG-002 — High: re-generating matches returns HTTP 500

- **Observed:** After generating a roadmap and mentor history, uploading a document and calling `POST /career/matches/generate` returned HTTP 500.
- **Impact:** A user cannot refresh recommendations after adding evidence, violating the Career Context revisit loop and making AC-MVP-006 unreliable.
- **Root cause trace:** `mentor_messages.match_id` and `roadmaps.match_id` reference `career_matches`. The deployed clear-and-replace path deleted matches before their dependents.
- **Fix:** `apps/api/app/routers/career.py` now deletes dependent mentor and roadmap guidance before deleting/replacing matches.
- **Regression:** `test_regenerating_matches_replaces_dependent_guidance_without_fk_failure`.

### BUG-003 — High: account deletion returns HTTP 500

- **Observed:** `DELETE /auth/account` returned HTTP 500 for the disposable populated QA account.
- **Impact:** Users cannot exercise their data-deletion right and test data cannot be cleaned from production through the product.
- **Root cause trace:** dependent records, including mentor messages/roadmaps, habit occurrences, and linked records, were not removed in FK-safe order.
- **Fix:** `apps/api/app/routers/auth.py` removes sync links, chunks, documents, todos, occurrences, sessions, mentor messages, roadmaps, matches, habits, and goals before deleting the user.
- **Regression:** `test_account_deletion_removes_records_in_fk_safe_order`.
- **QA data note:** the disposable account contains only generated synthetic data and remains in production because the deployed endpoint failed. It should be deleted immediately after this fix is deployed and re-tested.

### BUG-004 — Medium: discovery turns can end without a usable question

- **Observed:** A model response could contain a profile summary instead of the required single next discovery question.
- **Impact:** Users can become stuck or receive ambiguous discovery progression.
- **Fix:** `apps/api/app/ai/career_discovery.py` normalizes provider output to one concise question and supplies varied safe fallbacks; `career.py` caps discovery at 20 user turns and persists a user/assistant turn atomically.
- **Regressions:** `test_discovery_always_emits_one_question`, `test_discovery_cannot_exceed_twenty_user_turns`, and `test_discovery_provider_failure_does_not_save_half_a_turn`.

### BUG-005 — Medium: salary provenance was not consistently presented beside salary

- **Observed:** API data carried market source, date, and location, but deployed cards did not consistently expose provenance beside displayed salary.
- **Impact:** Fails the explainability requirement for market figures (BR-CD-011 / AC-MVP-005).
- **Fix:** `apps/web/src/pages/Matches.tsx` presents location, source, and as-of fields with salary and provides a clear no-confident-match state.
- **Regression coverage:** API match serialization is exercised by recommendation and sparse-profile tests. Visual production re-test is pending deployment.

### BUG-006 — Medium: habit completion UI mislabels manual credit and lacks a control name

- **Observed:** A manually ticked occurrence showed `ASSUMED` but also “Verified by timer.” Axe reported the completion button had no accessible name.
- **Impact:** Misrepresents verification and violates WCAG 4.1.2.
- **Fix:** `apps/web/src/pages/TodayHabits.tsx` explicitly says “Manually ticked · assumed,” uses a distinct icon/style, and supplies stateful `aria-label` and `aria-pressed` attributes.
- **Regression:** `test_five_completion_reversions_have_no_xp_drift` verifies five completion/untick cycles always return XP to the baseline.

### BUG-007 — Medium: low-contrast supporting text

- **Observed:** Axe reported `#8A8F98` on white/off-white at approximately 3.1:1. Sign-in had 6 findings; landing had 1.
- **Impact:** WCAG 1.4.3 contrast failure.
- **Fix:** `apps/web/src/pages/SignIn.tsx` and `apps/web/src/pages/Landing.tsx` use darker `#5B6270` for affected helper, footer, and placeholder text.
- **Production re-test:** pending deployment.

### BUG-008 — Medium: goal/habit deletion and carry-forward behaviour was incomplete

- **Observed risk:** a goal relationship without `ON DELETE SET NULL` risks deleting or invalidating historic habits; unfinished manual tasks needed explicit carry-forward semantics.
- **Fix:** `Habit.goal_id` and `Todo.goal_id` now use `ON DELETE SET NULL`; an idempotent Postgres migration upgrades existing Neon tables. `Todo` supports manual carry-forward while occurrence-bound subtasks remain on their original day.
- **Regressions:** `test_new_habit_goal_fk_declares_set_null`, `test_existing_postgres_foreign_key_is_migrated`, `test_todos_carry_forward_but_subtasks_do_not_and_goal_delete_preserves_history`, and `test_goal_commit_creates_habit_and_todo_once`.

## Other release-candidate improvements

| Area | Change |
|---|---|
| Database safety | Added a transaction advisory lock around Postgres startup/migration to prevent concurrent Vercel cold-start migration races. |
| Recommendation honesty | Sparse profiles return no forced match rather than fabricated confidence; otherwise results are limited to 3–5 ordered matches. |
| Onboarding restart | Restarting discovery clears stale derived guidance while retaining independent evidence and habits. |
| Roadmap to habits | Goal-plan commits create milestones as to-dos idempotently; a retry cannot duplicate scheduled habits. |
| AI resilience | Configured keys are tried in sequence, primary model routing falls back to `llama-3.3-70b-versatile`, and exhausted providers return a safe user-facing message. |
| Accessibility | Mobile-width audits passed without horizontal overflow; contrast and accessible-label fixes are included for deployment. |

## Regression suite inventory

1. PDF and DOCX certificates index and list.
2. GitHub import reads document formats only.
3. FK-safe account deletion.
4. Discovery always produces one question.
5. Discovery stops at 20 user turns.
6. AI failure does not persist half a discovery turn.
7. Exhausted AI keys route through fallback and return safe copy.
8. Existing Postgres habit FK migrates to `SET NULL`.
9. Five completion/untick cycles do not drift XP.
10. Goal commit is idempotent and creates planned habits/to-dos.
11. Google OAuth callback validates state and creates a session (mock provider).
12. Google Tasks two-way and Calendar write-only sync (mock provider).
13. Mentor streams and persists conversation history.
14. New schema declares habit `ON DELETE SET NULL`.
15. Match regeneration removes dependents before matches.
16. Discovery restart retains evidence/habits but removes stale guidance.
17. Opaque sessions reject forgery and retrieval stays account-scoped.
18. Sparse profiles do not force career matches.
19. Manual to-dos carry forward; occurrence subtasks do not; goal deletion preserves history.
20. Weekly adjustment proposals and conflict detection are deterministic.

## Not tested or only partially covered

| Item | Why it remains open | Required production re-test |
|---|---|---|
| Real Google sign-in completion | Requires a real authorized Google test account and configured redirect consent screen. | Sign in, sign out, then sign in again with Google. |
| Real Google Tasks two-way sync | Requires Google Tasks authorization and a safe test task list. | Complete in Bosla → check Google Tasks; complete in Google Tasks → pull into Bosla. |
| Real Google Calendar write-only sync | Requires Calendar authorization and a safe test calendar. | Create/remind a habit → verify the Calendar event. |
| AI failover under a real provider outage | Production capacity should not be intentionally exhausted. | Temporarily use a non-production invalid key or provider maintenance window. |
| Production fixes | This report tests a local release candidate after finding issues in deployed code. | Push/deploy this commit, then repeat BUG-001 through BUG-007 verification. |
| Full keyboard traversal | A focused landing-page check passed, not every interaction in every screen. | Keyboard-test onboarding, recommendations, habit controls, mentor, and dialogs. |
| Source-backed match rationale | Mentor source retrieval passed, but production match re-generation failed. | After deployment, upload a source-only fact, regenerate, and verify it appears in visible rationale. |

## Recommended post-deployment smoke test

1. Register a disposable account, give consent, add a source-only text marker, and complete 8 discovery turns.
2. Generate 3–5 matches; verify rationale, uncertainty, and salary provenance.
3. Select a match, generate a roadmap, make a roadmap item a habit, complete and untick it.
4. Upload another source and regenerate matches; this must not return HTTP 500.
5. Send a mentor question for the marker, delete the marker document, and confirm mentor no longer retrieves it.
6. Attempt `/auth/me` with a bare user ID cookie; it must return HTTP 401.
7. Export the PDF and delete the disposable account; deletion must return HTTP 204.

## Files intentionally not staged

The pre-existing untracked research assets below are user-owned and intentionally excluded from the release commit:

- `docs/research/GenAI Hackathon FAQ.pdf`
- `docs/research/MOM_audio.mp4`
