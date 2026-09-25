import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { api, type GoalPlan, type GoalPlanProgressEvent } from '../api'
import { ErrorToast } from '../components/ErrorToast'

const PHASE_LABEL: Record<GoalPlanProgressEvent['phase'], string> = {
  researching: 'Researching curriculum resources and pacing…',
  drafting: 'Drafting your weekly habit schedule…',
  revising: 'Optimizing session distribution…',
  reviewing: 'Validating against schedule conflicts and verifying links…',
}

const DAY_NAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']

export function HabitWizard() {
  const location = useLocation() as { state?: { title?: string; description?: string } }
  const [title, setTitle] = useState(location.state?.title ?? 'Practice SQL')
  const [description, setDescription] = useState(
    location.state?.description ?? 'Focus on window functions and aggregations',
  )
  const [targetDate, setTargetDate] = useState('2026-12-12')
  const [weeklyMinutes, setWeeklyMinutes] = useState(90)
  const [progress, setProgress] = useState<GoalPlanProgressEvent | null>(null)
  const [result, setResult] = useState<{
    id: string
    plan: GoalPlan
    iterations: number
    warnings: string[]
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [committing, setCommitting] = useState(false)
  const [editingParams, setEditingParams] = useState(!location.state?.title)
  const navigate = useNavigate()

  async function generatePlan(e?: React.FormEvent) {
    if (e) e.preventDefault()
    setError(null)
    setEditingParams(false)
    setProgress({ phase: 'researching', iteration: 1, maxIterations: 3 })

    try {
      await api.planGoal(
        {
          title,
          description: description || null,
          target_date: targetDate || null,
          weekly_minutes_budget: weeklyMinutes || null,
        },
        {
          onProgress: setProgress,
          onDone: (r) => {
            setResult(r)
            setProgress(null)
          },
          onError: (msg) => {
            setError(msg)
            setProgress(null)
          },
        },
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not build plan. Please retry.')
      setProgress(null)
    }
  }

  async function addToWeek() {
    if (!result) return
    setCommitting(true)
    setError(null)
    try {
      const habits = await api.commitGoal(result.id)
      let notice = `${habits.length} weekly habit${habits.length === 1 ? '' : 's'} saved. Complete each scheduled session from this page.`
      try {
        const sync = await api.googleSyncStatus()
        if (sync.connected) {
          const synced = await api.syncGoogle()
          const calendarCount = synced.created_events + synced.updated_events
          const taskCount = synced.created_tasks + synced.updated_tasks
          notice += ` Synced ${calendarCount} Calendar event${calendarCount === 1 ? '' : 's'} and ${taskCount} Google Task${taskCount === 1 ? '' : 's'}.`
        } else if (sync.configured) {
          notice += ' Connect Google Calendar and Tasks in Settings to mirror these sessions.'
        }
      } catch {
        notice += ' Habits were saved; Google sync can be retried from Settings.'
      }
      navigate('/habits', { state: { scope: 'week', notice } })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not commit plan. Please retry.')
    } finally {
      setCommitting(false)
    }
  }

  return (
    <main className="mx-auto w-full max-w-[1280px] px-6 py-8">
      {/* Top Stepper Timeline Bar */}
      <div className="mx-auto mb-8 flex max-w-[880px] items-center justify-between border-b border-[#E6E7EA] pb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-body text-[12px] font-medium text-[#1E3A8A]">
            <span className="material-symbols-outlined text-[16px] text-[#1E3A8A]">check</span>
            <span>Target Definition</span>
          </div>
          <div className="h-px w-6 bg-[#E6E7EA]" />
          <div className="flex items-center gap-1.5 font-body text-[12px] font-medium text-[#1E3A8A]">
            <span className="material-symbols-outlined text-[16px] text-[#1E3A8A]">check</span>
            <span>Drafting</span>
          </div>
          <div className="h-px w-6 bg-[#E6E7EA]" />
          <div className="flex items-center gap-2 font-body text-[12px] text-[#0F1115]">
            <span className="h-2 w-2 rounded-full bg-[#1E3A8A]" />
            <span className="font-medium text-[#0F1115]">Reviewing</span>
            <span className="text-[#5B6270]">
              {progress ? `(${progress.phase})` : '(iteration 2 of 3)'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#1E3A8A]" />
          <span className="h-1.5 w-1.5 rounded-full bg-[#1E3A8A]" />
          <span className="h-1.5 w-1.5 rounded-full bg-[#E6E7EA]" />
        </div>
      </div>

      {/* Main 880px Card Container */}
      <div className="mx-auto flex w-full max-w-[880px] flex-col gap-6 rounded-lg border border-[#E6E7EA] bg-white p-6 md:flex-row">
        {/* Step 1: Left Column (Summary / Edit Form ~260px) */}
        <aside className="flex w-full flex-shrink-0 flex-col justify-between border-b border-[#E6E7EA] pb-6 md:w-[260px] md:border-r md:border-b-0 md:pr-6 md:pb-0">
          <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <span className="font-body text-[11px] uppercase tracking-wider text-[#5B6270]">
                STEP 1: TARGET DEFINITION
              </span>
              <span className="material-symbols-outlined text-[16px] text-[#16A34A]">
                check_circle
              </span>
            </div>

            {editingParams ? (
              <form onSubmit={generatePlan} className="space-y-4">
                <div>
                  <label className="block font-body text-[11px] font-medium uppercase text-[#5B6270]">
                    Goal Name
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="mt-1 h-9 w-full rounded border border-[#E6E7EA] px-2.5 font-body text-[13px] outline-none focus:border-[#1E3A8A]"
                  />
                </div>
                <div>
                  <label className="block font-body text-[11px] font-medium uppercase text-[#5B6270]">
                    Target Date
                  </label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="mt-1 h-9 w-full rounded border border-[#E6E7EA] px-2.5 font-body text-[13px] outline-none focus:border-[#1E3A8A]"
                  />
                </div>
                <div>
                  <label className="block font-body text-[11px] font-medium uppercase text-[#5B6270]">
                    Weekly Budget (Minutes)
                  </label>
                  <input
                    type="number"
                    min={30}
                    step={15}
                    value={weeklyMinutes}
                    onChange={(e) => setWeeklyMinutes(Number(e.target.value))}
                    className="mt-1 h-9 w-full rounded border border-[#E6E7EA] px-2.5 font-body text-[13px] outline-none focus:border-[#1E3A8A]"
                  />
                </div>
                <div>
                  <label className="block font-body text-[11px] font-medium uppercase text-[#5B6270]">
                    Description / Focus
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="mt-1 w-full rounded border border-[#E6E7EA] p-2.5 font-body text-[13px] outline-none focus:border-[#1E3A8A]"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded bg-[#0F1115] py-2 font-body text-[13px] font-medium text-white hover:bg-[#1C1F26]"
                >
                  Regenerate plan
                </button>
              </form>
            ) : (
              <>
                <div className="flex flex-col gap-1 border-b border-[#E6E7EA] pb-3">
                  <span className="font-body text-[11px] text-[#5B6270]">Goal</span>
                  <span className="font-display text-[18px] font-semibold text-[#0F1115]">
                    {title}
                  </span>
                </div>
                <div className="space-y-3.5">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-body text-[11px] text-[#5B6270]">Target date</span>
                    <span className="font-body text-[14px] font-medium text-[#0F1115]">
                      {targetDate || 'Flexible'}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-body text-[11px] text-[#5B6270]">Weekly budget</span>
                    <span className="font-body text-[14px] font-medium text-[#0F1115]">
                      {Math.floor(weeklyMinutes / 60)}h {weeklyMinutes % 60}m
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-body text-[11px] text-[#5B6270]">Cadence</span>
                    <span className="font-body text-[14px] font-medium text-[#0F1115]">
                      3 sessions / week
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>

          {!editingParams && (
            <div className="pt-6">
              <button
                type="button"
                onClick={() => setEditingParams(true)}
                className="flex h-9 w-full items-center justify-center gap-1.5 rounded border border-[#E6E7EA] font-body text-[13px] font-medium text-[#0F1115] transition-colors hover:bg-[#FAFAF8]"
              >
                <span className="material-symbols-outlined text-[16px]">edit</span>
                <span>Edit parameters</span>
              </button>
            </div>
          )}
        </aside>

        {/* Step 2: Main Column (~540px) */}
        <section className="flex flex-1 flex-col gap-6">
          {progress ? (
            <div className="flex min-h-[360px] flex-col items-center justify-center gap-3 text-center">
              <span className="material-symbols-outlined animate-spin text-[32px] text-[#1E3A8A]">
                refresh
              </span>
              <p className="font-display text-[18px] font-semibold text-[#0F1115]">
                {PHASE_LABEL[progress.phase]}
              </p>
              <p className="font-body text-[13px] text-[#5B6270]">
                Synthesis pass {progress.iteration} of {progress.maxIterations}
              </p>
            </div>
          ) : result ? (
            <>
              {/* Header */}
              <div className="flex flex-col gap-1">
                <h1 className="font-display text-[22px] font-semibold tracking-tight text-[#0F1115]">
                  Your weekly habit draft — save it when it looks right
                </h1>
                <p className="font-body text-[14px] text-[#5B6270]">
                  {result.plan.summary ||
                    'Bosla synthesized your schedule, cognitive peak hours, and curriculum milestones.'}
                </p>
              </div>

              {/* Findings Card (Conflict Alert or Status) */}
              {result.warnings.length > 0 ? (
                <div className="flex flex-col justify-between gap-3 rounded-r border-l-[3px] border-[#F59E0B] bg-[#FEF3C7] p-4 sm:flex-row sm:items-center">
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1.5 font-body text-[14px] font-medium text-[#B45309]">
                      <span className="material-symbols-outlined text-[18px]">warning</span>
                      <span>Review found {result.warnings.length} advisory notice</span>
                    </div>
                    <p className="font-body text-[13px] text-[#78350F]">{result.warnings[0]}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => generatePlan()}
                    className="self-start rounded-lg px-2 py-1 font-body text-[13px] font-medium text-[#1E3A8A] hover:bg-[#E8EDF9] hover:text-[#0F1115] sm:self-center"
                  >
                    Auto-adjust
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-lg border border-[#E6E7EA] bg-[#F0F3FF] p-3 text-[#1E3A8A]">
                  <span className="material-symbols-outlined text-[18px]">verified</span>
                  <span className="font-body text-[13px]">
                    No calendar collisions found. All sessions fit your weekly budget.
                  </span>
                </div>
              )}

              {/* Section: Sessions */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-body text-[12px] font-semibold uppercase tracking-wider text-[#5B6270]">
                    Sessions
                  </h2>
                  <span className="font-body text-[11px] text-[#5B6270]">
                    {result.plan.sessions.length} planned
                  </span>
                </div>
                <div className="divide-y divide-[#E6E7EA] rounded-lg border border-[#E6E7EA] bg-white">
                  {result.plan.sessions.map((s, idx) => {
                    const dayLabel = s.days?.[0] ? DAY_NAMES[s.days[0]] || 'MON' : 'MON'
                    return (
                      <div
                        key={idx}
                        className="flex flex-col justify-between gap-2.5 p-3.5 sm:flex-row sm:items-center"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="rounded bg-[#E2E8F9] px-2 py-0.5 font-body text-[11px] font-medium text-[#1E3A8A]">
                            {dayLabel}
                          </span>
                          <span className="font-body text-[14px] font-medium text-[#0F1115]">
                            {s.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-body text-[12px] text-[#5B6270]">
                            {s.scheduledTime || '18:00'} ({s.targetMinutes} min)
                          </span>
                          <span className="inline-flex items-center gap-1 font-body text-[11px] text-[#16A34A]">
                            <span className="material-symbols-outlined text-[15px]">
                              check_circle
                            </span>
                            <span>Verified</span>
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Section: Milestones */}
              {result.plan.milestones.length > 0 && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <h2 className="font-body text-[12px] font-semibold uppercase tracking-wider text-[#5B6270]">
                      Milestones
                    </h2>
                    <span className="font-body text-[11px] text-[#5B6270]">Curriculum targets</span>
                  </div>
                  <div className="divide-y divide-[#E6E7EA] rounded-lg border border-[#E6E7EA] bg-white">
                    {result.plan.milestones.map((m, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col justify-between gap-2 p-3.5 sm:flex-row sm:items-center"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#1E3A8A]" />
                          <span className="font-body text-[14px] text-[#0F1115]">{m.title}</span>
                        </div>
                        <span className="font-body text-[11px] text-[#5B6270] shrink-0">
                          Target: {m.dueDate || 'Sprint end'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Section: Resources */}
              {result.plan.resources.length > 0 && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <h2 className="font-body text-[12px] font-semibold uppercase tracking-wider text-[#5B6270]">
                      Resources
                    </h2>
                    <span className="font-body text-[11px] text-[#5B6270]">Validated references</span>
                  </div>
                  <div className="divide-y divide-[#E6E7EA] rounded-lg border border-[#E6E7EA] bg-white">
                    {result.plan.resources.map((r, idx) => (
                      <a
                        key={idx}
                        href={r.url ?? `https://www.google.com/search?q=${encodeURIComponent(r.title)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex flex-col justify-between gap-2 p-3.5 transition-colors first:rounded-t-lg last:rounded-b-lg hover:bg-[#F4F7FF] sm:flex-row sm:items-center"
                      >
                        <div className="flex min-w-0 items-center gap-2.5">
                          <span className="material-symbols-outlined text-[16px] text-[#5B6270] group-hover:text-[#1E3A8A]">
                            {r.url ? 'link' : 'search'}
                          </span>
                          <span className="font-body text-[14px] text-[#0F1115] group-hover:text-[#1E3A8A] group-hover:underline underline-offset-2">{r.title}</span>
                          <span className="material-symbols-outlined text-[14px] text-[#8A8F98] opacity-0 transition-opacity group-hover:opacity-100">open_in_new</span>
                        </div>
                        {r.url ? (
                          <span className="inline-flex items-center gap-1 font-body text-[11px] text-[#16A34A] shrink-0">
                            <span className="material-symbols-outlined text-[14px]">check</span>
                            <span>Verified</span>
                          </span>
                        ) : (
                          <span className="font-body text-[11px] text-[#5B6270] shrink-0">Search</span>
                        )}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Bottom Action Bar */}
              <div className="flex items-center justify-end gap-3 border-t border-[#E6E7EA] pt-4">
                <button
                  type="button"
                  onClick={() => setEditingParams(true)}
                  className="h-10 rounded-lg border border-[#0F1115] bg-white px-4 font-body text-[14px] font-medium text-[#0F1115] transition-colors hover:bg-[#FAFAF8]"
                >
                  Edit parameters
                </button>
                <button
                  type="button"
                  disabled={committing}
                  onClick={addToWeek}
                  className="h-10 rounded-lg bg-[#0F1115] px-4 font-body text-[14px] font-medium text-white transition-colors hover:bg-[#1C1F26] disabled:opacity-60"
                >
                  {committing ? 'Saving weekly habits…' : `Save ${result.plan.sessions.length} habits & open week`}
                </button>
              </div>
            </>
          ) : (
            <div className="flex min-h-[300px] flex-col items-center justify-center gap-4 text-center">
              <span className="material-symbols-outlined text-[36px] text-[#1E3A8A]">
                auto_awesome
              </span>
              <div>
                <h3 className="font-display text-[18px] font-semibold text-[#0F1115]">
                  Ready to generate weekly schedule
                </h3>
                <p className="mt-1 max-w-sm font-body text-[13px] text-[#5B6270]">
                  Bosla will distribute {weeklyMinutes} minutes of {title} practice into optimal slots.
                </p>
              </div>
              <button
                type="button"
                onClick={() => generatePlan()}
                className="h-10 rounded-lg bg-[#0F1115] px-6 font-body text-[14px] font-medium text-white transition-colors hover:bg-[#1C1F26]"
              >
                Generate weekly plan
              </button>
            </div>
          )}

          <ErrorToast message={error} onDismiss={() => setError(null)} />
        </section>
      </div>
    </main>
  )
}
