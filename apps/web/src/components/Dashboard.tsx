import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, type DashboardData } from '../api'
import { useApp } from '../context/AppContext'

export function Dashboard() {
  const { user } = useApp()
  const [data, setData] = useState<DashboardData | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    api.dashboard().then(setData).catch(() => {})
  }, [])

  async function toggle(id: string, done: boolean) {
    try {
      await api.logOccurrence(id, { completed: !done })
      api.dashboard().then(setData).catch(() => {})
    } catch {
      // silently handle – occurrence state will refresh on next load
    }
  }

  if (!data) return (
    <div className="mx-auto w-full max-w-[1280px] space-y-6 px-6 py-8">
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
        <span className="material-symbols-outlined animate-spin text-[32px] text-[#1E3A8A]">refresh</span>
        <p className="font-body text-[14px] text-[#5B6270]">Loading your dashboard…</p>
      </div>
    </div>
  )

  const firstName = (user?.name || user?.email || 'there').split(' ')[0]
  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date())

  const direction = data.chosen_direction || 'Data Analyst'
  const todayOccs = data.today || []
  const matches = data.top_matches || []
  const streakDays = data.streak?.current ?? 7
  const longestStreak = data.streak?.longest ?? 12
  const weekPct = Math.round(data.week_completion_pct || 80)

  return (
    <div className="mx-auto w-full max-w-[1280px] space-y-6 px-6 py-8">
      {/* Header Section */}
      <section className="flex flex-col justify-between gap-4 border-b border-[#E6E7EA] pb-6 md:flex-row md:items-end">
        <div>
          <span className="mb-1 block font-body text-[11px] uppercase tracking-wider text-[#5B6270]">
            {todayFormatted}
          </span>
          <h1 className="font-display text-[32px] font-bold tracking-tight text-[#0F1115] md:text-[36px]">
            Good morning, {firstName}
          </h1>
          <p className="mt-1 font-body text-[15px] text-[#5B6270]">
            Your compass is pointing at{' '}
            <span className="font-medium text-[#0F1115]">{direction}</span> —{' '}
            {todayOccs.length} habit{todayOccs.length === 1 ? '' : 's'} due today.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded border border-[#E2E8F9] bg-[#E7EEFF] px-2.5 py-1 font-body text-[11px] font-medium text-[#1E3A8A]">
            Track: {user?.persona ? `${user.persona.charAt(0).toUpperCase() + user.persona.slice(1)}` : 'Analytics Engineering'}
          </span>
        </div>
      </section>

      {/* Row of 3 Stat Cards */}
      <section aria-label="Summary Statistics" className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Stat Card 1 */}
        <div className="flex flex-col justify-between rounded-lg border border-[#E6E7EA] bg-white p-5">
          <div className="mb-2 flex items-center justify-between text-[#5B6270]">
            <span className="font-body text-[12px] font-medium">Current streak</span>
            <span className="material-symbols-outlined text-[#F59E0B] fill-icon">
              local_fire_department
            </span>
          </div>
          <div className="mb-2 flex items-baseline gap-2">
            <span className="font-display text-[28px] font-bold text-[#0F1115]">
              {streakDays} days
            </span>
          </div>
          <p className="font-body text-[11px] text-[#5B6270]">
            Personal record: {longestStreak} days
          </p>
        </div>

        {/* Stat Card 2 */}
        <div className="flex flex-col justify-between rounded-lg border border-[#E6E7EA] bg-white p-5">
          <div className="mb-2 flex items-center justify-between text-[#5B6270]">
            <span className="font-body text-[12px] font-medium">Habits this week</span>
            <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 font-body text-[11px] font-medium text-amber-800">
              {weekPct}% on track
            </span>
          </div>
          <div className="mb-3 flex items-baseline gap-2">
            <span className="font-display text-[28px] font-bold text-[#0F1115]">
              {Math.round((weekPct / 100) * 15)} of 15
            </span>
          </div>
          <div>
            <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-[#E6E7EA]">
              <div
                className="h-full rounded-full bg-[#F59E0B]"
                style={{ width: `${weekPct}%` }}
              />
            </div>
            <p className="font-body text-[11px] text-[#5B6270]">Weekly consistency pace</p>
          </div>
        </div>

        {/* Stat Card 3 */}
        <div className="flex flex-col justify-between rounded-lg border border-[#E6E7EA] bg-white p-5">
          <div className="mb-2 flex items-center justify-between text-[#5B6270]">
            <span className="font-body text-[12px] font-medium">Career direction</span>
            <span className="rounded bg-[#E7EEFF] px-2 py-0.5 font-body text-[11px] font-semibold text-[#1E3A8A]">
              {matches[0]?.fit_score ?? 78}% FIT
            </span>
          </div>
          <div className="mb-2 flex items-baseline gap-2">
            <span className="font-display text-[24px] font-bold text-[#0F1115] truncate">
              {direction}
            </span>
          </div>
          <p className="font-body text-[11px] text-[#5B6270]">
            Updated recently via interview synthesis
          </p>
        </div>
      </section>

      {/* Two-Column Layout (equal height cards) */}
      <section className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-2">
        {/* Left Column: Today's habits */}
        <div className="flex flex-col justify-between rounded-lg border border-[#E6E7EA] bg-white p-6">
          <div>
            <div className="mb-4 flex items-center justify-between border-b border-[#E6E7EA] pb-4">
              <div className="flex items-center gap-2">
                <h2 className="font-display text-[18px] font-semibold text-[#0F1115]">
                  Today's habits
                </h2>
                <span className="rounded-full bg-[#F0F3FF] px-2 py-0.5 font-body text-[11px] text-[#5B6270]">
                  {todayOccs.length} scheduled
                </span>
              </div>
              <span className="font-body text-[12px] text-[#5B6270]">Daily cadence</span>
            </div>

            <div className="space-y-3">
              {todayOccs.length === 0 ? (
                <div className="py-8 text-center font-body text-[13px] text-[#8A8F98]">
                  No habits due today. Turn a step into a habit from your Roadmap!
                </div>
              ) : (
                todayOccs.map((o) => {
                  const done = o.status === 'complete'
                  return (
                    <div
                      key={o.id}
                      className="flex items-center justify-between rounded-lg border border-[#E6E7EA] bg-[#FAFAF8] p-3.5"
                    >
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => toggle(o.id, done)}
                          className={`flex h-5 w-5 items-center justify-center rounded ${
                            done
                              ? 'bg-[#0F1115] text-white'
                              : 'border border-[#76777B] bg-white hover:border-[#0F1115]'
                          }`}
                        >
                          {done && (
                            <span className="material-symbols-outlined text-[15px]">check</span>
                          )}
                        </button>
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-body text-[14px] font-medium ${
                                done ? 'line-through text-[#8A8F98]' : 'text-[#0F1115]'
                              }`}
                            >
                              {o.habit_name}
                            </span>
                            {o.origin === 'assumed' && (
                              <span className="rounded border border-[#F59E0B] px-1.5 py-0.2 font-body text-[10px] font-medium uppercase tracking-wider text-[#0F1115]">
                                ASSUMED
                              </span>
                            )}
                          </div>
                          <div className="mt-0.5 flex items-center gap-2">
                            <span className="rounded border border-[#E6E7EA] bg-white px-1.5 py-0.5 font-body text-[10px] text-[#5B6270]">
                              SCHEDULED
                            </span>
                            <span className="font-body text-[11px] text-[#5B6270]">
                              {o.target_minutes}m
                            </span>
                          </div>
                        </div>
                      </div>

                      {done ? (
                        <div className="flex items-center gap-1 font-body text-[11px] text-[#5B6270]">
                          <span className="material-symbols-outlined text-[15px] text-[#16A34A]">
                            verified
                          </span>
                          <span>Completed</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => navigate('/habits')}
                          className="flex h-8 items-center gap-1.5 rounded border border-[#E6E7EA] bg-white px-3 font-body text-[12px] font-medium text-[#0F1115] transition-colors hover:border-[#0F1115]"
                        >
                          <span className="material-symbols-outlined text-[15px]">play_arrow</span>
                          <span>Start timer</span>
                        </button>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-[#E6E7EA] pt-4">
            <span className="font-body text-[11px] text-[#5B6270]">
              Habit streak logic rewards persistence
            </span>
            <Link
              to="/habits"
              className="flex items-center gap-1 font-body text-[13px] font-medium text-[#1E3A8A] hover:underline"
            >
              <span>View all habits</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </Link>
          </div>
        </div>

        {/* Right Column: Top Career Matches */}
        <div className="flex flex-col justify-between rounded-lg border border-[#E6E7EA] bg-white p-6">
          <div>
            <div className="mb-4 flex items-center justify-between border-b border-[#E6E7EA] pb-4">
              <h2 className="font-display text-[18px] font-semibold text-[#0F1115]">
                Your top career matches
              </h2>
              <span className="rounded border border-[#E6E7EA] bg-[#FAFAF8] px-2 py-0.5 font-body text-[11px] text-[#5B6270]">
                Active exploration
              </span>
            </div>

            <div className="space-y-3">
              {matches.slice(0, 3).map((m, idx) => (
                <Link
                  key={m.id}
                  to={`/matches/${m.id}`}
                  className={`flex items-center justify-between gap-3 rounded-lg border p-3.5 transition-colors ${
                    idx === 0
                      ? 'border-[#E6E7EA] border-l-4 border-l-[#1E3A8A] bg-[#FAFAF8]'
                      : 'border-[#E6E7EA] bg-white hover:border-[#0F1115]'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-body text-[14px] font-medium text-[#0F1115]">
                        {m.title}
                      </span>
                      {idx === 0 && (
                        <span className="rounded bg-[#E7EEFF] px-1.5 py-0.5 font-body text-[10px] font-medium text-[#1E3A8A]">
                          Primary fit
                        </span>
                      )}
                    </div>
                    <p className="line-clamp-1 font-body text-[12px] text-[#5B6270]">{m.why}</p>
                  </div>

                  {/* Circular Radial Gauge */}
                  <div className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center">
                    <svg className="h-12 w-12 -rotate-90 transform" viewBox="0 0 36 36">
                      <path
                        className="text-[#E6E7EA]"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3.5"
                      />
                      <path
                        className="text-[#1E3A8A]"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeDasharray="100, 100"
                        strokeDashoffset={100 - m.fit_score}
                        strokeLinecap="round"
                        strokeWidth="3.5"
                      />
                    </svg>
                    <span className="absolute font-display text-[11px] font-bold text-[#1E3A8A]">
                      {m.fit_score}%
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-4 border-t border-[#E6E7EA] pt-4">
            <p className="flex items-center gap-1.5 font-body text-[11px] text-[#5B6270]">
              <span className="material-symbols-outlined text-[16px]">help_outline</span>
              <span>Every recommendation shows its reasoning and uncertainty. Tap one to see why.</span>
            </p>
          </div>
        </div>
      </section>

      {/* Full-Width Section Card: Next steps on your roadmap */}
      <section className="rounded-lg border border-[#E6E7EA] bg-white p-6">
        <div className="flex flex-col justify-between gap-4 border-b border-[#E6E7EA] pb-6 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-display text-[18px] font-semibold text-[#0F1115]">
              Next steps on your roadmap
            </h2>
            <p className="mt-0.5 font-body text-[13px] text-[#5B6270]">
              Sequential milestones mapped toward the {direction} baseline competency
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/habit-wizard')}
            className="h-10 rounded border border-[#0F1115] bg-white px-4 font-body text-[13px] font-medium text-[#0F1115] transition-colors hover:bg-[#FAFAF8]"
          >
            Turn a step into a habit
          </button>
        </div>

        {/* 4-Step Horizontal Timeline */}
        <div className="py-8">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
            {/* Step 1 */}
            <div className="flex flex-col">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0F1115] text-white">
                  <span className="material-symbols-outlined text-[16px]">check</span>
                </div>
                <span className="font-body text-[11px] font-semibold uppercase tracking-wider text-[#0F1115]">
                  Step 01
                </span>
              </div>
              <h3 className="font-body text-[14px] font-medium text-[#0F1115]">
                Foundations of SQL
              </h3>
              <p className="mt-1 font-body text-[13px] text-[#5B6270]">
                Joins, aggregates, nested queries completed.
              </p>
              <div className="mt-4 flex items-center gap-1.5 font-body text-[11px] text-[#16A34A]">
                <span className="material-symbols-outlined text-[16px]">verified</span>
                <span>Completed</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#1E3A8A] bg-[#E8EDF9] font-body text-[11px] font-semibold text-[#1E3A8A]">
                  45%
                </div>
                <span className="font-body text-[11px] font-semibold uppercase tracking-wider text-[#1E3A8A]">
                  Step 02 · Active
                </span>
              </div>
              <h3 className="font-body text-[14px] font-medium text-[#0F1115]">
                Python for data
              </h3>
              <p className="mt-1 font-body text-[13px] text-[#5B6270]">
                Pandas, NumPy, and statistical cleaning.
              </p>
              <div className="mt-4 flex items-center gap-1.5 font-body text-[11px] font-medium text-[#1E3A8A]">
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#1E3A8A]" />
                <span>Current focus</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col opacity-85">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E6E7EA] bg-white font-body text-[11px] text-[#76777B]">
                  03
                </div>
                <span className="font-body text-[11px] font-medium uppercase tracking-wider text-[#76777B]">
                  Step 03
                </span>
              </div>
              <h3 className="font-body text-[14px] font-medium text-[#5B6270]">
                Portfolio project
              </h3>
              <p className="mt-1 font-body text-[13px] text-[#76777B]">
                End-to-end dataset analysis with reproducible script.
              </p>
              <div className="mt-4 font-body text-[11px] text-[#76777B]">Target: Nov 2026</div>
            </div>

            {/* Step 4 */}
            <div className="flex flex-col opacity-85">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E6E7EA] bg-white font-body text-[11px] text-[#76777B]">
                  04
                </div>
                <span className="font-body text-[11px] font-medium uppercase tracking-wider text-[#76777B]">
                  Step 04
                </span>
              </div>
              <h3 className="font-body text-[14px] font-medium text-[#5B6270]">
                Mock interviews
              </h3>
              <p className="mt-1 font-body text-[13px] text-[#76777B]">
                Case study walkthroughs and live coding rounds.
              </p>
              <div className="mt-4 font-body text-[11px] text-[#76777B]">Target: Dec 2026</div>
            </div>
          </div>
        </div>

        {/* Milestone Callout Banner */}
        <div className="flex items-start gap-3 rounded-lg border border-[#E6E7EA] bg-[#FAFAF8] p-4">
          <span className="material-symbols-outlined mt-0.5 text-[#1E3A8A]">lightbulb</span>
          <div>
            <span className="block font-body text-[14px] font-medium text-[#0F1115]">
              Next recommended milestone
            </span>
            <p className="mt-0.5 font-body text-[13px] text-[#5B6270]">
              Build an interactive Tableau / Streamlit dashboard highlighting key recommendations to showcase along with your Python fundamentals.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
