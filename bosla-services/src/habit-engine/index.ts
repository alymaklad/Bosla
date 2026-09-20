// Barrel export for the habit engine — ported verbatim from the Habit Tracking System's
// `src/main/domain/`. Pure functions only: no I/O, no clock, no database. Bosla's real
// backend wires these against its own PostgreSQL repositories (Bosla PRD §21 `Habit`,
// `Occurrence`, `TimeLog` entities) exactly the way the Electron app wires them against
// SQLite today — the functions here don't change either way.
export * from './time.js'
export * from './recurrence.js'
export * from './scoring.js'
export * from './streaks.js'
export * from './levels.js'
export * from './difficulty.js'
export * from './achievements.js'
export * from './todo.js'
