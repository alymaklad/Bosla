# Stitch prompt — Bosla Web MVP

Paste everything below the line into Stitch (project "Bosla — Career & Growth Platform (Web MVP)",
design system "Bosla Compass" already exists there). Stitch generates one screen per request, so
paste the DESIGN SYSTEM block once as context, then paste each SCREEN block as its own request in
order. If you want Stitch to attempt several at once, paste the whole thing and say "create these
screens in order".

---

## DESIGN SYSTEM (paste first)

You are designing "Bosla" (Arabic for compass), an AI career-discovery and habit-building web app.
Desktop-first responsive web, light mode.

Brand: the logo is a monochrome black compass-rose mark (four pointed arrows radiating from a
center point) with the wordmark "BOSLA" in bold, angular, geometric uppercase letters. Use the
horizontal lockup (mark + wordmark) in the sidebar header at 36px height; use the mark alone for
the favicon, the mobile top bar and the mobile "Discover" tab icon. Never recolor the logo.

Colors — ink-first so the black logo sits natively:
- Ink (primary): #0F1115 — primary buttons, headings, nav text, the logo. Hover #1C1F26.
- Indigo (secondary, guidance): #1E3A8A — links, active nav (left bar + tint #E8EDF9),
  career-recommendation accents, fit-score rings, informational chips.
- Amber (tertiary, progress ONLY): #F59E0B — XP bars, streak flame, level badges, difficulty
  proposals, ASSUMED badge outline. Tint #FEF3C7. Never use amber for alerts or info.
- Success #16A34A, Danger #DC2626.
- Page background #FAFAF8 (warm off-white). Cards #FFFFFF with 1px #E6E7EA border, 8px radius,
  24px padding. Borders instead of shadows; one soft shadow only on floating elements.
- Text: primary #0F1115, secondary #5B6270, muted #8A8F98.

Type: Space Grotesk 600–700 for headings (tight -0.02em tracking); IBM Plex Sans 400/500 for body.
h1 32/40, h2 24/32, h3 18/26, body 15/24, small 13/20, labels 12px uppercase +0.06em.
Shape: 8px radius on cards/buttons/inputs, 4px on chips; only avatars and the compass mark are
fully round. 8pt spacing grid.

Layout: 240px white left sidebar with 1px right border (nav: Discover, Habits, Learn, Progress,
Mentor, Profile; bottom card "Level 3 · Disciplined" with amber XP bar 62% and "620 / 1,000 XP"),
a 56px top bar (search "Search careers, habits, courses", bell with amber dot, round ink avatar
"A"), content max-width 1280px with 24px gutters. On mobile: hide the sidebar, show the compass
mark in the top bar, add a bottom tab bar Discover · Habits · Learn · Progress · Profile.
A floating round black pill button "Ask Bosla" with a spark icon sits bottom-right on every
post-onboarding screen.

Components: primary button = ink fill, white text, 40px, 8px radius; secondary = white with 1px ink
border; ghost = indigo text. Chips 4px radius, 11px uppercase. Fit-score ring = 44px circular
progress in indigo with the percentage inside. Habit row = checkbox, name, recurrence chip
(e.g. MON–FRI), minutes; an amber-outlined "ASSUMED" chip when effort wasn't timer-measured.
Tone of all copy: calm, precise, no exclamation marks; progress stated as fact ("7-day streak").

---

## SCREEN 1 — Landing

Public landing page, no sidebar. Centered hero on the off-white background: the stacked Bosla
logo (compass mark above the BOSLA wordmark) at 160px, headline "Find your direction." in Space
Grotesk 40px, sub-line "An AI career companion that replaces exhausting questionnaires with a
conversation — then turns it into a roadmap and daily habits." Primary button "Get started",
ghost link "Sign in". Below, three small feature cards in a row with an icon each: "Talk, don't
test" (adaptive conversation), "See why it fits" (explainable recommendations with uncertainty),
"Turn steps into habits" (roadmap → habits with streaks and XP). Footer: "Bosla means compass."
in muted text.

## SCREEN 2 — Sign up / Sign in

Centered 420px card on the off-white page. Horizontal logo lockup at top of card. Title "Create
your account", inputs Email and Password (8px radius, 1px border, focus border ink), primary
button "Continue", divider "or", secondary button "Continue with Google" with the Google G icon.
Under the card: "Already have an account? Sign in" with "Sign in" as an indigo link. Keep it
minimal — no other fields.

## SCREEN 3 — Consent & where you are

Onboarding step 1 of 4 (thin stepper across the top: Consent · CV · Conversation · Matches).
Left column: title "Before we start", short paragraph on how Bosla uses your answers and CV to
recommend careers, three checkboxes: "Use my answers to recommend careers" (checked, required),
"Store my conversation so I can come back later" (checked), "Allow notifications for habit
reminders" (unchecked). Right column: title "Where are you right now?" and four selectable
persona cards in a 2×2 grid with an icon, title and one line: "Secondary-school student —
choosing a study path", "University student — choosing a track", "Recent graduate — don't know
where to begin", "Career switcher — reusing my skills in a new field". Selected card has an
indigo border and tint. Primary button "Continue", bottom-right.

## SCREEN 4 — CV upload (optional)

Onboarding step 2 of 4. Title "Add your CV (optional)", sub-line "It helps us ground the
recommendation in what you've actually done." A large dashed drop zone (8px radius) with an
upload icon, "Drop a PDF here or browse", and "PDF up to 10 MB". Below it, a state showing a
file was added: file chip "aly-cv.pdf · 2 pages" with a remove ×, and a read-only preview box
"Extracted text" showing 5 lines of résumé text with a muted note "Truncated to 3,000 characters."
Also show a small inline warning variant in a second small card: amber-outlined "We couldn't read
text from this PDF — it may be a scanned image. Try another file or skip." Buttons: secondary
"Skip for now", primary "Continue".

## SCREEN 5 — Discovery conversation

Onboarding step 3 of 4. Two-column layout. Left (2/3): a chat panel titled "Let's find your
direction" with a streaming assistant message style (white bubble with a 3px indigo left border)
and user bubbles in an ink tint (#F0F1F3). Show 5 turns: assistant asks about what the user
enjoys, user answers, assistant asks a follow-up about strengths, user answers, assistant asks
"When you picture a good work day, what are you doing most of the time?". Each assistant message
has a small ghost link "Rephrase this question". Bottom: input "Type your answer…" with a send
button (ink). Right (1/3): a card "What we've learned" listing six rows — Interests, Dislikes,
Strengths, Skills, Experience, Motivations — each with a short extracted phrase and a confidence
dot (green = clear, amber = getting there, gray = not yet). Under it a muted line "We'll ask 8–20
questions and stop when the picture is clear." and a primary button "Get my matches" shown in a
disabled state until all rows have a signal (render it enabled with a subtle amber dot on the
last row to show the state right before unlocking).

## SCREEN 6 — Career matches

Onboarding step 4 of 4, then this becomes the Discover page. Title "Your top matches", sub-line
"Ranked by fit. Every match shows why — and where we're less sure." Four ranked recommendation
cards in a vertical list, each: rank number, fit-score ring (78%, 71%, 64%, 58%), role title
(Data Analyst, Product Analyst, BI Developer, Research Assistant), one-line "Why this fits you"
in secondary text, a muted "Less certain about:" line (e.g. "your appetite for reporting-heavy
work"), a small role-preview thumbnail placeholder with a play icon labeled "A day as a Data
Analyst · 4 min", and two buttons: primary "Choose this direction", ghost "Ask a follow-up".
Right rail: card "Market context" for the top match with three rows — Median salary (with a
source and date line in muted text: "Source: ILOSTAT · updated Sep 2026"), Remote potential,
Local demand — and a card "Save your results" with a secondary button "Download PDF report".

## SCREEN 7 — Match detail + mentor chat

Page for one recommendation. Header: back link "← All matches", role title "Data Analyst" with
the 78% fit ring and an indigo chip "Top match". Left column: card "Why this fits you" with 3–4
bullet points each tied to a signal chip (e.g. chip "Skills: SQL", chip "Interest: patterns");
card "Where we're less sure" with 2 bullets in secondary text; card "Market context" as on the
previous screen; card "Typical day" with the role-preview video placeholder. Right column: a
sticky mentor chat panel titled "Ask Bosla about this path" showing a streaming assistant reply
("Given your SQL habit and your interest in patterns, the fastest bridge is a portfolio project
that answers one real question with public data…") and an input. Page-level primary button
"Choose this direction" pinned bottom-right of the left column.

## SCREEN 8 — Roadmap

Title "Your roadmap to Data Analyst", sub-line "A first path — not a syllabus. Change anything."
Four section cards stacked: "Study path" (2 rows, e.g. "Statistics fundamentals", "Databases
& SQL"), "Skills to build" (chips: SQL, Python, data visualization, communication), "Portfolio
steps" (3 numbered rows), "First concrete action" (one highlighted row with an indigo left bar:
"Practice SQL 30 minutes, 3× a week"). Every row has a right-aligned ghost button "Make it a
habit". A horizontal 4-step timeline at the top: Foundations of SQL (done, ink check), Python
for data (in progress, indigo ring), Portfolio project, Mock interviews. Top-right primary
button "Turn a step into a habit".

## SCREEN 9 — Turn a step into a habit (AI plan review)

A two-step wizard in a centered 880px card. Step 1 (left, collapsed summary): Goal "Practice
SQL", target date "12 Dec 2026", weekly budget "1h 30m". Step 2 (main): title "Here's a plan —
review before adding". Section "Sessions" with 3 rows: name, days chips (MON · WED · FRI), time
"18:00", duration "30 min". Section "Milestones" with 3 dated rows. Section "Resources" with 3
rows each with a link icon and a small green check "Link verified" or a muted "No link — search
for: …". A findings card with an amber left bar titled "Review found 1 thing to fix": "SQL
practice (18:00–18:30) overlaps Gym on Monday — move or shorten it." with a ghost button "Fix
it for me". A small progress strip at the top showing phases: Researching ✓ · Drafting ✓ ·
Reviewing (active, iteration 2 of 3). Buttons: secondary "Edit plan", primary "Add to my week".

## SCREEN 10 — Dashboard

Home after onboarding. Heading "Good morning, Aly", sub-line "Your compass is pointing at Data
Analyst — 3 habits due today." Three stat cards: "Current streak · 7 days" with amber flame,
"Habits this week · 12 of 15" with a thin amber bar at 80%, "Career direction · Data Analyst"
with indigo chip "78% fit". Two-column row: "Today's habits" (three rows: Python practice
· MON–FRI · 30m, checked; Read data-science article · DAILY · 15m; SQL exercises with an
amber-outlined ASSUMED chip · MON/WED/FRI · 20m; footer link "View all habits →") and "Your top
career matches" (three rows with fit rings 78/71/64, title, one-line why, indigo left accent;
muted note "Every recommendation shows its reasoning and uncertainty. Tap one to see why.").
Full-width "Next steps on your roadmap" card with the 4-step timeline and a secondary button
"Turn a step into a habit".

## SCREEN 11 — Today's habits

Habits page. Header with date "Saturday 20 September" and a segmented control Today · Week ·
All. List of 5 habit cards: each with checkbox, name, recurrence chip, target minutes, a
progress ring of logged vs target, and three quiet actions on hover: "Start timer", "Log
minutes", "Skip (with reason)". One card is expanded to show the timer running: large "12:40"
in Space Grotesk, Pause / Done buttons, and the note "Measured by timer". Another card shows the
ASSUMED state with the amber-outlined chip and a tooltip "Ticked without a timer — credited at
target." A justified-skip card shows a gray "Skipped: travel day" label. Right rail: a "This
week" mini card (points 24, best day Wednesday, streak 7) and a "Weekly review is ready" card
with a secondary button "Open review".

## SCREEN 12 — Weekly review

Title "Week of Sep 13–19", sub-line "Recomputed from your logs — un-ticking anything updates
this." Top row: four stat tiles — Completion 80%, Points 24 (+5 bonus for beating your target),
Longest streak 7, Worst weekday Thursday (completed this week ✓). A bar chart placeholder
"Minutes per day" in amber. Then a card per habit with a proposal: "Python practice ran at 93%
this week. Raise the target from 30m to 35m?" with two buttons "Raise it" (primary) and "Keep
as is" (secondary); a second habit shows "Held at 75% — inside the 70–89% band, target stays at
20m." with no buttons; a third shows "Dropped to 50%. Ease back to 15m until consistency
recovers?" with "Ease back" / "Keep as is". Muted footer: "Bosla proposes; you decide. Nothing
changes unless you accept."

## SCREEN 13 — Progress

Title "Progress". Hero card: big level title "Level 3 · Disciplined", amber XP bar 62% with "620
/ 1,000 XP", next title "Focused at 1,000 XP". Row of three cards: "Current streak 7 days"
(amber flame), "Longest streak 12 days", "Hours logged 41h 20m". "Achievements" grid of 8
badges (First 7-Day Streak — unlocked, 10 Hours Studied — unlocked, 50 Tasks Completed — 34 of
50, 100 Hours Studied — 41h of 100h, Perfect Week — 1 so far, 30-Day Streak — 12 of 30, Beat
Your Previous Record — unlocked, Comeback — not yet); locked badges are muted with a thin
progress bar. "Personal records" list: Longest streak, Most hours in a week, Most points in a
week, Highest completion rate, Most productive day, Most improved habit — each with value and
date.

## SCREEN 14 — Profile & settings

Two-column settings page with a left sub-nav (Account, Preferences, Notifications, Data &
privacy, AI). Show the "Data & privacy" section: cards for "Language" (segmented English /
العربية with a note "Arabic switches the app to right-to-left"), "Your data" with two secondary
buttons "Export my data" and "Delete my account" (danger text) and the line "Requests are
completed within 30 days.", "Voice recordings" (toggle, off) with "Deleted 30 days after
evaluation", and "Consent" listing the three onboarding consents as toggles. Top of page shows
the avatar, name "Aly Maklad", email, and a ghost "Edit".
