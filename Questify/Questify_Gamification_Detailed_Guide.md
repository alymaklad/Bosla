# Questify Gamification System — Detailed Study Guide

## Source

This document is based on the final **Questify Documentation (June 2026)** provided for the project. It focuses on the complete gamification design, its educational purpose, the implemented mechanics, data model, algorithms, event-driven architecture, background jobs, and learner-facing behavior.

> **Important:** Where the project documentation does not specify an exact threshold, formula, field, or implementation detail, this guide does not invent one. Such points are explicitly marked as configurable, conceptual, or not specified in the documentation.

---

# 1. What Is Gamification in Questify?

Gamification is the use of game mechanics in a non-game context—in this case, education—to encourage engagement, progression, repetition, and achievement.

Questify was designed around the idea that gamification should not be a cosmetic layer added on top of an ordinary learning-management system. The documentation explicitly frames the project around integrating gamification with the educational core.

The platform combines:

- XP
- Levels
- Coins
- Streaks
- Streak freezes
- Badges
- Achievements
- Daily challenges
- Weekly challenges
- Leaderboards
- A virtual shop
- Avatar customization
- Quest progression
- Boss battles
- Stage mastery

The important concept is that these mechanics are connected to actual learning behavior.

A simplified model is:

```text
Learning Activity
       |
       v
Quest / Stage Completion
       |
       v
Events
       |
       +----> XP / Coins
       |
       +----> Level Progression
       |
       +----> Badges
       |
       +----> Achievements
       |
       +----> Challenges
       |
       +----> Notifications
       |
       v
XP History
       |
       v
Leaderboards
```

Questify therefore treats learning activity as the source of the player's progression.

---

# 2. Why Gamification Was Needed

The motivation behind Questify is learner engagement.

The documentation describes a problem with self-paced mobile learning: learners can lose engagement after their first sessions. The project therefore asks whether engagement, AI assistance, and instructor-led content authoring can be unified into one coherent learning system.

The gamification objective is not simply:

> "Make studying look like a game."

It is:

> "Give learners a progression system and feedback loop that encourages them to continue learning."

The project documentation also discusses research on gamification in education. It notes that gamification can have positive effects, but that the effect depends on implementation and that gamification is more meaningful when integrated with pedagogy rather than attached as cosmetic rewards.

---

# 3. The Psychological Design Behind Questify

The documentation connects Questify's design to Self-Determination Theory and identifies three relevant psychological needs:

## 3.1 Competence

The learner should feel:

> "I am improving and progressing."

Questify supports this through:

- XP
- levels
- boss-battle quests
- stage mastery
- achievement progression
- badges

The learner receives continuous evidence of progress.

---

## 3.2 Autonomy

The learner should feel:

> "I have some control over my experience."

Questify supports this through:

- quest selection
- avatar customization

Avatar customization is particularly relevant because learners can use earned/purchased items to personalize their profile.

---

## 3.3 Relatedness

The learner should feel:

> "I am part of a learning environment with other learners."

Questify supports this through:

- leaderboards
- shared/time-bound challenges

The documentation specifically maps XP and boss-battle quests to competence, quest selection and avatar customization to autonomy, and leaderboards/shared challenges to relatedness.

---

# 4. Questify's Gamification Is Layered

The system is called a layered gamification engine because several different mechanics solve different engagement problems.

A useful way to remember the layers is:

```text
                  QUESTIFY GAMIFICATION
                           |
       +-------------------+-------------------+
       |                   |                   |
   PROGRESSION          HABIT              RECOGNITION
       |                   |                   |
   XP / Levels         Streaks           Badges
   Quest Gating        Freezes            Achievements
   Boss Battles        Daily Goals
   Mastery
       |
       +---------------------------------------+
       |
     ECONOMY
       |
   Coins -> Shop -> Avatar / Streak Freeze

       +---------------------------------------+
       |
      GOALS
       |
 Daily / Weekly Challenges

       +---------------------------------------+
       |
    COMPETITION
       |
    Leaderboards
```

Each mechanism has a distinct purpose.

---

# 5. XP — Experience Points

## 5.1 What Is XP?

XP is the main progression currency.

Students receive XP as they perform learning activities, particularly when completing quests and defeating boss battles.

The functional requirements state that XP and coins are awarded based on the reward defined for the quest.

The implementation documentation says each quest stores reward values for:

- `rewardXp`
- `rewardCoins`

and that rewards are calculated dynamically based on:

- the quest's stage composition
- the quest difficulty multiplier

Quest difficulty can be:

- Easy
- Medium
- Hard

The documentation does not provide the complete numeric multiplier table in the extracted implementation text, so the exact values should not be assumed.

---

## 5.2 Why XP Exists

XP answers:

> "How much have I progressed?"

For example:

```text
Student starts:
XP = 0

Completes learning activities:
XP increases

XP increases:
0 -> 100 -> 250 -> 500 -> ...
```

XP therefore acts as a continuous progression signal.

---

# 6. XP Events

Questify does not only store the current XP total.

It also maintains an append-only XP event log.

The documentation describes the XP event entity as storing:

- user
- course
- amount
- source

Conceptually:

```text
XPEvent
---------
userId
courseId
amount
source
```

The event log is important because it preserves the history of XP transactions.

For example:

```text
XP Event 1: +100 from Quest A
XP Event 2: +150 from Quest B
XP Event 3: +50  from Challenge X
XP Event 4: +200 from Quest C
```

This provides a historical basis for period-based calculations such as leaderboard scores.

---

# 7. Levels

XP feeds into the level system.

The documented formula is:

```text
level = floor(sqrt(XP / 100)) + 1
```

This means the user's level is derived from accumulated XP.

Examples:

```text
XP = 0

floor(sqrt(0 / 100)) + 1
= 1
```

```text
XP = 900

floor(sqrt(900 / 100)) + 1
= floor(3) + 1
= 4
```

The square-root relationship means that the required XP grows as the learner reaches higher levels.

---

# 8. Level-Up Events

The level is recalculated when XP changes.

If the newly calculated level is different from the previous level, Questify emits a level-up event.

Conceptually:

```text
Old XP
   |
   v
Reward added
   |
   v
New XP
   |
   v
Calculate new level
   |
   +---- Same level ----> Continue
   |
   +---- Different level -> UserLeveledUp event
```

This allows other parts of the system to react to level progression without being tightly coupled to the XP calculation.

---

# 9. Level Titles

The documentation associates levels with progression titles.

The documented titles include:

- Novice
- Pathfinder
- Adventurer
- Legend

The exact level thresholds are part of the project's level configuration; the documentation's algorithm section identifies the titles but does not provide a complete threshold table in the extracted text.

---

# 10. Coins

Coins are different from XP.

A useful distinction is:

```text
XP    = progression
Coins = spending currency
```

Coins are awarded from learning/reward activities and can be spent in the virtual shop.

This creates an economy:

```text
Complete Quest
      |
      +----> XP
      |
      +----> Coins
                 |
                 v
               Shop
                 |
       +---------+---------+
       |                   |
   Avatar Items       Streak Freezes
```

This gives the learner a reason to care about coins beyond simply collecting another number.

---

# 11. Quest Rewards

Questify's course-authoring system allows quests to have reward values.

A quest stores:

```text
rewardXp
rewardCoins
```

The reward is calculated dynamically according to the quest's composition and difficulty.

This is important because a harder or more substantial quest can be associated with a different reward than a simpler quest.

The admin dashboard allows instructors/content creators to manage quests and set difficulty.

---

# 12. The Virtual Shop

The shop converts coins into tangible virtual rewards.

Students can purchase:

- cosmetic avatar items
- streak-freeze items

The documentation says the purchase system validates:

1. Whether the student has enough coins.
2. Whether the student already owns the item.
3. Whether the streak-freeze inventory limit has been reached.

Equippable items can automatically be equipped when the corresponding slot is empty.

---

# 13. Shop Database Model

The gamification data model contains several related entities.

## ShopItem

Defines an item.

The documented fields include concepts such as:

- name
- description
- price
- type
- rarity
- metadata

## UserInventory

Stores the items owned by a particular learner.

## UserEquippedItem

Stores the currently equipped items.

The system supports avatar equipment slots and allows at most one item per slot.

---

# 14. Avatar Customization

Avatar customization is a personalization mechanism.

The documentation describes equippable slots including:

- Head
- Body
- Lower body

The learner can purchase items with coins and equip them through the profile/inventory interface.

The user manual describes this flow:

```text
Profile
   |
   v
Change Avatar
   |
   v
Inventory
   |
   v
Select equipped items
```

Avatar customization is not just cosmetic from a design perspective. It contributes to the autonomy dimension of the gamification model.

---

# 15. Streaks

A streak measures consecutive days of learner activity.

Example:

```text
Monday     active
Tuesday    active
Wednesday  active
Thursday   active
Friday     active

Streak = 5 days
```

Questify treats the daily streak as a major engagement mechanism.

The documentation describes the intended habit as requiring a relatively low daily effort, such as completing a short quest.

---

# 16. Why Streaks Were Added

XP rewards individual actions.

A streak rewards **consistency**.

These are different goals.

```text
XP:
"What did you accomplish?"

Streak:
"Did you keep coming back?"
```

The idea is to transform repeated learning into a habit.

The documentation references habit-formation research suggesting that repetition in a stable context can make behavior more automatic and that interruptions can be disruptive.

Questify therefore uses:

- daily streaks
- daily challenges
- streak-freeze items

to support sustained participation.

---

# 17. Streak Milestones

The documentation specifically identifies streak milestones at:

- 7 days
- 30 days
- 100 days

These milestones are associated with rewards.

The exact reward implementation/values are not fully specified in the extracted text, so they should not be invented.

---

# 18. Streak Freeze

A streak freeze protects a learner's streak from missed days.

Example:

```text
Current streak = 30 days
Freeze inventory = 1

Student misses one day

Freeze consumed
Streak preserved
```

This is different from simply giving everyone an unlimited grace period.

The freeze is an item in the game's economy.

Therefore:

```text
Coins
  |
  v
Buy Streak Freeze
  |
  v
Store in inventory
  |
  v
Use when a missed day occurs
```

---

# 19. Multiple Missed Days

The documented streak-freeze algorithm works on missed calendar days.

If a student misses multiple days, a freeze is consumed for each missed day.

Example:

```text
Missed days = 2
Available freezes = 2

Consume:
Freeze 1 -> missed day 1
Freeze 2 -> missed day 2

Result:
Streak preserved
```

If there are not enough freezes, the remaining unprotected interruption can break the streak.

Example:

```text
Missed days = 2
Available freezes = 1

One day protected
One day unprotected

Result:
Streak cannot be fully preserved
```

---

# 20. How Streak Status Is Checked

The documentation states that streak status is evaluated:

- when the application starts
- through a nightly cron/background process

The system compares calendar dates to determine inactivity and missed days.

This means streak management is not dependent only on the learner opening the app.

---

# 21. Badges

Badges are visual recognition of milestones.

Questify has **five badge families**.

The documented examples include:

1. Login streak
2. Quests completed
3. Courses completed
4. Bosses defeated
5. Total XP

Each family has four tiers:

- Bronze
- Silver
- Gold
- Legendary

So the structure is:

```text
Badge Family
     |
     +---- Bronze
     |
     +---- Silver
     |
     +---- Gold
     |
     +---- Legendary
```

---

# 22. Badge Thresholds

Badge families use metrics and thresholds.

Conceptually:

```text
Metric = quests_completed
Threshold = X
Tier = Bronze
```

Then:

```text
Higher metric
      |
      v
Higher badge tier
```

The documentation describes the system as threshold-based and says the evaluator determines the highest qualifying tier.

The complete numeric threshold list is not provided in the extracted implementation section, so exact values should not be invented.

---

# 23. Badge Evaluation

Badges are evaluated when relevant events occur.

For example:

```text
QuestCompleted
      |
      v
Badge Evaluator
      |
      v
Check quest-completion metric
      |
      v
Compare against thresholds
      |
      v
Award newly qualifying badge
```

The system awards unearned badges in the progression path.

This avoids continuously scanning every learner.

---

# 24. Badge Database Model

The documentation describes:

## BadgeDefinition

Defines the badge itself.

Relevant concepts include:

- family
- tier
- threshold
- metric
- rarity
- points

## UserBadge

Represents an earned badge for a particular user.

## UserFeaturedBadge

Represents badges selected by the learner for profile display.

---

# 25. Featured Badges

Questify allows learners to display selected badges on their profile.

The user manual says the profile displays the learner's top five featured badges and allows them to edit the featured selection.

The database stores:

```text
userId
badgeDefinitionId
position
```

This is another social/personalization component of the gamification system.

---

# 26. Achievements

Achievements are rule-based accomplishments.

The documentation describes two important types:

## One-shot achievements

They are earned once when a condition occurs.

Example concept:

```text
Complete first quest
```

## Counter-based achievements

They are earned when a metric reaches a threshold.

Example concept:

```text
Complete N quests
```

The exact examples above are conceptual unless a particular threshold is explicitly configured in the project's data.

---

# 27. Achievement Rules

Achievement rules are stored as JSON.

Conceptually, a rule can look like:

```json
{
  "metric": "quests_completed",
  "threshold": 50
}
```

The actual documentation states that rules can be general or course-scoped.

This design makes achievements configurable rather than requiring a separate hard-coded function for every achievement.

---

# 28. General vs Course-Scoped Achievements

The documentation states that achievement rules can be:

- general
- course-scoped

This means an achievement can potentially depend on overall learner activity or activity within a particular course.

Conceptually:

```text
General:
All courses combined
       |
       v
Achievement

Course-scoped:
Course A activity
       |
       v
Achievement
```

This allows gamification to be connected to particular learning content.

---

# 29. Achievement Idempotency

This is an important software-engineering detail.

An achievement should never be awarded twice just because two events arrive close together.

For example:

```text
QuestCompleted event
QuestCompleted event
```

could theoretically be processed concurrently.

Questify uses atomic conditional database updates to protect achievement awarding from duplicate processing.

The implementation uses a conditional progression/update approach so the achievement can move into the earned state only once.

The important principle is:

> **Awarding an achievement must be idempotent.**

---

# 30. Login Deduplication

Questify also prevents repeated logins on the same calendar day from being incorrectly counted as multiple daily login events for achievement purposes.

For example:

```text
Login 08:00
Login 12:00
Login 18:00
Login 23:00
```

These are still one calendar day's login activity for daily login tracking.

This prevents trivial exploitation of login-based progression.

---

# 31. Challenges

Challenges are temporary goals.

Questify supports:

- Daily challenges
- Weekly challenges

The administrator defines challenge parameters.

These include:

- metric
- threshold
- period
- reward XP
- reward coins

---

# 32. Challenge Metrics

The documentation lists challenge metrics such as:

- quests completed
- logins
- boss battles defeated
- courses completed
- total XP earned

For example:

```text
Daily challenge:
Complete 3 quests
```

or:

```text
Weekly challenge:
Earn 1000 XP
```

The exact challenge configuration is administrator-defined.

---

# 33. Challenge Lifecycle

Suppose:

```text
Challenge:
Complete 5 quests
Reward:
100 XP + 50 coins
```

The learner completes a quest.

```text
QuestCompleted
      |
      v
Challenge Evaluator
      |
      v
Progress = 1 / 5
```

After more quests:

```text
2 / 5
3 / 5
4 / 5
5 / 5
```

At 5:

```text
Threshold reached
      |
      v
Challenge completed
      |
      v
Rewards granted
      |
      v
ChallengeCompleted event
```

This event can trigger other system behavior such as notifications.

---

# 34. Challenge Self-Healing

The documentation contains an important edge-case mechanism.

A challenge progress record might theoretically be missing when an event occurs.

For example:

```text
QuestCompleted event
       |
       v
Challenge progress record does not exist
```

Questify can automatically create the missing progress record and then process the event.

This is called a self-healing mechanism in the documentation.

The purpose is to prevent a race/order issue between scheduled challenge-record creation and learner activity.

---

# 35. Leaderboards

Leaderboards provide the competitive/social layer.

Questify has three documented leaderboard types:

## Weekly Global

XP earned during the week across learners.

## Monthly Global

XP earned during the month.

## Weekly Per-Course

XP earned during the week within a specific course.

---

# 36. Why Leaderboards Use XP Earned During a Period

The system should compare current activity rather than simply comparing lifetime XP.

Imagine:

```text
Student A:
Lifetime XP = 50,000

Student B:
Lifetime XP = 5,000
```

If the leaderboard used lifetime XP, Student A would always have an advantage.

Instead, period leaderboards are based on XP earned during the relevant period.

The documentation describes weekly/monthly XP baselines so period scores can be calculated.

Conceptually:

```text
Current XP
   -
Period baseline XP
   =
XP earned during period
```

---

# 37. Leaderboard Snapshots

Calculating a large leaderboard every time someone opens the screen can be expensive.

Questify therefore uses background processing and leaderboard snapshots.

Conceptually:

```text
XP Events
    |
    v
Background Worker
    |
    v
Calculate ranking
    |
    v
LeaderboardSnapshot
    |
    v
Mobile App
```

The documentation states that leaderboard snapshots are generated periodically in the background and cached for efficient querying.

This improves performance and avoids doing expensive aggregation directly on every leaderboard request.

---

# 38. Background Jobs and Gamification

Questify uses background jobs for work that does not need to block the learner's request.

The system uses **pg-boss** for durable background jobs.

Gamification-related background processing includes mechanisms such as:

- leaderboard snapshot generation
- scheduled streak checking
- challenge-related scheduled processing

The purpose is to keep the user-facing API responsive while background work happens independently.

---

# 39. Event-Driven Gamification Architecture

This is one of the most important technical ideas in the project.

Questify uses an in-process typed event bus.

Instead of making the quest service directly know about every gamification feature, it publishes events.

For example:

```text
Quest Completed
       |
       v
QuestCompleted Event
       |
       v
Typed Event Bus
       |
       +--------> XP / reward processing
       |
       +--------> Badge evaluator
       |
       +--------> Achievement evaluator
       |
       +--------> Challenge evaluator
       |
       +--------> Notification handling
       |
       +--------> Audit logging
```

This is a publish-subscribe architecture.

---

# 40. Why Use an Event Bus?

Without an event bus, the quest module could become tightly coupled:

```text
Quest Service
    |
    +--> XP Service
    +--> Badge Service
    +--> Achievement Service
    +--> Challenge Service
    +--> Notification Service
```

With an event bus:

```text
Quest Service
    |
    v
QuestCompleted
    |
    v
Event Bus
   / | \
  /  |  \
XP Badge Achievement ...
```

The quest module only needs to publish the event.

Other modules subscribe independently.

This makes the system:

- modular
- easier to extend
- easier to test
- less tightly coupled

---

# 41. Example: Quest Completion

A complete conceptual flow is:

```text
Student answers final stage
          |
          v
Quest completed
          |
          v
Persist quest progress
          |
          v
Publish QuestCompleted
          |
          +-------------------------------+
          |               |               |
          v               v               v
      Rewards          Badges        Achievements
          |               |               |
          v               v               v
      XP / Coins       Evaluate       Evaluate
          |
          v
     Recalculate Level
          |
          +----> UserLeveledUp if changed
          |
          v
       Challenges
          |
          v
      Update progress
          |
          v
      If threshold:
          |
          v
     Grant challenge reward
          |
          v
 ChallengeCompleted event
```

This is the core gamification loop.

---

# 42. Quest Progression Is Part of Gamification

Gamification is not limited to XP.

Questify structures content into:

```text
Course
   |
   +-- Section
        |
        +-- Quest
             |
             +-- Stage
```

Stages can be:

- Informational
- MCQ
- Boss Battle

The learner progresses through this structure.

---

# 43. Linear Gating

The system uses linear progression.

The documented status flow is:

```text
LOCKED
   |
   v
UNLOCKED
   |
   v
IN_PROGRESS
   |
   v
COMPLETED
```

Completing a quest unlocks the next quest in the section.

Completing all quests in a section:

```text
Section completed
      |
      v
First quest of next section unlocked
```

Completing all sections:

```text
Course completed
```

This creates a game-like progression path.

---

# 44. Why Boss Battles Matter

Boss battles are the highest-challenge stage type in the quest structure.

The intended learning progression is:

```text
Informational
      |
      v
Multiple Choice
      |
      v
Boss Battle
```

This gives the learner an escalating sense of challenge.

It also connects to the competence dimension of the gamification model.

The learner can experience:

```text
Learn
  ->
Practice
  ->
Challenge
  ->
Defeat Boss
  ->
Earn Reward
```

---

# 45. Stage Mastery

Questify does not only measure whether a student clicked through content.

It tracks detailed stage performance.

The system records:

- total attempts
- right answers
- wrong answers
- consecutive correct answers
- timestamp of the first wrong answer

---

# 46. Mastery Rule

A stage is marked as mastered after:

```text
2 consecutive correct answers
```

Example:

```text
Attempt 1:
Correct
Consecutive = 1

Attempt 2:
Correct
Consecutive = 2

=> MASTERED
```

If an incorrect answer occurs:

```text
Correct
Consecutive = 1

Wrong
Consecutive = 0
```

Once mastery has been achieved, later attempts do not cause the stage to regress from mastered.

---

# 47. Why Mastery Matters for Gamification

Mastery makes the system more educational.

A purely cosmetic gamification system might reward:

> "You clicked the button."

Questify also records:

> "Did you actually demonstrate understanding?"

This gives the gamification system a relationship with assessment.

The overall loop becomes:

```text
Learn
  |
  v
Attempt
  |
  v
Assessment
  |
  v
Mastery
  |
  v
Progression / Rewards
```

---

# 48. The Main Gamification Entities

The documentation's database contains a dedicated group of gamification/economy entities.

Important ones include:

### User

Stores the learner's core progression-related state, including XP/level/coins and related profile information.

### XPEvent

Historical XP transactions.

### Achievement

Achievement definitions.

### UserAchievement

A user's achievement state.

### BadgeDefinition

Badge family/tier/threshold definitions.

### UserBadge

Earned badges.

### UserFeaturedBadge

Badges selected for profile display.

### ChallengeDefinition

Definition of a daily/weekly challenge.

### UserChallenge

A learner's progress toward a challenge.

### ShopItem

Purchasable virtual item definitions.

### UserInventory

Items owned by a learner.

### UserEquippedItem

Currently equipped avatar items.

### LeaderboardSnapshot

Precomputed leaderboard results.

---

# 49. Important Data Relationships

A simplified relationship model:

```text
User
 |
 +------------------> XPEvent
 |
 +------------------> UserAchievement
 |
 +------------------> UserBadge
 |
 +------------------> UserFeaturedBadge
 |
 +------------------> UserChallenge
 |
 +------------------> UserInventory
 |
 +------------------> UserEquippedItem
 |
 +------------------> Course Progress
```

Definitions are separate:

```text
Achievement
     |
     v
UserAchievement

BadgeDefinition
     |
     v
UserBadge

ChallengeDefinition
     |
     v
UserChallenge

ShopItem
     |
     v
UserInventory
```

This separates **what exists in the system** from **what a specific user has earned or owns**.

---

# 50. Why Definitions and User Records Are Separate

Consider badges.

You do not want to store:

```text
Ali has a Gold badge
```

as the definition itself.

Instead:

```text
BadgeDefinition
----------------
Family: Quest Completion
Tier: Gold
Threshold: ...
```

and then:

```text
UserBadge
----------------
User: Ali
Badge: Gold Quest Completion
EarnedAt: ...
```

This lets many users share the same badge definition while each user has their own earned state.

The same design applies to:

- achievements
- challenges
- shop items

---

# 51. Gamification and Security

Because users should not be able to award themselves XP, coins, achievements, or items, these operations are controlled by the backend.

Questify uses:

- JWT authentication
- role-based access control
- API-layer validation
- Prisma/PostgreSQL persistence
- shared Zod schemas

The platform has three roles:

- STUDENT
- LECTURER
- ADMIN

Lecturers/content creators can manage learning content and gamification-related definitions available to them, while system-wide administration is restricted to admins.

---

# 52. Gamification and the Admin Dashboard

The admin/educator side is important because gamification must be configurable.

The admin dashboard provides access to course/content management and the relevant administrative functionality.

Content creators can:

- create courses
- create sections
- create quests
- create stages
- set quest difficulty
- manage reward values
- use the AI content generation pipeline

Administrators manage broader platform functionality such as:

- gamification rules
- shop
- reports
- notifications
- analytics
- audit information

The exact permission boundaries depend on the documented user role requirements.

---

# 53. A Complete Example

Imagine a student is studying a programming course.

## Initial state

```text
XP = 900
Coins = 300
Level = 4
Streak = 6 days
```

Today's quest contains:

```text
Informational stage
       |
       v
MCQ stages
       |
       v
Boss battle
```

The learner completes the quest.

---

## Reward

Suppose the configured quest reward is:

```text
XP reward = X
Coin reward = Y
```

The exact values depend on the configured quest.

The backend awards:

```text
XP += X
Coins += Y
```

and records the XP transaction.

---

## Level

The system recalculates:

```text
level = floor(sqrt(XP / 100)) + 1
```

If the result is higher than the previous level:

```text
UserLeveledUp
```

is emitted.

---

## Badge

The badge evaluator checks whether the new activity caused the learner to cross a badge threshold.

If yes:

```text
New badge awarded
```

---

## Achievement

The achievement evaluator checks the learner's configured achievement rules.

If an achievement becomes eligible:

```text
Achievement earned
```

The database update protects against duplicate awarding.

---

## Challenge

Suppose the daily challenge is:

```text
Complete N quests
```

The evaluator increments the learner's progress.

If the threshold is reached:

```text
Challenge completed
       |
       v
Reward XP + Coins
```

---

## Streak

The learner's daily activity also contributes to the streak.

```text
6 days -> 7 days
```

The learner reaches a documented milestone.

---

## Leaderboard

The learner's XP event contributes to the relevant period score.

The next leaderboard snapshot can reflect the updated ranking.

---

# 54. The Full Gamification Loop

The entire system can be remembered as a loop:

```text
              LEARNING
                 |
                 v
        Complete Quest/Stage
                 |
                 v
             EVENT BUS
                 |
       +---------+---------+
       |         |         |
       v         v         v
      XP       Badges   Achievements
       |         |         |
       v         |         |
     Level       |         |
       |         |         |
       +---------+---------+
                 |
                 v
             Challenges
                 |
                 v
              Rewards
                 |
                 v
            XP + Coins
                 |
          +------+------+
          |             |
          v             v
        Level         Shop
                        |
                        v
                Avatar / Freeze
                        |
                        v
                     Streak
                        |
                        v
                  Return Daily
                        |
                        +------> LEARNING
```

Leaderboards sit on top of the XP history:

```text
XP Events
    |
    v
Period calculation
    |
    v
Leaderboard Snapshot
```

---

# 55. What Each Mechanism Is Trying to Achieve

| Mechanism | Main purpose |
|---|---|
| XP | Continuous progression |
| Levels | Convert XP into visible progression |
| Coins | Virtual economy |
| Shop | Give coins a spending purpose |
| Avatar | Personalization/autonomy |
| Streak | Encourage daily consistency |
| Streak Freeze | Protect consistency from occasional interruptions |
| Badges | Recognize milestone achievement |
| Achievements | Recognize rule-based accomplishments |
| Daily Challenges | Create short-term goals |
| Weekly Challenges | Create longer short-term goals |
| Leaderboards | Add social competition |
| Quest Gating | Create a sense of progression |
| Boss Battles | Create escalating challenge |
| Stage Mastery | Connect progression to demonstrated learning |

---

# 56. What Makes the Design More Than "Points and Badges"

The key difference is integration.

A shallow LMS could have:

```text
Course
 +
Random points
 +
Badge screen
```

Questify instead connects:

```text
Educational content
       |
       v
Assessment
       |
       v
Progression
       |
       v
Rewards
       |
       v
Habit
       |
       v
Competition
       |
       v
Personalization
```

The gamification system therefore interacts with the actual learning lifecycle.

---

# 57. Technical Design Principles

The implementation demonstrates several software-engineering principles.

## 57.1 Separation of concerns

Learning progression, badges, achievements, challenges, notifications, and leaderboards are separate modules.

## 57.2 Event-driven communication

Modules communicate through typed events instead of creating unnecessary direct dependencies.

## 57.3 Idempotency

Achievement awarding is protected against duplicate processing.

## 57.4 Background processing

Expensive/scheduled work is moved into background jobs.

## 57.5 Persistent history

XP events provide an auditable history of XP transactions.

## 57.6 Configurability

Achievement and challenge rules are stored as definitions rather than hard-coded separately for every rule.

## 57.7 Data integrity

Critical writes and reward-related operations are handled through backend persistence and database constraints/atomic operations.

---

# 58. Why Event-Driven Architecture Is Especially Useful Here

Gamification naturally creates many reactions to one learning action.

One event such as:

```text
QuestCompleted
```

may affect:

- XP
- coins
- levels
- badges
- achievements
- challenges
- notifications
- analytics/audit
- leaderboards indirectly through XP history

If all of these were implemented directly inside the quest controller, the controller would become large and difficult to maintain.

Instead:

```text
QuestCompleted
       |
       v
Event Bus
       |
       +--> Reward logic
       +--> Badge logic
       +--> Achievement logic
       +--> Challenge logic
       +--> Notification logic
```

This is one of the strongest architectural ideas behind the gamification implementation.

---

# 59. What Happens When Something Goes Wrong?

The architecture also considers partial failures.

The documentation describes asynchronous/background processing and partial failure isolation.

For example, if notification processing fails, that should not invalidate the learner's successfully completed quest.

Similarly, background work such as leaderboard generation should not prevent the core learning request from completing.

The main learning transaction and secondary reward/notification work therefore have different responsibilities.

---

# 60. Performance Considerations

The project's nonfunctional requirements include a target of less than 300 ms p95 for hot-path requests.

Gamification is designed with performance in mind.

Examples:

- XP history is stored rather than recomputed from scratch.
- Leaderboards use snapshots.
- Background jobs handle scheduled/expensive operations.
- The API is stateless.
- Database operations are structured around the relevant entities.
- Client-side caching/refetching is handled with TanStack Query.

The exact production performance achieved by a deployment is not established by these design requirements; the documentation specifies them as nonfunctional targets.

---

# 61. How to Implement a Similar Gamification System From Scratch

If you wanted to implement the Questify gamification architecture yourself, the implementation can be broken down into stages.

## Step 1 — Define the learning events

Start with events such as:

```text
UserLoggedIn
QuestCompleted
BossDefeated
StageMastered
ChallengeCompleted
UserLeveledUp
```

The exact event list should match the behavior you actually implement.

---

## Step 2 — Create the event bus

Define typed event payloads.

Conceptually:

```text
EventBus
   |
   +-- publish(event)
   |
   +-- subscribe(eventType, handler)
```

For example:

```text
publish(QuestCompleted)
```

and:

```text
subscribe(QuestCompleted, badgeEvaluator)
subscribe(QuestCompleted, challengeEvaluator)
```

---

## Step 3 — Implement XP

Create a user progression state:

```text
User
------
xp
level
coins
```

Create the transaction/history table:

```text
XPEvent
------
userId
courseId
amount
source
```

Whenever XP changes:

1. validate the reward
2. update XP
3. insert XP event
4. calculate level
5. emit level-up event if necessary

---

## Step 4 — Implement coins

Whenever a valid learning/reward action grants coins:

```text
coins += rewardCoins
```

Do this on the server.

Do not trust a client-provided coin amount.

---

## Step 5 — Implement levels

Use the documented Questify formula:

```text
floor(sqrt(XP / 100)) + 1
```

Compare old level to new level.

If changed:

```text
publish(UserLeveledUp)
```

---

## Step 6 — Implement badges

Create:

```text
BadgeDefinition
UserBadge
```

A badge definition contains:

```text
family
tier
threshold
metric
rarity
points
```

When an event occurs:

1. identify affected metric
2. calculate current value
3. find qualifying tiers
4. award missing badges
5. make awarding idempotent

---

## Step 7 — Implement achievements

Create:

```text
Achievement
UserAchievement
```

Store the achievement rule as structured JSON.

When a relevant event occurs:

```text
evaluate(rule, userState)
```

If true:

```text
award once
```

Use a database-level conditional operation to prevent duplicates.

---

## Step 8 — Implement challenges

Create:

```text
ChallengeDefinition
UserChallenge
```

Definition:

```text
metric
threshold
period
rewardXp
rewardCoins
```

When a matching event arrives:

```text
progress += eventContribution
```

Then:

```text
if progress >= threshold:
    complete challenge
    grant reward
    publish ChallengeCompleted
```

Add the self-healing creation behavior when a progress record is missing.

---

## Step 9 — Implement streaks

Store the necessary streak state.

On activity:

```text
compare activity date
```

Then:

```text
same day -> don't increment again
next day -> increment
missed day -> evaluate freeze protection
```

Run scheduled checking through a background job.

---

## Step 10 — Implement streak freezes

Create an inventory item representing the freeze.

When missed days are detected:

```text
missedDays = calculateCalendarDifference(...)
```

Consume freezes for protected missed days.

If protection is insufficient, the streak can break according to the documented rules.

---

## Step 11 — Implement the shop

Create:

```text
ShopItem
UserInventory
UserEquippedItem
```

Purchase flow:

```text
Request purchase
      |
      v
Validate item
      |
      v
Check balance
      |
      v
Check ownership
      |
      v
Check special inventory rules
      |
      v
Deduct coins
      |
      v
Create inventory record
```

For important currency operations, use atomic/transactional database logic so two concurrent purchases cannot incorrectly spend the same balance.

---

## Step 12 — Implement leaderboards

Do not make the mobile client calculate global rankings.

Instead:

```text
XPEvent
   |
   v
Periodic background job
   |
   v
Calculate period XP
   |
   v
Create LeaderboardSnapshot
```

Then the mobile app reads the snapshot.

---

# 62. Example Pseudocode for the Core Event Flow

A simplified conceptual implementation:

```text
onQuestCompleted(event):

    reward = calculateQuestReward(event.quest)

    grantXP(event.user, reward.xp)
    grantCoins(event.user, reward.coins)

    publish(QuestCompleted(event))
```

Subscribers:

```text
onQuestCompleted(event):
    evaluateBadges(event.user)

onQuestCompleted(event):
    evaluateAchievements(event.user)

onQuestCompleted(event):
    updateChallenges(event.user, event)

onQuestCompleted(event):
    createNotificationIfNeeded(event)
```

XP logic:

```text
grantXP(user, amount):

    oldLevel = calculateLevel(user.xp)

    user.xp += amount

    createXPEvent(user, amount)

    newLevel = calculateLevel(user.xp)

    if newLevel > oldLevel:
        publish(UserLeveledUp)
```

The real Questify implementation contains more validation, persistence, and application-specific logic; this pseudocode is only a conceptual representation of the architecture documented in the project.

---

# 63. Potential Race Conditions You Need to Understand

Gamification creates concurrency problems.

For example:

```text
Request A:
complete quest

Request B:
complete another quest
```

Both may attempt to:

```text
update XP
update coins
award achievement
```

Therefore, important operations need safe database behavior.

The documentation specifically emphasizes atomic operations for critical writes and achievement idempotency.

This is why database-level conditional updates and transactions matter.

---

# 64. Gamification Exploitation Problems

A gamification system can be abused if it only counts events.

Examples:

### Repeated login exploitation

Solution:

- daily login deduplication.

### Duplicate achievement awards

Solution:

- idempotent conditional database updates.

### Buying an item twice

Solution:

- ownership validation.

### Spending more coins than available

Solution:

- server-side balance validation.

### Excessive streak protection

Solution:

- streak freeze inventory and limits.

### Jumping directly to later content

Solution:

- prerequisite/linear gating.

These are all examples of why gamification is not simply a UI problem.

---

# 65. The Most Important Distinction: Engagement vs Learning

A strong explanation of Questify should acknowledge that gamification is not the same thing as learning.

Questify uses gamification to encourage engagement, but the learning system still contains:

- structured course content
- informational stages
- MCQs
- boss battles
- attempts
- correctness
- mastery tracking
- progress tracking

The project therefore combines:

```text
Engagement
+
Assessment
+
Progression
```

rather than assuming that rewards alone prove learning.

---

# 66. A Mental Model for the Whole System

Think of the learner as having four parallel states:

```text
1. LEARNING STATE
   Where am I in the course?

2. PROGRESSION STATE
   How much XP/what level am I?

3. ACHIEVEMENT STATE
   What badges/achievements have I earned?

4. ENGAGEMENT STATE
   What is my streak/challenge/leaderboard status?
```

And a fifth:

```text
5. ECONOMIC STATE
   How many coins/items/freezes do I have?
```

All five are connected.

---

# 67. One Complete Architecture Diagram

```text
                        QUESTIFY
                           |
                 +---------+---------+
                 |                   |
            LEARNING LAYER       GAMIFICATION
                 |                   |
        Course/Section/Quest          |
                 |                   |
               Stage                 |
                 |                   |
       +---------+---------+          |
       |         |         |          |
 Informational  MCQ     Boss Battle   |
       |         |         |          |
       +---------+---------+          |
                 |                   |
                 v                   |
          Learning Event             |
                 |                   |
                 v                   |
             EVENT BUS <-------------+
                 |
     +-----------+-----------+----------------+
     |           |           |                |
     v           v           v                v
   Rewards     Badges   Achievements     Challenges
     |           |           |                |
     v           v           v                v
 XP + Coins   UserBadge   UserAchievement  UserChallenge
     |
     +----------> Level
     |
     +----------> XPEvent
                       |
                       v
                Leaderboard Job
                       |
                       v
                LeaderboardSnapshot

Coins
  |
  v
Shop
  |
  +----> Avatar Items
  |
  +----> Streak Freezes

Daily Activity
  |
  v
Streak Engine
  |
  +----> Milestones
  |
  +----> Freeze Consumption
```

---

# 68. How to Explain It in a Technical Viva

If the examiner asks:

## "What is the purpose of gamification?"

Answer:

> "The purpose is to increase learner engagement and encourage consistent learning by integrating game mechanics directly with the educational workflow. In Questify, completing learning activities generates progression, rewards, achievements, challenges, and other feedback."

---

## "What gamification features did you implement?"

Answer:

> "We implemented XP, levels, coins, streaks with streak freezes, five badge families with four tiers, rule-based achievements, daily and weekly challenges, weekly and monthly leaderboards, a virtual shop, avatar customization, and game-like quest progression with boss battles."

---

## "How does XP work?"

Answer:

> "Quest rewards contain XP values, and when a learner completes a quest or relevant learning activity, the backend grants XP and records an XP event. The user's level is derived from XP using the documented square-root formula. If the calculated level changes, a level-up event is published."

---

## "Why did you store XP events?"

Answer:

> "We use an append-only XP event history to preserve the source and amount of each XP transaction. It also provides the data needed for period-based calculations such as weekly and monthly leaderboard scores."

---

## "How do badges work?"

Answer:

> "Badges are organized into five families and four tiers. Each badge definition has a metric and threshold. When relevant events occur, a badge evaluator checks the user's current metric and awards newly qualifying tiers. The implementation is designed to avoid duplicate awards."

---

## "What's the difference between badges and achievements?"

Answer:

> "Badges are organized into predefined families and tiers based on metrics and thresholds, while achievements are a rule-based system that supports one-shot and counter-based accomplishments. Achievement rules are stored as structured JSON and can be general or course-scoped."

---

## "How do challenges work?"

Answer:

> "Administrators define a metric, threshold, period, and reward. When a matching learner event occurs, the challenge evaluator increments progress. Once the threshold is reached, the challenge is completed, rewards are granted, and a challenge-completed event is published."

---

## "How does the streak work?"

Answer:

> "The streak tracks consecutive calendar days of activity. Questify uses daily activity as a habit-forming mechanism and supports streak milestones. If a learner misses days, the system can consume streak-freeze items from their inventory to protect the streak."

---

## "Why do you need a streak freeze?"

Answer:

> "Because a streak is intended to encourage consistency without making one interruption unnecessarily destructive. The learner can acquire freezes through the virtual economy and use them to absorb missed days."

---

## "Why use an event bus?"

Answer:

> "Because one learning event can affect many independent gamification systems. Instead of tightly coupling quest completion to XP, badges, achievements, challenges, and notifications, Questify publishes an event and lets separate modules subscribe to it. This improves modularity and extensibility."

---

## "How are leaderboards implemented?"

Answer:

> "XP transactions are recorded as events. Background processing periodically calculates period-specific rankings and stores leaderboard snapshots. The client can then read the precomputed snapshot instead of calculating the entire leaderboard on every request."

---

## "How do you prevent cheating or duplicate rewards?"

Answer:

> "Important reward logic is handled server-side. The system validates purchases and balances, deduplicates daily logins, uses idempotent achievement awarding through conditional database updates, and uses progression gating to prevent learners from bypassing prerequisites."

---

# 69. The 10 Things You Absolutely Need to Remember

If you don't have time to memorize everything, memorize these:

### 1.
**Gamification is integrated with learning, not added cosmetically.**

### 2.
**XP represents progression.**

### 3.
**Coins represent the virtual economy.**

### 4.
**XP determines level using:**

```text
floor(sqrt(XP / 100)) + 1
```

### 5.
**Streaks encourage daily learning, and freezes protect streaks from missed days.**

### 6.
**Badges have five families and four tiers.**

### 7.
**Achievements are rule-based and support one-shot/counter-based logic.**

### 8.
**Challenges are daily/weekly threshold-based goals with rewards.**

### 9.
**Leaderboards are based on period XP and use background-generated snapshots.**

### 10.
**The whole system is connected using an event-driven architecture.**

---

# 70. The One Diagram to Memorize

```text
                STUDENT LEARNS
                      |
                      v
              COMPLETE QUEST
                      |
                      v
                QUEST EVENT
                      |
                      v
                 EVENT BUS
                      |
       +--------------+--------------+
       |              |              |
       v              v              v
      XP            BADGES      ACHIEVEMENTS
       |              |              |
       v              v              v
     LEVEL          RECOGNITION      RULES
       |
       v
    XP EVENTS
       |
       v
  LEADERBOARDS

       Quest Event
           |
           v
      CHALLENGES
           |
           v
        REWARDS
           |
       +---+---+
       |       |
       v       v
      XP     COINS
               |
               v
              SHOP
           +---+---+
           |       |
           v       v
        AVATAR   FREEZE
                   |
                   v
                STREAK
                   |
                   v
              DAILY RETURN
                   |
                   +-------> LEARNING
```

---

# 71. Final Concept

The best way to understand Questify's gamification is to think of it as a **feedback loop**.

The student learns.

That learning produces measurable activity.

The activity produces rewards and progression.

Progression produces visible achievement.

Achievement encourages continued activity.

Continued activity produces more learning.

So the intended loop is:

```text
LEARN
  ↓
ACT
  ↓
EARN
  ↓
PROGRESS
  ↓
ACHIEVE
  ↓
RETURN
  ↓
LEARN AGAIN
```

The technical implementation supports this loop through:

```text
Learning modules
      +
Event Bus
      +
Gamification evaluators
      +
PostgreSQL/Prisma state
      +
XP event history
      +
Background jobs
      +
Mobile reward UI
```

That is the core idea of the gamification system implemented in Questify.
