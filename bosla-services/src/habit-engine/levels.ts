// Ported verbatim from the Habit Tracking System (`src/main/domain/levels.ts`).
import type { LevelInfo } from '../shared/types.js'

/**
 * Level floors follow `100 · (n−1) · (n+2)`: 0, 400, 1000, 1800, 2800, 4000, 5400 …
 * Each level costs more than the last, so early progress is quick and later levels
 * are earned over weeks rather than days.
 *
 * NOTE for Bosla integration [PRD §16 FR-GAM-B06]: this is the Habit Tracker's own
 * native XP/level curve, distinct from Questify's confirmed `floor(sqrt(XP/100))+1`
 * formula. Bosla's MVP (Phase 1) ships on this native engine; the Track-B migration
 * to Questify's formula happens once Questify joins in Phase 3 — do not conflate the
 * two curves when wiring this module into Bosla.
 */
export function levelFloor(level: number): number {
  const n = Math.max(1, Math.floor(level))
  return 100 * (n - 1) * (n + 2)
}

export const LEVEL_TITLES = [
  'Beginner',
  'Consistent',
  'Disciplined',
  'Focused',
  'Elite',
  'Relentless',
  'Formidable',
  'Unbroken',
  'Ascendant',
  'Legend'
] as const

export function levelTitle(level: number): string {
  const i = Math.max(1, Math.floor(level)) - 1
  return LEVEL_TITLES[Math.min(i, LEVEL_TITLES.length - 1)] ?? 'Legend'
}

export function levelForXp(xp: number): number {
  const total = Math.max(0, Math.floor(xp))
  let level = 1
  while (levelFloor(level + 1) <= total) level++
  return level
}

export function levelInfo(xp: number): LevelInfo {
  const total = Math.max(0, Math.floor(xp))
  const level = levelForXp(total)
  const floor = levelFloor(level)
  const ceiling = levelFloor(level + 1)
  const span = Math.max(1, ceiling - floor)
  return {
    level,
    title: levelTitle(level),
    currentXp: total,
    levelFloor: floor,
    levelCeiling: ceiling,
    xpToNext: Math.max(0, ceiling - total),
    progress: Math.min(1, Math.max(0, (total - floor) / span))
  }
}
