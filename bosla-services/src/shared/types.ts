// Ported from the Habit Tracking System's `src/shared/types.ts` (Adaptive Habit League),
// trimmed to only the types the habit-engine and goal-planner modules in this package use.
// Source of truth for the full type contract remains the Habit Tracking System project —
// when Bosla's real backend adopts these modules, reconcile against that file, don't drift.

/** Calendar date in the user's timezone, `YYYY-MM-DD`. Never an instant. */
export type LocalDate = string
/** Clock time in the user's timezone, `HH:MM`. */
export type LocalTime = string
/** RFC 3339 / ISO 8601 instant in UTC. */
export type Iso = string

// ---------------------------------------------------------------- habits

export type Recurrence =
  /** `days` are ISO weekday numbers, Monday = 1 … Sunday = 7. */
  | { kind: 'weekly'; days: number[] }
  /** Every `n` days counting from `anchor`. */
  | { kind: 'everyN'; n: number; anchor: LocalDate }

// ------------------------------------------------------------ occurrences

export type OccurrenceStatus =
  | 'pending'
  | 'partial'
  | 'complete'
  | 'missed'
  /** Deliberately skipped; suppresses the unjustified-skip penalty. */
  | 'skipped'

/** How the logged minutes for an occurrence were obtained. */
export type TimeLogOrigin =
  /** Measured by the in-app timer. */
  | 'timer'
  /** Typed in by the user after the fact. */
  | 'manual'
  /** Ticked in Google with no timer run — credited at target and badged. */
  | 'assumed'

// ------------------------------------------------------------- scoring

export interface ScoringConfig {
  fullCompletion: number
  partialCompletion: number
  skipped: number
  unjustifiedSkip: number
  beatWeeklyTarget: number
  worstDayCompletion: number
  sevenDayConsistency: number
  /** Fraction of target that counts as partial rather than not-started, 0–1. */
  partialThreshold: number
}

export const DEFAULT_SCORING: ScoringConfig = {
  fullCompletion: 2,
  partialCompletion: 1,
  skipped: 0,
  unjustifiedSkip: -1,
  beatWeeklyTarget: 5,
  worstDayCompletion: 3,
  sevenDayConsistency: 10,
  partialThreshold: 0.25
}

export interface LevelInfo {
  level: number
  title: string
  currentXp: number
  levelFloor: number
  levelCeiling: number
  xpToNext: number
  progress: number
}

export interface StreakInfo {
  current: number
  longest: number
}

// -------------------------------------------------------------- goals / AI planner

export type GoalStatus = 'active' | 'achieved' | 'abandoned'

/** What the user types into the wizard. */
export interface GoalDraftInput {
  title: string
  description: string | null
  targetDate: LocalDate | null
  /** How much time per week they are willing to give it. */
  weeklyMinutesBudget: number | null
}

/** A recurring practice session the plan proposes; becomes a Habit on commit. */
export interface GoalSession {
  name: string
  /** ISO weekday numbers, Monday = 1 … Sunday = 7. */
  days: number[]
  scheduledTime: LocalTime
  targetMinutes: number
  rationale: string | null
}

/** A one-off checkpoint; becomes a manual to-do on commit. */
export interface GoalMilestone {
  title: string
  dueDate: LocalDate
  description: string | null
}

export interface MindMapNode {
  id: string
  parentId: string | null
  title: string
}

export interface GoalResource {
  title: string
  /** e.g. "course", "book", "podcast", "practice site". */
  type: string
  note: string
  /** Present only when the planner found a real page and the Intervenor confirmed it resolves. */
  url: string | null
}

export interface GoalPlan {
  summary: string
  sessions: GoalSession[]
  milestones: GoalMilestone[]
  mindMap: MindMapNode[]
  resources: GoalResource[]
}

/** Which phase of the planning loop is running — shown in the wizard. */
export type GoalPlanPhase = 'researching' | 'drafting' | 'reviewing' | 'revising'

export interface GoalPlanProgress {
  phase: GoalPlanPhase
  iteration: number
  maxIterations: number
}

export interface GoalDraftResult {
  plan: GoalPlan
  /** How many drafting passes it took. */
  iterations: number
  /** Anything the Intervenor could not resolve within the cap — shown to the user. */
  warnings: string[]
}

/**
 * [DECIDED — Bosla PRD §22/§23] extended beyond the Habit Tracker's original
 * `'anthropic' | 'groq'` to the full Bosla-managed provider roster: OpenAI, Anthropic,
 * OpenRouter, and Groq. The Goals planner itself only ships Anthropic + Groq adapters
 * today (see goal-planner/README) — this type is widened so the career-discovery
 * module and future goal-planner adapters share one provider vocabulary.
 */
export type AiProvider = 'openai' | 'anthropic' | 'openrouter' | 'groq'
