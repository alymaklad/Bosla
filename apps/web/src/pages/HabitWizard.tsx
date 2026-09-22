import { AlertTriangle, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { api, type GoalPlanProgressEvent, type GoalPlan } from '../api'
import { Chip } from '../components/Card'

const PHASE_LABEL: Record<GoalPlanProgressEvent['phase'], string> = {
  researching: 'Researching resources and pacing…',
  drafting: 'Drafting your weekly plan…',
  revising: 'Revising the plan…',
  reviewing: 'Checking for schedule conflicts and dead links…',
}

const DAY = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function HabitWizard() {
  const location = useLocation() as { state?: { title?: string; description?: string } }
  const [title, setTitle] = useState(location.state?.title ?? '')
  const [description, setDescription] = useState(location.state?.description ?? '')
  const [targetDate, setTargetDate] = useState('')
  const [weeklyMinutes, setWeeklyMinutes] = useState(120)
  const [progress, setProgress] = useState<GoalPlanProgressEvent | null>(null)
  const [result, setResult] = useState<{ id: string; plan: GoalPlan; iterations: number; warnings: string[] } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [committing, setCommitting] = useState(false)
  const navigate = useNavigate()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setResult(null)
    setProgress({ phase: 'researching', iteration: 1, maxIterations: 3 })
    try { await api.planGoal(
      { title, description: description || null, target_date: targetDate || null, weekly_minutes_budget: weeklyMinutes || null },
      {
        onProgress: setProgress,
        onDone: (r) => {
          setResult(r)
          setProgress(null)
        },
        onError: (message) => {
          setError(message)
          setProgress(null)
        },
      },
    ) } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not build a plan. Check your connection and retry.')
      setProgress(null)
    }
  }

  async function addToWeek() {
    if (!result) return
    setCommitting(true)
    try {
      await api.commitGoal(result.id)
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add this plan to your week. Please retry.')
    } finally {
      setCommitting(false)
    }
  }

  if (progress) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-3 px-6 text-center">
        <Sparkles className="animate-pulse text-indigo-brand" size={28} />
        <p className="text-[15px] font-medium">{PHASE_LABEL[progress.phase]}</p>
        <p className="text-[13px] text-text-3">
          Attempt {progress.iteration} of {progress.maxIterations}
        </p>
      </div>
    )
  }

  if (result) {
    return (
      <main className="mx-auto w-full max-w-2xl px-4 py-6 md:px-6 md:py-8">
        <h1 className="text-[24px] font-semibold">Here's the plan</h1>
        <p className="mt-1 text-[14px] text-text-2">{result.plan.summary}</p>

        {result.warnings.length > 0 && (
          <div className="mt-4 flex gap-2 rounded-card border border-amber-brand bg-amber-tint p-3 text-[13px] text-[#92400e]">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <ul className="space-y-1">
              {result.warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>
        )}

        <h2 className="mt-5 text-[14px] font-semibold">Sessions</h2>
        <ul className="mt-2 space-y-2">
          {result.plan.sessions.map((s, i) => (
            <li key={i} className="rounded-card border border-line bg-white p-3">
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-medium">{s.name}</span>
                <span className="text-[12px] text-text-3">{s.targetMinutes}m</span>
              </div>
              <div className="mt-1 flex flex-wrap gap-1">
                {s.days.map((d) => (
                  <Chip key={d} tone="neutral">
                    {DAY[d]} {s.scheduledTime}
                  </Chip>
                ))}
              </div>
              {s.rationale && <p className="mt-1 text-[12px] text-text-3">{s.rationale}</p>}
            </li>
          ))}
        </ul>

        <h2 className="mt-5 text-[14px] font-semibold">Milestones</h2>
        <ul className="mt-2 space-y-1.5">
          {result.plan.milestones.map((m, i) => (
            <li key={i} className="flex justify-between text-[13px]">
              <span>{m.title}</span>
              <span className="text-text-3">{m.dueDate}</span>
            </li>
          ))}
        </ul>

        {result.plan.resources.length > 0 && (
          <>
            <h2 className="mt-5 text-[14px] font-semibold">Resources</h2>
            <ul className="mt-2 space-y-1.5">
              {result.plan.resources.map((r, i) => (
                <li key={i} className="text-[13px]">
                  <span className="font-medium">[{r.type}]</span> {r.title}
                  {r.url && (
                    <a href={r.url} target="_blank" rel="noreferrer" className="ml-1 text-indigo-brand">
                      link
                    </a>
                  )}
                  <span className="text-text-3"> — {r.note}</span>
                </li>
              ))}
            </ul>
          </>
        )}

        <button
          type="button"
          disabled={committing}
          onClick={addToWeek}
          className="mt-6 h-11 w-full rounded-card bg-ink text-[15px] font-medium text-white hover:bg-ink-hover disabled:opacity-60"
        >
          {committing ? 'Adding…' : 'Add to my week'}
        </button>
        {error && <p role="alert" className="mt-2 text-[13px] text-danger">{error}</p>}
      </main>
    )
  }

  return (
    <main className="mx-auto w-full max-w-lg px-4 py-6 md:px-6 md:py-8">
      <h1 className="text-[24px] font-semibold">Turn a step into a habit</h1>
      <p className="mt-1 text-[14px] text-text-2">Bosla researches, drafts a weekly plan, then checks it against your calendar.</p>

      <form onSubmit={submit} className="mt-5 space-y-3">
        <div>
          <label className="text-[13px] font-medium text-text-2">Goal</label>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 h-10 w-full rounded-card border border-line px-3 text-[14px] outline-none focus:border-ink"
            placeholder="e.g. Learn the basics of ROS"
          />
        </div>
        <div>
          <label className="text-[13px] font-medium text-text-2">Any context? (optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-card border border-line px-3 py-2 text-[14px] outline-none focus:border-ink"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[13px] font-medium text-text-2">Target date (optional)</label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="mt-1 h-10 w-full rounded-card border border-line px-3 text-[14px] outline-none focus:border-ink"
            />
          </div>
          <div>
            <label className="text-[13px] font-medium text-text-2">Weekly minutes</label>
            <input
              type="number"
              min={15}
              step={15}
              value={weeklyMinutes}
              onChange={(e) => setWeeklyMinutes(Number(e.target.value))}
              className="mt-1 h-10 w-full rounded-card border border-line px-3 text-[14px] outline-none focus:border-ink"
            />
          </div>
        </div>
        {error && <p className="text-[13px] text-danger">{error}</p>}
        <button type="submit" className="h-11 w-full rounded-card bg-ink text-[15px] font-medium text-white hover:bg-ink-hover">
          Build my plan
        </button>
      </form>
    </main>
  )
}
