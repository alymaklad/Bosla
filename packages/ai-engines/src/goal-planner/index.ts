// Barrel export for the AI Goals planner — ported from the Habit Tracking System's
// `src/main/ai/`: the Actor -> Intervenor -> Reflexion loop that turns an underspecified
// goal into a schedulable weekly plan (Bosla PRD §9.1, §11.4 FR-CD-022, §15 FR-HAB-006).
//
// What's NOT ported (deliberately, not an oversight): `application/goalService.ts` from
// the source app, which wires this planner against Electron's SQLite repositories
// (`GoalRepo`, `HabitRepo`, `TodoRepo`, `SettingsRepo`) inside a `tx()` transaction. That
// wiring is Electron/better-sqlite3-specific and not portable; Bosla's real backend needs
// its own thin service that calls `anthropicGoalPlanner(...).plan(...)` and persists the
// result via its own PostgreSQL repositories (Bosla PRD §21 `Goal`, `Habit` entities) —
// same shape, different store, intentionally left for that integration step.
export * from './types.js'
export * from './anthropicClient.js'
export * from './groqClient.js'
export * from './providers.js'
export * from './goalPlanSchema.js'
export * from './scheduleConflicts.js'
export * from './promptBuilder.js'
export * from './intervenor.js'
export * from './goalPlanner.js'
