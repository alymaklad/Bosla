// Local Vite uses /api proxying; production receives the deployed API URL from Vercel.
const BASE = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/$/, '')
export const apiBaseUrl = BASE

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: init?.body instanceof FormData ? undefined : { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) {
    let message = res.statusText
    try {
      const body = await res.json()
      message = body.detail ?? message
    } catch {
      /* ignore */
    }
    throw new ApiError(message, res.status)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

function get<T>(path: string) {
  return request<T>(path)
}
function post<T>(path: string, body?: unknown) {
  return request<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) })
}
function put<T>(path: string, body?: unknown) {
  return request<T>(path, { method: 'PUT', body: body === undefined ? undefined : JSON.stringify(body) })
}
function del<T>(path: string) {
  return request<T>(path, { method: 'DELETE' })
}

/** Reads an SSE stream from a POST endpoint, dispatching parsed `data:` payloads per `event:` name. */
async function streamSSE(
  path: string,
  body: unknown,
  handlers: Record<string, (data: any) => void>,
): Promise<void> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  })
  if (!res.ok || !res.body) {
    let message = res.statusText
    try {
      message = (await res.json()).detail ?? message
    } catch {
      /* ignore */
    }
    throw new ApiError(message, res.status)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    let sep: number
    while ((sep = buffer.indexOf('\n\n')) !== -1) {
      const block = buffer.slice(0, sep)
      buffer = buffer.slice(sep + 2)

      let event = 'message'
      let data = ''
      for (const line of block.split('\n')) {
        if (line.startsWith('event:')) event = line.slice(6).trim()
        else if (line.startsWith('data:')) data += line.slice(5).trim()
      }
      if (!data) continue
      const handler = handlers[event]
      if (handler) {
        try {
          handler(JSON.parse(data))
        } catch {
          handler(data)
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------- types

export interface User {
  id: string
  email: string
  name: string
  persona: string | null
  language: string
  consent_given: boolean
}

export interface ProfileDimension {
  text: string
  confidence: 'none' | 'low' | 'medium' | 'high'
}

export interface DiscoveryProfile {
  interests: ProfileDimension
  strengths: ProfileDimension
  skills: ProfileDimension
  experience: ProfileDimension
  motivations: ProfileDimension
  exchange_count: number
  ready: boolean
}

export interface DiscoveryMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface CareerMatch {
  id: string
  rank: number
  title: string
  fit_score: number
  why: string
  uncertainty_note: string
  salary: string
  remote: string
  demand: string
  source: string
  as_of: string
  chosen: boolean
}

export interface RoadmapStep {
  category: 'study' | 'skill' | 'portfolio'
  title: string
  description: string
}

export interface Roadmap {
  id: string | null
  direction: string | null
  steps: RoadmapStep[]
}

export interface GoalSession {
  name: string
  days: number[]
  scheduledTime: string
  targetMinutes: number
  rationale: string | null
}

export interface GoalMilestone {
  title: string
  dueDate: string
  description: string | null
}

export interface GoalPlan {
  summary: string
  sessions: GoalSession[]
  milestones: GoalMilestone[]
  mindMap: { id: string; parentId: string | null; title: string }[]
  resources: { title: string; type: string; note: string; url: string | null }[]
}

export interface Goal {
  id: string
  title: string
  description: string | null
  target_date: string | null
  weekly_minutes_budget: number | null
  status: string
  plan: GoalPlan
  iterations: number
  warnings: string[]
}

export interface Habit {
  id: string
  name: string
  recurrence: { kind: 'weekly' | 'everyN'; days?: number[]; n?: number; anchor?: string }
  scheduled_time: string
  baseline_minutes: number
  difficulty_level: number
  goal_id: string | null
  archived: boolean
}

export interface Occurrence {
  id: string
  habit_id: string
  habit_name: string
  date: string
  target_minutes: number
  logged_minutes: number
  completed: boolean
  justified_skip: boolean
  skip_reason: string | null
  origin: 'timer' | 'manual' | 'assumed' | null
  status: 'pending' | 'partial' | 'complete' | 'missed' | 'skipped'
  percent: number
  points: number
  xp: number
}

export interface LevelInfo {
  level: number
  title: string
  current_xp: number
  level_floor: number
  level_ceiling: number
  xp_to_next: number
  progress: number
}

export interface StreakInfo {
  current: number
  longest: number
}

export interface DifficultyProposal {
  habit_id: string
  habit_name: string
  direction: 'raise' | 'hold' | 'reduce'
  current_level: number
  proposed_level: number
  current_target: number
  proposed_target: number
  rationale: string
}

export interface WeeklyReview {
  completion_pct: number
  total_points: number
  scheduled: number
  completed: number
  worst_weekday: number | null
  proposals: DifficultyProposal[]
}

export interface DashboardData {
  level: LevelInfo
  streak: StreakInfo
  week_completion_pct: number
  today: Occurrence[]
  top_matches: CareerMatch[]
  chosen_direction: string | null
}

export interface AiStatus {
  provider: 'anthropic' | 'groq'
  model: string
  configured: boolean
}

export interface GoalPlanProgressEvent {
  phase: 'researching' | 'drafting' | 'reviewing' | 'revising'
  iteration: number
  maxIterations: number
}

// ----------------------------------------------------------------------------- calls

export const api = {
  signIn: (email: string, password: string) => post<User>('/auth/signin', { email, password }),
  register: (email: string, password: string, name: string) => post<User>('/auth/register', { email, password, name }),
  me: () => get<User>('/auth/me'),
  setConsent: (consent_given: boolean, persona: string) => post<User>('/auth/consent', { consent_given, persona }),
  signOut: () => post<{ ok: boolean }>('/auth/signout'),
  setLanguage: (language: 'en' | 'ar') => put<User>('/auth/language', { language }),
  deleteAccount: () => del<void>('/auth/account'),

  uploadCv: async (file: File) => {
    const form = new FormData()
    form.append('file', file)
    const res = await fetch(`${BASE}/career/cv`, { method: 'POST', credentials: 'include', body: form })
    if (!res.ok) throw new ApiError(res.statusText, res.status)
    return res.json() as Promise<{ text: string; truncated: boolean; ok: boolean; error: string | null }>
  },

  startDiscovery: (persona?: string | null) => post<DiscoveryMessage>('/career/discovery/start', { persona }),
  discoveryMessages: () => get<DiscoveryMessage[]>('/career/discovery/messages'),
  discoveryProfile: () => get<DiscoveryProfile>('/career/discovery/profile'),
  sendDiscoveryMessage: (message: string, handlers: { onChunk: (text: string) => void; onDone: (profile: DiscoveryProfile) => void }) =>
    streamSSE('/career/discovery/send', { message }, {
      chunk: (d) => handlers.onChunk(d.text),
      done: (d) => handlers.onDone(d),
    }),

  runAssessment: (handlers: { onChunk: (text: string) => void; onDone: (text: string) => void }) =>
    streamSSE('/career/assessment', {}, { chunk: (d) => handlers.onChunk(d.text), done: (d) => handlers.onDone(d.text) }),
  getAssessment: () => get<{ text: string | null }>('/career/assessment'),

  generateMatches: () => post<CareerMatch[]>('/career/matches/generate'),
  listMatches: () => get<CareerMatch[]>('/career/matches'),
  chooseDirection: (match_id: string) => post<{ ok: boolean }>('/career/matches/choose', { match_id }),

  generateRoadmap: () => post<Roadmap>('/career/roadmap/generate'),
  getRoadmap: () => get<Roadmap>('/career/roadmap'),

  mentorMessages: () => get<DiscoveryMessage[]>('/career/mentor/messages'),
  sendMentorMessage: (message: string, match_id: string | null, handlers: { onChunk: (text: string) => void; onDone: (text: string) => void }) =>
    streamSSE('/career/mentor/chat', { message, match_id }, { chunk: (d) => handlers.onChunk(d.text), done: (d) => handlers.onDone(d.text) }),

  reportPdfUrl: () => `${BASE}/career/report.pdf`,

  planGoal: (
    body: { title: string; description?: string | null; target_date?: string | null; weekly_minutes_budget?: number | null; roadmap_step_title?: string | null },
    handlers: { onProgress: (e: GoalPlanProgressEvent) => void; onDone: (goal: { id: string; plan: GoalPlan; iterations: number; warnings: string[] }) => void; onError: (message: string) => void },
  ) =>
    streamSSE('/goals/plan', body, {
      progress: (d) => handlers.onProgress(d),
      done: (d) => handlers.onDone(d),
      error: (d) => handlers.onError(d.message),
    }),
  listGoals: () => get<Goal[]>('/goals'),
  commitGoal: (goal_id: string) => post<Habit[]>('/goals/commit', { goal_id }),

  createHabit: (body: { name: string; recurrence: object; scheduled_time?: string; baseline_minutes?: number; goal_id?: string | null }) =>
    post<Habit>('/habits', body),
  listHabits: () => get<Habit[]>('/habits'),
  todayHabits: () => get<Occurrence[]>('/habits/today'),
  weekHabits: () => get<Occurrence[]>('/habits/week'),
  logOccurrence: (id: string, body: { minutes?: number; completed?: boolean; origin?: string }) => post<Occurrence>(`/habits/occurrences/${id}/log`, body),
  skipOccurrence: (id: string, reason: string) => post<Occurrence>(`/habits/occurrences/${id}/skip`, { reason }),
  weeklyReview: () => get<WeeklyReview>('/habits/review'),
  acceptDifficulty: (habit_id: string, accept: boolean) => post<Habit>('/habits/review/accept', { habit_id, accept }),
  progress: () => get<{ level: LevelInfo; streak: StreakInfo; total_xp: number }>('/habits/progress'),

  dashboard: () => get<DashboardData>('/dashboard'),

  aiStatus: () => get<AiStatus>('/settings/ai-status'),
}
