// Requests stay same-origin in both local and production. This prevents mobile
// browsers from treating Bosla's auth cookie as a third-party cookie.
import { notifyOfflineData, readCached, saveCached } from './lib/offlineCache'

const BASE = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/$/, '')
export const apiBaseUrl = BASE

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

function errorDetail(value: unknown, fallback: string): string {
  if (typeof value === 'string') return value
  if (Array.isArray(value)) {
    const messages = value.map((item) => errorDetail(item, '')).filter(Boolean)
    return messages.join(' ') || fallback
  }
  if (value && typeof value === 'object') {
    const detail = value as { msg?: unknown; message?: unknown; detail?: unknown; loc?: unknown }
    const message = errorDetail(detail.msg ?? detail.message ?? detail.detail, '')
    if (message) {
      const field = Array.isArray(detail.loc) ? detail.loc.at(-1) : null
      return typeof field === 'string' && field !== 'body' ? `${field}: ${message}` : message
    }
  }
  return fallback
}

function sanitizeErrorMessage(msg: string): string {
  if (/email.*valid|value is not a valid email/i.test(msg)) return 'Enter a valid email address, such as you@example.com.'
  if (msg === 'no_extractable_text') {
    return 'No readable text was found. If this is a scanned certificate, upload it as a PDF so OCR can read it.'
  }
  if (msg === 'could_not_read_file') return 'This file could not be opened. Try exporting it again as PDF, DOCX, TXT, or MD.'
  if (msg === 'password_protected_pdf') return 'This PDF is password-protected. Remove its password before uploading.'
  if (msg === 'unsupported_file_type') return 'Choose a PDF, DOCX, TXT, or MD document.'
  if (msg === 'ocr_access_denied') {
    return 'Google Vision rejected this OCR request. Enable Cloud Vision API and billing in the key’s Google Cloud project, then allow this server key to call Vision.'
  }
  if (msg === 'ocr_quota_exhausted') {
    return 'Google Vision OCR has reached its quota. Check billing or quota limits, then try again.'
  }
  if (msg === 'ocr_unavailable') {
    return 'OCR is temporarily unavailable. Please retry, or upload a PDF with selectable text.'
  }
  if (msg === 'ocr_returned_no_text') {
    return 'OCR could not find readable text in this PDF. Try a clearer scan or a text-based PDF.'
  }
  if (/GROQ|ANTHROPIC|API_KEY|not configured|recharge your|Add credits/i.test(msg)) {
    return 'Credit limit reached. Please try again later.'
  }
  return msg
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const isRead = !init?.method || init.method === 'GET'
  if (!isRead && !navigator.onLine) {
    throw new ApiError('You are offline. Reconnect before saving changes.', 0)
  }
  if (isRead && !navigator.onLine) {
    const cached = path === '/auth/me' ? null : readCached<T>(path)
    notifyOfflineData(cached?.savedAt)
    if (cached) return cached.value
    throw new ApiError('You are offline, and this page has no saved snapshot yet.', 0)
  }
  let res: Response
  try {
    res = await fetch(`${BASE}${path}`, {
      credentials: 'include',
      headers: init?.body instanceof FormData ? undefined : { 'Content-Type': 'application/json' },
      ...init,
      signal: init?.signal ?? (isRead ? AbortSignal.timeout(8_000) : undefined),
    })
  } catch {
    if (isRead && path !== '/auth/me') {
      const cached = readCached<T>(path)
      if (cached) {
        notifyOfflineData(cached.savedAt)
        return cached.value
      }
    }
    notifyOfflineData()
    throw new ApiError('Bosla cannot connect right now. Check your connection and retry.', 0)
  }
  if (isRead && res.status >= 500) {
    const cached = path === '/auth/me' ? null : readCached<T>(path)
    notifyOfflineData(cached?.savedAt)
    if (cached) return cached.value
    throw new ApiError('Bosla cannot connect right now. Check your connection and retry.', res.status)
  }
  if (!res.ok) {
    let message = res.statusText
    try {
      const body = await res.json()
      message = errorDetail(body.detail, message)
    } catch {
      /* ignore */
    }
    throw new ApiError(sanitizeErrorMessage(message), res.status)
  }
  if (res.status === 204) return undefined as T
  const value = await res.json() as T
  if (isRead && path !== '/auth/me') saveCached(path, value)
  return value
}

function get<T>(path: string) {
  return request<T>(path)
}
function post<T>(path: string, body?: unknown) {
  return request<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) })
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
  if (!navigator.onLine) throw new ApiError('You are offline. Reconnect before sending a message.', 0)
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  })
  if (!res.ok || !res.body) {
    let message = res.statusText
    try {
      message = errorDetail((await res.json()).detail, message)
    } catch {
      /* ignore */
    }
    throw new ApiError(sanitizeErrorMessage(message), res.status)
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
      if (event === 'error') {
        let message = 'AI service is temporarily unavailable. Please try again.'
        try {
          const parsed = JSON.parse(data)
          if (typeof parsed?.message === 'string') message = parsed.message
        } catch {
          message = data
        }
        const errorHandler = handlers.error
        if (errorHandler) {
          errorHandler({ message: sanitizeErrorMessage(message) })
          continue
        }
        throw new ApiError(sanitizeErrorMessage(message), 503)
      }
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
  consent_given: boolean
}

export interface OnboardingStatus {
  consentGiven: boolean
  discoveryReady: boolean
  matchesGenerated: boolean
  nextPath: string
  completed: boolean
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
  location: string
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
  done: boolean
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

export interface Todo {
  id: string
  title: string
  due_date: string
  completed: boolean
  goal_id: string | null
  occurrence_id: string | null
  carried_forward: boolean
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
  next_title?: string
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
  completion_pct: number
}

export interface WeeklyReviewDay {
  date: string
  /** ISO weekday: Monday = 1 … Sunday = 7. */
  weekday: number
  logged_minutes: number
  target_minutes: number
  sessions: number
  completed: number
  future: boolean
}

export interface WeeklyReview {
  week_offset: number
  week_start: string
  week_end: string
  completion_pct: number
  completed: number
  /** Sessions that can be judged: already due and not skipped with a reason. */
  scheduled: number
  skipped: number
  upcoming: number
  total_points: number
  logged_minutes: number
  active_days: number
  longest_streak: number
  worst_weekday: number | null
  worst_weekday_pct: number | null
  days: WeeklyReviewDay[]
  proposals: DifficultyProposal[]
}

export interface DashboardData {
  level: LevelInfo
  streak: StreakInfo
  week_completion_pct: number
  week_completed: number
  week_scheduled: number
  today: Occurrence[]
  top_matches: CareerMatch[]
  chosen_direction: string | null
}

export interface AiStatus {
  provider: 'anthropic' | 'groq'
  model: string
  primary_model?: string
  fallback_models?: string[]
  configured: boolean
}

export interface ProgressStats {
  completed_occurrences: number
  logged_minutes: number
  morning_completed: number
  active_habits: number
  today_due: number
  today_completed: number
}

export interface HabitProgress {
  level: LevelInfo
  streak: StreakInfo
  total_xp: number
  stats: ProgressStats
}

export interface GoogleSyncStatus {
  configured: boolean
  configuration_error: string | null
  connected: boolean
  scopes: string[]
  last_sync_at: string | null
}

export interface GoogleSyncResult {
  occurrences: number
  created_tasks: number
  updated_tasks: number
  created_events: number
  updated_events: number
  imported_completions: number
  last_sync_at: string
}

export interface GooglePullResult {
  imported_completions: number
  pushed_completions: number
  created_tasks: number
  last_sync_at: string
}

/** Fired on window when habit completions change outside the current page (e.g. from Google). */
export const HABITS_CHANGED_EVENT = 'bosla:habits-changed'

export type DocumentSourceType = 'cv' | 'resume' | 'recommendation' | 'certificate' | 'project' | 'thoughts' | 'journal' | 'other'

export interface PersonalDocument {
  id: string
  source_type: DocumentSourceType
  filename: string
  mime_type: string
  source_url: string | null
  char_count: number
  chunk_count: number
  extraction_method: 'native' | 'ocr' | 'github'
  status: 'ready' | 'failed'
  error: string | null
  created_at: string
  text?: string | null
  truncated?: boolean
  ok: boolean
}

export interface OcrStatus {
  configured: boolean
  provider: string | null
}

export interface GithubImportResult {
  profile_url: string
  repositories_imported: number
  repositories_skipped: number
  sources_indexed: number
  chunks_created: number
  files_skipped: number
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
  deleteAccount: () => del<void>('/auth/account'),

  uploadDocument: async (file: File, documentType: DocumentSourceType, originalFilename?: string): Promise<PersonalDocument> => {
    if (!navigator.onLine) throw new ApiError('You are offline. Reconnect before uploading a document.', 0)
    const form = new FormData()
    form.append('file', file)
    form.append('document_type', documentType)
    if (originalFilename) form.append('original_filename', originalFilename)
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 90_000)
    let res: Response
    try {
      res = await fetch(`${BASE}/career/documents`, { method: 'POST', credentials: 'include', body: form, signal: controller.signal })
    } catch {
      if (controller.signal.aborted) throw new ApiError('Document processing took too long. Refresh your saved sources before retrying.', 408)
      throw new ApiError('Could not reach Bosla to upload this document. Check your connection and try again.', 0)
    } finally {
      window.clearTimeout(timeout)
    }
    if (!res.ok) {
      let message = res.status === 413
        ? 'This file is too large for the upload service. Try a smaller or compressed PDF.'
        : res.statusText || `Upload failed (HTTP ${res.status}). Please try again.`
      try {
        const body = await res.json()
        message = errorDetail(body.detail ?? body.error, message) || message
      } catch {
        /* ignore */
      }
      throw new ApiError(sanitizeErrorMessage(message), res.status)
    }
    const body = await res.json() as PersonalDocument & { document: PersonalDocument | null }
    if (!body.document) throw new ApiError(sanitizeErrorMessage(body.error || 'Could not extract text from this document.'), 422)
    return body.document
  },
  uploadCv: (file: File) => api.uploadDocument(file, 'cv'),
  listDocuments: () => get<PersonalDocument[]>('/career/documents'),
  ocrStatus: () => get<OcrStatus>('/career/documents/ocr-status'),
  deleteDocument: (id: string) => del<void>(`/career/documents/${id}`),
  deleteAllDocuments: () => del<void>('/career/documents'),
  importGithubProfile: (profile_url: string) => post<GithubImportResult>('/career/sources/github', { profile_url }),

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
  setRoadmapStepDone: (index: number, done: boolean) => post<Roadmap>(`/career/roadmap/steps/${index}/done`, { done }),

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
  deleteGoal: (goal_id: string) => del<void>(`/goals/${goal_id}`),

  createHabit: (body: { name: string; recurrence: object; scheduled_time?: string; baseline_minutes?: number; goal_id?: string | null }) =>
    post<Habit>('/habits', body),
  listHabits: () => get<Habit[]>('/habits'),
  todayHabits: () => get<Occurrence[]>('/habits/today'),
  weekHabits: () => get<Occurrence[]>('/habits/week'),
  listTodos: (day?: string) => get<Todo[]>(`/habits/todos${day ? `?day=${encodeURIComponent(day)}` : ''}`),
  createTodo: (body: { title: string; due_date?: string; goal_id?: string; occurrence_id?: string }) => post<Todo>('/habits/todos', body),
  setTodoCompletion: (id: string, completed: boolean) => post<Todo>(`/habits/todos/${id}/completion`, { completed }),
  deleteTodo: (id: string) => del<void>(`/habits/todos/${id}`),
  logOccurrence: (id: string, body: { minutes?: number; completed?: boolean; origin?: string }) => post<Occurrence>(`/habits/occurrences/${id}/log`, body),
  skipOccurrence: (id: string, reason: string) => post<Occurrence>(`/habits/occurrences/${id}/skip`, { reason }),
  weeklyReview: (week = 0) => get<WeeklyReview>(`/habits/review?week=${week}`),
  acceptDifficulty: (habit_id: string, accept: boolean) => post<Habit>('/habits/review/accept', { habit_id, accept }),
  progress: () => get<HabitProgress>('/habits/progress'),

  dashboard: () => get<DashboardData>('/dashboard'),

  aiStatus: () => get<AiStatus>('/settings/ai-status'),
  googleSyncStatus: () => get<GoogleSyncStatus>('/integrations/google/status'),
  googleSyncStartUrl: () => `${BASE}/integrations/google/start`,
  syncGoogle: () => post<GoogleSyncResult>('/integrations/google/sync'),
  pullGoogle: () => post<GooglePullResult>('/integrations/google/pull'),
  disconnectGoogle: () => del<void>('/integrations/google'),
}
