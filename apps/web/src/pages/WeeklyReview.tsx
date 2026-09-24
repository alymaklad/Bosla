import { useEffect, useState } from 'react'
import { api, type DifficultyProposal, type WeeklyReview as WeeklyReviewType } from '../api'
import { PageLoading } from '../components/PageLoading'

const ISO_WEEKDAYS = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const MAX_WEEKS_BACK = 52

function formatMinutes(minutes: number) {
  const total = Math.round(minutes)
  if (total < 60) return `${total}m`
  const hours = Math.floor(total / 60)
  const rest = total % 60
  return rest ? `${hours}h ${rest}m` : `${hours}h`
}

function weekLabel(start: string, end: string) {
  const parse = (d: string) => new Date(`${d}T00:00:00Z`)
  const month = (d: Date) => d.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' })
  const a = parse(start)
  const b = parse(end)
  return month(a) === month(b)
    ? `${month(a)} ${a.getUTCDate()}–${b.getUTCDate()}`
    : `${month(a)} ${a.getUTCDate()} – ${month(b)} ${b.getUTCDate()}`
}

type Decision = 'accepted' | 'kept'

export function WeeklyReview() {
  const [week, setWeek] = useState(0)
  const [review, setReview] = useState<WeeklyReviewType | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [decisions, setDecisions] = useState<Record<string, Decision>>({})
  const [deciding, setDeciding] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  const [loadedKey, setLoadedKey] = useState<string | null>(null)
  const requestKey = `${week}:${attempt}`
  const loading = loadedKey !== requestKey

  useEffect(() => {
    let cancelled = false
    api.weeklyReview(week)
      .then((data) => {
        if (cancelled) return
        setReview(data)
        setError(null)
      })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load this week. Please retry.') })
      .finally(() => { if (!cancelled) setLoadedKey(`${week}:${attempt}`) })
    return () => { cancelled = true }
  }, [week, attempt])

  async function decide(proposal: DifficultyProposal, accept: boolean) {
    setDeciding(proposal.habit_id)
    try {
      await api.acceptDifficulty(proposal.habit_id, accept)
      setDecisions((d) => ({ ...d, [proposal.habit_id]: accept ? 'accepted' : 'kept' }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save that decision. Please retry.')
    } finally {
      setDeciding(null)
    }
  }

  if (!review && loading) return <PageLoading label="Recomputing your week…" />

  if (!review) {
    return (
      <main className="mx-auto flex min-h-[50vh] w-full max-w-[760px] flex-col items-center justify-center px-6 text-center">
        <span className="material-symbols-outlined text-[32px] text-[#B91C1C]">error</span>
        <h1 className="mt-3 font-display text-[22px] font-semibold text-[#0F1115]">Your weekly review could not be loaded</h1>
        <p className="mt-2 font-body text-[14px] text-[#5B6270]">{error}</p>
        <button type="button" onClick={() => setAttempt((n) => n + 1)} className="mt-5 rounded-xl bg-[#0F1115] px-4 py-2.5 font-body text-[13px] font-medium text-white">Retry</button>
      </main>
    )
  }

  const isCurrent = review.week_offset === 0
  const maxMinutes = Math.max(1, ...review.days.map((d) => Math.max(d.logged_minutes, d.target_minutes)))
  const worstDay = review.worst_weekday ? ISO_WEEKDAYS[review.worst_weekday] : null
  const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

  return (
    <main className={`mx-auto w-full max-w-[1280px] px-6 py-8 transition-opacity ${loading ? 'opacity-60' : ''}`}>
      {/* Page Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 border-b border-[#E6E7EA] pb-6 md:flex-row md:items-center">
        <div>
          <h1 className="font-display text-[32px] font-bold tracking-tight text-[#0F1115] md:text-[36px]">
            Week of {weekLabel(review.week_start, review.week_end)}
          </h1>
          <p className="mt-1 font-body text-[14px] text-[#5B6270]">
            Recomputed from your logs — un-ticking anything updates this.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={loading || week <= -MAX_WEEKS_BACK}
            onClick={() => setWeek((w) => w - 1)}
            className="flex h-9 items-center gap-1.5 rounded border border-[#E6E7EA] bg-white px-3.5 font-body text-[13px] font-medium text-[#0F1115] transition-colors hover:border-[#0F1115] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            <span>Previous week</span>
          </button>
          {isCurrent ? (
            <div className="flex h-9 items-center rounded border border-[#E6E7EA] bg-[#E2E8F9] px-3.5 font-body text-[13px] font-medium text-[#0F1115]">
              Current week
            </div>
          ) : (
            <>
              <button
                type="button"
                disabled={loading}
                onClick={() => setWeek((w) => w + 1)}
                className="flex h-9 items-center gap-1.5 rounded border border-[#E6E7EA] bg-white px-3.5 font-body text-[13px] font-medium text-[#0F1115] transition-colors hover:border-[#0F1115] disabled:opacity-50"
              >
                <span>Next week</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => setWeek(0)}
                className="flex h-9 items-center rounded border border-[#E6E7EA] bg-white px-3.5 font-body text-[13px] font-medium text-[#1E3A8A] transition-colors hover:border-[#1E3A8A] disabled:opacity-50"
              >
                Current week
              </button>
            </>
          )}
        </div>
      </div>

      {error && <p role="alert" className="mb-6 rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 font-body text-[13px] text-[#B91C1C]">{error}</p>}

      {/* Row 1: Four Stat Tiles */}
      <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-[#E6E7EA] bg-white p-5">
          <div className="mb-2 font-body text-[11px] font-medium uppercase tracking-wider text-[#5B6270]">Completion</div>
          <div className="mb-2 font-display text-[32px] font-bold leading-none text-[#0F1115]">
            {review.scheduled > 0 ? `${Math.round(review.completion_pct)}%` : '—'}
          </div>
          <div className="font-body text-[13px] text-[#5B6270]">
            {review.scheduled > 0 ? `${review.completed} of ${plural(review.scheduled, 'due session')}` : 'No sessions due yet'}
          </div>
          {(review.skipped > 0 || review.upcoming > 0) && (
            <div className="mt-1 font-body text-[12px] text-[#8A8F98]">
              {[review.skipped > 0 && `${review.skipped} skipped with a reason`, review.upcoming > 0 && `${review.upcoming} still to come`].filter(Boolean).join(' · ')}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-[#E6E7EA] bg-white p-5">
          <div className="mb-2 font-body text-[11px] font-medium uppercase tracking-wider text-[#5B6270]">Points</div>
          <div className="mb-2 font-display text-[32px] font-bold leading-none text-[#0F1115]">{review.total_points}</div>
          <div className="font-body text-[13px] text-[#5B6270]">+2 complete · +1 partial · −1 missed</div>
        </div>

        <div className="rounded-lg border border-[#E6E7EA] bg-white p-5">
          <div className="mb-2 font-body text-[11px] font-medium uppercase tracking-wider text-[#5B6270]">Longest streak</div>
          <div className="mb-2 flex items-baseline gap-2">
            <span className="font-display text-[32px] font-bold leading-none text-[#0F1115]">{review.longest_streak}</span>
            {review.longest_streak > 0 && <span className="material-symbols-outlined text-[24px] text-[#F59E0B] fill-icon">local_fire_department</span>}
          </div>
          <div className="font-body text-[13px] text-[#5B6270]">{review.longest_streak === 1 ? 'session' : 'sessions'} in a row for one habit</div>
        </div>

        <div className="rounded-lg border border-[#E6E7EA] bg-white p-5">
          <div className="mb-2 font-body text-[11px] font-medium uppercase tracking-wider text-[#5B6270]">Weakest weekday</div>
          <div className="mb-2 font-display text-[22px] font-semibold text-[#0F1115]">{worstDay ?? 'None yet'}</div>
          <div className="font-body text-[13px] text-[#5B6270]">
            {worstDay && review.worst_weekday_pct !== null
              ? `${Math.round(review.worst_weekday_pct)}% of its sessions completed`
              : 'Needs two days with due sessions and a miss'}
          </div>
        </div>
      </div>

      {/* Section 2: Minutes per day */}
      <div className="mb-10 rounded-lg border border-[#E6E7EA] bg-white p-6">
        <div className="mb-6 flex flex-col justify-between gap-2 border-b border-[#E6E7EA] pb-6 sm:flex-row sm:items-baseline">
          <div>
            <h2 className="font-display text-[18px] font-semibold text-[#0F1115]">Minutes per day</h2>
            <p className="mt-0.5 font-body text-[13px] text-[#5B6270]">
              {formatMinutes(review.logged_minutes)} logged across {plural(review.active_days, 'active day')}
            </p>
          </div>
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-sm bg-[#F59E0B]" />
              <span className="font-body text-[12px] text-[#5B6270]">Logged time</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 border-b border-dashed border-[#0F1115]" />
              <span className="font-body text-[12px] text-[#5B6270]">Planned target</span>
            </div>
          </div>
        </div>

        <div className="grid h-52 grid-cols-7 items-end gap-3 sm:gap-6">
          {review.days.map((day) => {
            const logged = Math.max(0, day.logged_minutes)
            return (
              <div key={day.date} className="flex h-full flex-col items-center justify-end">
                <span className={`mb-1 font-body text-[11px] ${day.future ? 'text-[#B0B4BC]' : 'text-[#5B6270]'}`}>
                  {day.future ? (day.sessions ? 'upcoming' : '') : formatMinutes(logged)}
                </span>
                <div className="relative flex h-full w-full max-w-[48px] items-end">
                  {day.target_minutes > 0 && (
                    <div
                      className="absolute left-0 right-0 z-10 border-b-2 border-dashed border-[#0F1115]/60"
                      style={{ bottom: `${(day.target_minutes / maxMinutes) * 100}%` }}
                      title={`Target ${formatMinutes(day.target_minutes)}`}
                    />
                  )}
                  <div
                    className={`w-full rounded-t ${day.future ? 'bg-[#E6E7EA]' : 'bg-[#F59E0B]'}`}
                    style={{ height: `${Math.max(logged > 0 ? 3 : 0, (logged / maxMinutes) * 100)}%` }}
                  />
                </div>
                <span className={`mt-2 font-body text-[13px] font-medium ${day.future ? 'text-[#8A8F98]' : 'text-[#0F1115]'}`}>
                  {ISO_WEEKDAYS[day.weekday].slice(0, 3)}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Section 3: Proposals */}
      <div className="mb-14">
        <div className="mb-5">
          <h2 className="font-display text-[18px] font-semibold text-[#0F1115]">Target adjustments</h2>
          <p className="mt-0.5 font-body text-[13px] text-[#5B6270]">
            Each habit is judged on its due sessions this week: 90%+ raises the target, below 70% eases it.
          </p>
        </div>

        <div className="space-y-4">
          {!isCurrent ? (
            <p className="rounded-lg border border-dashed border-[#D7DAE0] px-5 py-6 font-body text-[13px] text-[#5B6270]">
              Adjustments are proposed for the current week only. Past weeks are shown for reference.
            </p>
          ) : review.proposals.length === 0 ? (
            <p className="rounded-lg border border-dashed border-[#D7DAE0] px-5 py-6 font-body text-[13px] text-[#5B6270]">
              No habit has a due session yet this week. Check back after your first sessions.
            </p>
          ) : (
            review.proposals.map((proposal) => {
              const decision = decisions[proposal.habit_id]
              const actionable = proposal.direction !== 'hold'
              const raise = proposal.direction === 'raise'
              return (
                <div
                  key={proposal.habit_id}
                  className="flex flex-col justify-between gap-6 rounded-lg border border-[#E6E7EA] bg-white p-6 transition-colors hover:border-[#0F1115] md:flex-row md:items-center"
                >
                  <div className="max-w-2xl space-y-2">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h3 className="font-display text-[16px] font-semibold text-[#0F1115]">{proposal.habit_name}</h3>
                      <span className="rounded bg-[#E8EDF9] px-2 py-0.5 font-body text-[11px] text-[#1E3A8A]">
                        Target: {formatMinutes(proposal.current_target)}
                      </span>
                      <span className={`rounded-full px-2.5 py-0.5 font-body text-[11px] font-medium ${
                        raise ? 'bg-[#FEF3C7] text-[#B45309]' : proposal.direction === 'reduce' ? 'bg-[#FEF2F2] text-[#B91C1C]' : 'bg-[#E8EDF9] text-[#1E3A8A]'
                      }`}>
                        {Math.round(proposal.completion_pct)}% complete
                      </span>
                    </div>
                    <p className="font-body text-[14px] text-[#0F1115]">{proposal.rationale}</p>
                  </div>

                  {!actionable ? (
                    <div className="flex shrink-0 items-center gap-2 rounded border border-[#E6E7EA] bg-[#F0F3FF] px-3 py-1.5 font-body text-[12px] text-[#1E3A8A]">
                      <span className="material-symbols-outlined text-[16px]">verified</span>
                      <span>No change needed</span>
                    </div>
                  ) : decision ? (
                    <div className="flex shrink-0 items-center gap-2 rounded border border-[#BBE3C8] bg-[#EAF8EE] px-3 py-1.5 font-body text-[12px] text-[#17733B]">
                      <span className="material-symbols-outlined text-[16px]">check</span>
                      <span>
                        {decision === 'accepted'
                          ? `Target ${raise ? 'raised' : 'eased'} to ${formatMinutes(proposal.proposed_target)}`
                          : `Kept at ${formatMinutes(proposal.current_target)}`}
                      </span>
                    </div>
                  ) : (
                    <div className="flex shrink-0 items-center gap-3">
                      <button
                        type="button"
                        disabled={deciding === proposal.habit_id}
                        onClick={() => void decide(proposal, false)}
                        className="h-10 rounded border border-[#E6E7EA] bg-white px-4 font-body text-[13px] font-medium text-[#0F1115] transition-colors hover:border-[#0F1115] disabled:opacity-50"
                      >
                        Keep as is
                      </button>
                      <button
                        type="button"
                        disabled={deciding === proposal.habit_id}
                        onClick={() => void decide(proposal, true)}
                        className="h-10 rounded bg-[#0F1115] px-4 font-body text-[13px] font-medium text-white transition-colors hover:bg-[#1C1F26] disabled:opacity-50"
                      >
                        {raise ? 'Raise' : 'Ease'} to {formatMinutes(proposal.proposed_target)}
                      </button>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>

      <footer className="border-t border-[#E6E7EA] pt-8 text-center">
        <p className="font-body text-[13px] text-[#8A8F98]">Bosla proposes; you decide. Nothing changes unless you accept.</p>
      </footer>
    </main>
  )
}
