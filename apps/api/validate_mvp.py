import asyncio
import io
import sys
import httpx

BASE_URL = "http://127.0.0.1:8000"

async def run_validation():
    print("=" * 60)
    print("BOSLA MVP AGGRESSIVE VALIDATION SUITE")
    print("=" * 60)
    
    passed = 0
    failed = 0
    
    def log_test(name: str, ok: bool, detail: str = ""):
        nonlocal passed, failed
        if ok:
            passed += 1
            print(f"  [PASS] {name} {f'({detail})' if detail else ''}")
        else:
            failed += 1
            print(f"  [FAIL] {name} -> {detail}")

    async with httpx.AsyncClient(base_url=BASE_URL, timeout=30.0) as client:
        # 1. Health Probe
        try:
            r = await client.get("/health")
            log_test("System Health Probe", r.status_code == 200 and r.json().get("ok") is True, f"status: {r.status_code}")
        except Exception as e:
            log_test("System Health Probe", False, str(e))
            return

        # 2. Auth Flow & Edge Cases
        test_email = f"validator_{int(asyncio.get_event_loop().time())}@bosla.test"
        test_password = "SecurePassword123!"

        # 2.1 Password length validation (< 8 chars)
        r = await client.post("/auth/register", json={"email": test_email, "password": "short", "name": "Short Pass"})
        log_test("Reject Short Password (<8 chars)", r.status_code == 422, f"status: {r.status_code}")

        # 2.2 Valid Registration
        r = await client.post("/auth/register", json={"email": test_email, "password": test_password, "name": "MVP Tester"})
        cookies = r.cookies
        user_data = r.json() if r.status_code == 201 else {}
        log_test("User Registration", r.status_code == 201 and "id" in user_data, f"user_id: {user_data.get('id')}")

        # 2.3 Duplicate Registration
        r = await client.post("/auth/register", json={"email": test_email, "password": test_password, "name": "Duplicate"})
        log_test("Reject Duplicate Email Registration", r.status_code == 409, f"status: {r.status_code}")

        # 2.4 Invalid Password Sign In
        r = await client.post("/auth/signin", json={"email": test_email, "password": "WrongPassword"})
        log_test("Reject Invalid Password Sign-in", r.status_code == 401, f"status: {r.status_code}")

        # 2.5 Valid Sign In
        r = await client.post("/auth/signin", json={"email": test_email, "password": test_password})
        cookies = r.cookies
        log_test("Valid Email/Password Sign-in", r.status_code == 200 and "bosla_user" in cookies, "cookie set")

        # 2.6 Get Profile (/auth/me)
        r = await client.get("/auth/me", cookies=cookies)
        log_test("Get Authenticated User Profile", r.status_code == 200 and r.json().get("email") == test_email)

        # 2.7 Consent Update (/auth/consent)
        r = await client.post("/auth/consent", json={"consent_given": True, "persona": "switcher"}, cookies=cookies)
        log_test("Save User Consent & Persona", r.status_code == 200 and r.json().get("consent_given") is True)

        # 3. CV Upload
        # Minimal mock PDF bytes
        mock_pdf = b"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000010 00000 n\n0000000060 00000 n\n0000000117 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n190\n%%EOF"
        files = {"file": ("test_cv.pdf", io.BytesIO(mock_pdf), "application/pdf")}
        r = await client.post("/career/cv", files=files, cookies=cookies)
        log_test("Upload CV Endpoint", r.status_code == 200, f"ok={r.json().get('ok')}, error={r.json().get('error')}")

        # 4. Career Discovery
        r = await client.post("/career/discovery/start", json={"persona": "switcher"}, cookies=cookies)
        log_test("Start Career Discovery Conversation", r.status_code == 200 and "content" in r.json())

        r = await client.get("/career/discovery/messages", cookies=cookies)
        msgs = r.json() if r.status_code == 200 else []
        log_test("List Discovery Messages", r.status_code == 200 and len(msgs) >= 1, f"{len(msgs)} messages")

        r = await client.get("/career/discovery/profile", cookies=cookies)
        prof = r.json() if r.status_code == 200 else {}
        log_test("Get Discovery Profile Dimensions", r.status_code == 200 and "interests" in prof and "ready" in prof)

        # 5. Career Assessment & Matches
        r = await client.get("/career/assessment", cookies=cookies)
        log_test("Get Career Assessment State", r.status_code == 200)

        # Generating matches without assessment should return 400 per PRD
        r = await client.post("/career/matches/generate", cookies=cookies)
        log_test("Guard Match Generation Before Assessment", r.status_code == 400, f"status: {r.status_code}")

        # List matches
        r = await client.get("/career/matches", cookies=cookies)
        log_test("List Matches (Empty initially)", r.status_code == 200 and isinstance(r.json(), list))

        # Choose invalid direction -> 404
        r = await client.post("/career/matches/choose", json={"match_id": "nonexistent_id"}, cookies=cookies)
        log_test("Reject Invalid Career Direction Choice", r.status_code == 404, f"status: {r.status_code}")

        # 6. Roadmap
        r = await client.get("/career/roadmap", cookies=cookies)
        log_test("Get Career Roadmap", r.status_code == 200 and "steps" in r.json())

        # Generate roadmap without chosen direction -> 400
        r = await client.post("/career/roadmap/generate", cookies=cookies)
        log_test("Guard Roadmap Generation Without Direction", r.status_code == 400, f"status: {r.status_code}")

        # 7. Goals & Habits Engine (Deterministic PRD Invariants)
        # 7.1 Create a Habit
        today_iso_day = (asyncio.get_event_loop().time()) # placeholder
        habit_payload = {
            "name": "Python Coding Practice",
            "recurrence": {"kind": "weekly", "days": [1, 2, 3, 4, 5, 6, 7]}, # Every day
            "scheduled_time": "10:00",
            "baseline_minutes": 30
        }
        r = await client.post("/habits", json=habit_payload, cookies=cookies)
        habit = r.json() if r.status_code == 200 else {}
        log_test("Create Daily Habit", r.status_code == 200 and "id" in habit, f"habit_id: {habit.get('id')}")

        # 7.2 List Habits
        r = await client.get("/habits", cookies=cookies)
        habits_list = r.json() if r.status_code == 200 else []
        log_test("List Active Habits", r.status_code == 200 and len(habits_list) >= 1)

        # 7.3 Materialize Today's Occurrences
        r = await client.get("/habits/today", cookies=cookies)
        today_occs = r.json() if r.status_code == 200 else []
        log_test("Auto-Materialize Today's Occurrence", r.status_code == 200 and len(today_occs) >= 1, f"occs: {len(today_occs)}")

        if today_occs:
            occ_id = today_occs[0]["id"]

            # 7.4 Honest Effort Rule: Complete with 0 minutes -> should badge origin='assumed' and credit target_minutes
            r = await client.post(f"/habits/occurrences/{occ_id}/log", json={"completed": True, "minutes": 0}, cookies=cookies)
            occ = r.json() if r.status_code == 200 else {}
            log_test("Honest Effort Rule (0 min complete -> assumed)", 
                     r.status_code == 200 and occ.get("completed") is True and occ.get("origin") == "assumed", 
                     f"origin: {occ.get('origin')}, logged: {occ.get('logged_minutes')}")

            # 7.5 Measured Effort Rule: Log actual timer minutes
            r = await client.post(f"/habits/occurrences/{occ_id}/log", json={"completed": True, "minutes": 45, "origin": "timer"}, cookies=cookies)
            occ = r.json() if r.status_code == 200 else {}
            log_test("Measured Effort (Timer Origin)", 
                     r.status_code == 200 and occ.get("origin") == "timer" and occ.get("logged_minutes") == 45,
                     f"origin: {occ.get('origin')}, logged: {occ.get('logged_minutes')}")

            # 7.6 Recompute Invariant: Untick habit (completed = False) -> should claw back completion
            r = await client.post(f"/habits/occurrences/{occ_id}/log", json={"completed": False, "minutes": 0}, cookies=cookies)
            occ = r.json() if r.status_code == 200 else {}
            log_test("Recompute Reversion Invariant (Claw back completion)", 
                     r.status_code == 200 and occ.get("completed") is False,
                     f"completed: {occ.get('completed')}")

            # 7.7 Skip without reason -> Reject 400
            r = await client.post(f"/habits/occurrences/{occ_id}/skip", json={"reason": "   "}, cookies=cookies)
            log_test("Reject Empty Skip Reason", r.status_code == 400, f"status: {r.status_code}")

            # 7.8 Justified Skip with reason
            r = await client.post(f"/habits/occurrences/{occ_id}/skip", json={"reason": "Travel day"}, cookies=cookies)
            occ = r.json() if r.status_code == 200 else {}
            log_test("Justified Skip Recorded", r.status_code == 200 and occ.get("justified_skip") is True and occ.get("skip_reason") == "Travel day")

        # 7.9 Week Occurrences
        r = await client.get("/habits/week", cookies=cookies)
        log_test("Get Week's Habit Occurrences", r.status_code == 200 and isinstance(r.json(), list))

        # 7.10 Weekly Review
        r = await client.get("/habits/review", cookies=cookies)
        rev = r.json() if r.status_code == 200 else {}
        log_test("Weekly Review Metrics & Proposals", r.status_code == 200 and "completion_pct" in rev and "total_points" in rev)

        # 7.11 Progress, Leveling & Streaks
        r = await client.get("/habits/progress", cookies=cookies)
        prog = r.json() if r.status_code == 200 else {}
        log_test("Progress, XP, Level & Streak Engine", r.status_code == 200 and "level" in prog and "streak" in prog and "total_xp" in prog,
                 f"Level: {prog.get('level', {}).get('level')}, XP: {prog.get('total_xp')}")

        # 8. Dashboard Aggregation Endpoint
        r = await client.get("/dashboard", cookies=cookies)
        dash = r.json() if r.status_code == 200 else {}
        log_test("Dashboard Aggregated Endpoint", r.status_code == 200 and "level" in dash and "today" in dash and "streak" in dash)

        # 9. Settings & AI Status
        r = await client.get("/settings/ai-status", cookies=cookies)
        ai_stat = r.json() if r.status_code == 200 else {}
        log_test("Settings AI Status Probe", r.status_code == 200 and "provider" in ai_stat and "configured" in ai_stat,
                 f"provider: {ai_stat.get('provider')}, configured: {ai_stat.get('configured')}")

        # 10. Cascading Account Deletion
        r = await client.delete("/auth/account", cookies=cookies)
        log_test("Full Cascading Account Deletion", r.status_code == 204)

        # 11. Verify User Is Truly Wiped (Cannot Access Profile)
        r = await client.get("/auth/me", cookies=cookies)
        log_test("Wiped Account Authentication Revoked", r.status_code == 401)

    print("=" * 60)
    print(f"SUMMARY: {passed} PASSED, {failed} FAILED (Total: {passed + failed})")
    print("=" * 60)
    if failed > 0:
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(run_validation())
