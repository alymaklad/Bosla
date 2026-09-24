import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { api, HABITS_CHANGED_EVENT, type Occurrence } from '../api'
import { PageLoading } from '../components/PageLoading'

export function TodayHabits() {
  const location = useLocation() as { state?: { scope?: 'week'; notice?: string } }
  const [occs, setOccs] = useState<Occurrence[] | null>(null)
  const [scope, setScope] = useState<'today' | 'week'>(location.state?.scope === 'week' ? 'week' : 'today')
  const [notice] = useState<string | null>(location.state?.notice ?? null)
  const [error, setError] = useState<string | null>(null)
  const [currentStreak, setCurrentStreak] = useState(0)
  const [activeTimerId, setActiveTimerId] = useState<string | null>(null)
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [timerRunning, setTimerRunning] = useState(false)
  const [skippingId, setSkippingId] = useState<string | null>(null)
  const [skipReason, setSkipReason] = useState('')
  const [loggingId, setLoggingId] = useState<string | null>(null)
  const [manualMinutes, setManualMinutes] = useState(20)
  const [loading, setLoading] = useState(true)

  const timerRef = useRef<number | null>(null)

  const load = async (quiet = false) => {
    if (!quiet) setLoading(true)
    try {
      setError(null)
      const [items, progress] = await Promise.all([
        scope === 'week' ? api.weekHabits() : api.todayHabits(),
        api.progress(),
      ])
      setOccs(items)
      setCurrentStreak(progress.streak.current)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load your habits. Please refresh and try again.')
      setOccs([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    const refresh = () => void load(true)
    window.addEventListener(HABITS_CHANGED_EVENT, refresh)
    return () => window.removeEventListener(HABITS_CHANGED_EVENT, refresh)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope])

  useEffect(() => {
    if (timerRunning) {
      timerRef.current = window.setInterval(() => {
        setTimerSeconds((s) => s + 1)
      }, 1000)
    } else if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [timerRunning])

  async function toggle(o: Occurrence) {
    try {
      await api.logOccurrence(o.id, { completed: o.status !== 'complete' })
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update this habit.')
    }
  }

  async function finishTimer(id: string) {
    try {
      const minutes = Math.max(1, Math.round(timerSeconds / 60))
      await api.logOccurrence(id, { minutes, origin: 'timer', completed: true })
      setActiveTimerId(null)
      setTimerRunning(false)
      setTimerSeconds(0)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the timer result.')
    }
  }

  async function submitSkip(id: string) {
    if (!skipReason.trim()) return
    try {
      await api.skipOccurrence(id, skipReason.trim())
      setSkippingId(null)
      setSkipReason('')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not skip this habit.')
    }
  }

  async function submitLog(id: string) {
    try {
      await api.logOccurrence(id, { minutes: manualMinutes, origin: 'manual', completed: true })
      setLoggingId(null)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save those minutes.')
    }
  }

  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date())

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  if (loading) return <PageLoading label="Loading your habit cadence…" />

  return (
    <main className="mx-auto w-full max-w-[1280px] px-6 py-8">
      {/* Header Section */}
      <div className="mb-7 flex flex-col justify-between gap-5 border-b border-[#E6E7EA] pb-6 sm:flex-row sm:items-end">
        <div>
          <p className="font-body text-[11px] font-semibold uppercase tracking-[0.12em] text-[#1E3A8A]">Habit cadence</p>
          <h1 className="mt-2 font-display text-[30px] font-bold tracking-tight text-[#0F1115] md:text-[35px]">{todayFormatted}</h1>
          <p className="mt-2 font-body text-[13px] text-[#5B6270]">{scope === 'today' ? 'Your scheduled practice for today.' : 'Your scheduled practice for this week.'}</p>
        </div>

        {/* Segmented Scope Control */}
        <div className="inline-flex rounded-lg border border-[#E6E7EA] bg-white p-0.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setScope('today')}
            className={`rounded-md px-3 py-1.5 font-body text-[13px] font-medium transition-colors ${
              scope === 'today'
                ? 'bg-[#0F1115] text-white'
                : 'text-[#5B6270] hover:text-[#0F1115]'
            }`}
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setScope('week')}
            className={`rounded-md px-3 py-1.5 font-body text-[13px] font-medium transition-colors ${
              scope === 'week'
                ? 'bg-[#0F1115] text-white'
                : 'text-[#5B6270] hover:text-[#0F1115]'
            }`}
          >
            Week
          </button>
        </div>
      </div>

      {notice && <p className="mb-6 rounded-lg border border-[#BBF7D0] bg-[#F0FDF4] px-4 py-3 font-body text-[13px] text-[#166534]">{notice}</p>}
      {error && <p className="mb-6 rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 font-body text-[13px] text-[#B91C1C]">{error}</p>}

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        {/* Left Column: Habit Directives (8 cols) */}
        <div className="space-y-4 lg:col-span-8">
          {/* Active Timer Card (shown if timer is running or active) */}
          {activeTimerId && (
            <article className="rounded-lg border border-[#E6E7EA] bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-5 w-5 items-center justify-center rounded border-2 border-[#1E3A8A] bg-[#E8EDF9]">
                    <span className="h-2 w-2 rounded-sm bg-[#1E3A8A]" />
                  </div>
                  <div>
                    <h2 className="font-display text-[18px] font-semibold text-[#0F1115]">
                      {occs?.find((o) => o.id === activeTimerId)?.habit_name || 'Active Session'}
                    </h2>
                    <span className="font-body text-[13px] text-[#5B6270]">Target: 30 min</span>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FEF3C7] px-2 py-0.5 font-body text-[11px] text-[#B45309]">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#F59E0B]" />
                  In progress
                </span>
              </div>

              {/* Stopwatch display */}
              <div className="rounded-lg border border-[#DCE2F3] bg-[#F0F3FF] p-4">
                <div className="mb-3 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <div className="mb-1 inline-flex items-center gap-1.5 font-body text-[11px] text-[#1E3A8A]">
                      <span className="material-symbols-outlined text-[15px]">timer</span>
                      Measured by timer
                    </div>
                    <div className="font-display text-[38px] font-bold tracking-tight text-[#0F1115] tabular-nums">
                      {formatTimer(timerSeconds)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => finishTimer(activeTimerId)}
                      className="h-10 rounded-lg bg-[#0F1115] px-4 font-body text-[13px] font-medium text-white transition-colors hover:bg-[#1C1F26]"
                    >
                      Done
                    </button>
                    <button
                      type="button"
                      onClick={() => setTimerRunning((r) => !r)}
                      className="h-10 rounded-lg border border-[#E6E7EA] bg-white px-4 font-body text-[13px] font-medium text-[#0F1115] transition-colors hover:border-[#0F1115]"
                    >
                      {timerRunning ? 'Pause' : 'Resume'}
                    </button>
                  </div>
                </div>
                <p className="font-body text-[12px] text-[#5B6270]">
                  Elapsed time will be verified and credited to weekly XP.
                </p>
              </div>
            </article>
          )}

          {/* Occurrence Cards */}
          {occs?.length === 0 ? (
            <div className="rounded-lg border border-[#E6E7EA] bg-white p-8 text-center font-body text-[14px] text-[#8A8F98]">
              No habits scheduled in this view.
            </div>
          ) : (
            occs?.map((o) => {
              const done = o.status === 'complete'
              const skipped = o.status === 'skipped'
              const isAssumed = o.origin === 'assumed'

              return (
                <article
                  key={o.id}
                  className={`rounded-lg border bg-white p-6 transition-colors ${
                    done ? 'border-[#E6E7EA]' : 'border-[#E6E7EA] hover:border-[#0F1115]'
                  } ${skipped ? 'opacity-75' : ''}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        onClick={() => toggle(o)}
                        className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded ${
                          done
                            ? 'bg-[#0F1115] text-white'
                            : skipped
                              ? 'border border-[#76777B] text-[#76777B]'
                              : 'border border-[#76777B] hover:border-[#0F1115]'
                        }`}
                      >
                        {done && (
                          <span className="material-symbols-outlined text-[15px]">check</span>
                        )}
                        {skipped && (
                          <span className="material-symbols-outlined text-[13px]">block</span>
                        )}
                      </button>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2
                            className={`font-display text-[16px] font-semibold ${
                              done || skipped ? 'line-through text-[#5B6270]' : 'text-[#0F1115]'
                            }`}
                          >
                            {o.habit_name}
                          </h2>
                          <span className="rounded bg-[#F4F4F5] px-1.5 py-0.5 font-body text-[11px] text-[#5B6270]">
                            {scope === 'week'
                              ? new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date(`${o.date}T12:00:00`))
                              : 'SCHEDULED TODAY'}
                          </span>
                          {isAssumed && (
                            <span className="rounded border border-[#F59E0B] bg-[#FEF3C7] px-2 py-0.5 font-body text-[10px] font-semibold uppercase tracking-wider text-[#B45309]">
                              ASSUMED
                            </span>
                          )}
                          {skipped && (
                            <span className="rounded bg-[#F4F4F5] px-2 py-0.5 font-body text-[11px] text-[#5B6270]">
                              Skipped: {o.skip_reason || 'Travel day'}
                            </span>
                          )}
                        </div>

                        <div className="mt-1 flex items-center gap-2">
                          <span className="font-body text-[13px] text-[#5B6270]">
                            Target: {o.target_minutes} min
                          </span>
                          {done && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#EAF7EE] px-2 py-0.5 font-body text-[11px] font-medium text-[#16A34A]">
                              <span className="material-symbols-outlined text-[13px]">
                                verified
                              </span>
                              Verified by timer (+{o.xp} XP)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Radial Progress Meter */}
                    <div className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center">
                      <svg className="h-10 w-10 -rotate-90 transform" viewBox="0 0 36 36">
                        <circle
                          cx="18"
                          cy="18"
                          fill="none"
                          r="15"
                          stroke="#E6E7EA"
                          strokeWidth="3"
                        />
                        <circle
                          cx="18"
                          cy="18"
                          fill="none"
                          r="15"
                          stroke="#1E3A8A"
                          strokeWidth="3"
                          strokeDasharray="94.2"
                          strokeDashoffset={done ? 0 : 94.2}
                          strokeLinecap="round"
                        />
                      </svg>
                      <span className="font-display text-[10px] font-bold text-[#0F1115]">
                        {done ? `${o.logged_minutes || o.target_minutes}m` : '0m'}
                      </span>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  {!done && !skipped && (
                    <div className="mt-4 flex items-center justify-between border-t border-[#E6E7EA] pt-3">
                      <div className="flex items-center gap-3 font-body text-[12px] text-[#5B6270]">
                        <button
                          type="button"
                          onClick={() => setLoggingId(o.id)}
                          className="hover:text-[#0F1115]"
                        >
                          Log minutes
                        </button>
                        <span>•</span>
                        <button
                          type="button"
                          onClick={() => setSkippingId(o.id)}
                          className="hover:text-[#0F1115]"
                        >
                          Skip (with reason)
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTimerId(o.id)
                          setTimerSeconds(0)
                          setTimerRunning(true)
                        }}
                        className="rounded-lg bg-[#0F1115] px-3 py-1.5 font-body text-[12px] font-medium text-white transition-colors hover:bg-[#1C1F26]"
                      >
                        Start timer
                      </button>
                    </div>
                  )}

                  {skipped && (
                    <div className="mt-3 border-t border-[#E6E7EA] pt-2 text-right">
                      <button
                        type="button"
                        onClick={() => toggle(o)}
                        className="rounded-lg px-2 py-1 font-body text-[12px] font-medium text-[#1E3A8A] hover:bg-[#E8EDF9] hover:text-[#0F1115]"
                      >
                        Re-open
                      </button>
                    </div>
                  )}

                  {/* Inline Skip Dialog */}
                  {skippingId === o.id && (
                    <div className="mt-3 flex items-center gap-2 border-t border-[#E6E7EA] pt-3">
                      <input
                        type="text"
                        value={skipReason}
                        onChange={(e) => setSkipReason(e.target.value)}
                        placeholder="Reason (e.g. Travel day, Sick, Exam)"
                        className="h-8 flex-1 rounded border border-[#E6E7EA] px-2.5 font-body text-[12px] outline-none focus:border-[#1E3A8A]"
                      />
                      <button
                        type="button"
                        onClick={() => submitSkip(o.id)}
                        className="h-8 rounded bg-[#0F1115] px-3 font-body text-[12px] font-medium text-white"
                      >
                        Skip
                      </button>
                      <button
                        type="button"
                        onClick={() => setSkippingId(null)}
                        className="h-8 rounded border border-[#E6E7EA] px-3 font-body text-[12px]"
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  {/* Inline Manual Log Dialog */}
                  {loggingId === o.id && (
                    <div className="mt-3 flex items-center gap-2 border-t border-[#E6E7EA] pt-3">
                      <label className="font-body text-[12px] text-[#5B6270]">Minutes:</label>
                      <input
                        type="number"
                        min={5}
                        step={5}
                        value={manualMinutes}
                        onChange={(e) => setManualMinutes(Number(e.target.value))}
                        className="h-8 w-20 rounded border border-[#E6E7EA] px-2 font-body text-[12px] outline-none focus:border-[#1E3A8A]"
                      />
                      <button
                        type="button"
                        onClick={() => submitLog(o.id)}
                        className="h-8 rounded bg-[#0F1115] px-3 font-body text-[12px] font-medium text-white"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setLoggingId(null)}
                        className="h-8 rounded border border-[#E6E7EA] px-3 font-body text-[12px]"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </article>
              )
            })
          )}
        </div>

        {/* Right Column: Consistency Rail (4 cols) */}
        <div className="space-y-4 lg:col-span-4">
          {/* Streak Card */}
          <div className="rounded-lg border border-[#E6E7EA] bg-white p-5">
            <div className="mb-2 flex items-center justify-between text-[#5B6270]">
              <span className="font-body text-[12px] font-medium uppercase tracking-wider">
                Momentum
              </span>
              <span className="material-symbols-outlined text-[#F59E0B] fill-icon">
                local_fire_department
              </span>
            </div>
            <div className="mb-1 font-display text-[26px] font-bold text-[#0F1115]">{currentStreak} {currentStreak === 1 ? 'Day' : 'Days'} Active</div>
            <p className="font-body text-[12px] text-[#5B6270]">
              Completing all scheduled sessions today maintains your streak.
            </p>
          </div>

          {/* Weekly Review Callout Card */}
          <div className="rounded-lg border border-[#E6E7EA] bg-white p-5">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-display text-[16px] font-semibold text-[#0F1115]">
                Weekly Review
              </span>
              <span className="rounded bg-[#E8EDF9] px-2 py-0.5 font-body text-[11px] font-medium text-[#1E3A8A]">
                AI Pacing
              </span>
            </div>
            <p className="mb-4 font-body text-[13px] text-[#5B6270]">
              Bosla analyzes friction and proposes raising or holding targets based on completion rates.
            </p>
            <Link
              to="/habits/review"
              className="flex h-10 w-full items-center justify-center gap-1.5 rounded-lg border border-[#0F1115] bg-white font-body text-[13px] font-medium text-[#0F1115] transition-colors hover:bg-[#FAFAF8]"
            >
              <span>Inspect Weekly Review</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
