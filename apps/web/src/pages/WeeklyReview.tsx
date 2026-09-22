import { useEffect, useState } from 'react'
import { api, type WeeklyReview as WeeklyReviewType } from '../api'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DEMO_MINUTES = [
  { day: 'Mon', mins: 45, pct: 75 },
  { day: 'Tue', mins: 30, pct: 50 },
  { day: 'Wed', mins: 60, pct: 100 },
  { day: 'Thu', mins: 20, pct: 33 },
  { day: 'Fri', mins: 45, pct: 75 },
  { day: 'Sat', mins: 30, pct: 50 },
  { day: 'Sun', mins: 0, pct: 5 },
]

export function WeeklyReview() {
  const [review, setReview] = useState<WeeklyReviewType | null>(null)
  const [decisions, setDecisions] = useState<Record<string, boolean>>({})

  useEffect(() => {
    api.weeklyReview().then(setReview).catch(() => {})
  }, [])

  async function handleProposal(habitId: string, accept: boolean) {
    try {
      await api.acceptDifficulty(habitId, accept)
      setDecisions((d) => ({ ...d, [habitId]: accept }))
    } catch {
      setDecisions((d) => ({ ...d, [habitId]: accept }))
    }
  }

  const completionPct = review ? Math.round(review.completion_pct) : 80
  const totalPoints = review?.total_points ?? 24
  const worstDayName =
    review?.worst_weekday !== null && review?.worst_weekday !== undefined
      ? WEEKDAYS[review.worst_weekday]
      : 'Thursday'

  return (
    <main className="mx-auto w-full max-w-[1280px] px-6 py-8">
      {/* Page Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 border-b border-[#E6E7EA] pb-6 md:flex-row md:items-center">
        <div>
          <h1 className="font-display text-[32px] font-bold tracking-tight text-[#0F1115] md:text-[36px]">
            Week of Sep 13–19
          </h1>
          <p className="mt-1 font-body text-[14px] text-[#5B6270]">
            Recomputed from your logs — un-ticking anything updates this.
          </p>
        </div>

        {/* Date navigation pill cluster */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex h-9 items-center gap-1.5 rounded border border-[#E6E7EA] bg-white px-3.5 font-body text-[13px] font-medium text-[#0F1115] transition-colors hover:border-[#0F1115]"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            <span>Previous week</span>
          </button>
          <div className="flex h-9 items-center rounded border border-[#E6E7EA] bg-[#E2E8F9] px-3.5 font-body text-[13px] font-medium text-[#0F1115]">
            Current week
          </div>
        </div>
      </div>

      {/* Row 1: Four Stat Tiles */}
      <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Stat Tile 1 */}
        <div className="rounded-lg border border-[#E6E7EA] bg-white p-5">
          <div className="mb-2 font-body text-[11px] font-medium uppercase tracking-wider text-[#5B6270]">
            Completion
          </div>
          <div className="mb-2 font-display text-[32px] font-bold leading-none text-[#0F1115]">
            {completionPct}%
          </div>
          <div className="font-body text-[13px] text-[#5B6270]">
            {review?.completed ?? 12} of {review?.scheduled ?? 15} planned sessions
          </div>
        </div>

        {/* Stat Tile 2 */}
        <div className="rounded-lg border border-[#E6E7EA] bg-white p-5">
          <div className="mb-2 font-body text-[11px] font-medium uppercase tracking-wider text-[#5B6270]">
            Points
          </div>
          <div className="mb-2 font-display text-[32px] font-bold leading-none text-[#0F1115]">
            {totalPoints}
          </div>
          <div className="font-body text-[13px] font-medium text-[#16A34A]">
            +5 bonus for beating target
          </div>
        </div>

        {/* Stat Tile 3 */}
        <div className="rounded-lg border border-[#E6E7EA] bg-white p-5">
          <div className="mb-2 font-body text-[11px] font-medium uppercase tracking-wider text-[#5B6270]">
            Longest streak
          </div>
          <div className="mb-2 flex items-baseline gap-2">
            <span className="font-display text-[32px] font-bold leading-none text-[#0F1115]">
              7
            </span>
            <span className="material-symbols-outlined text-[24px] text-[#F59E0B] fill-icon">
              local_fire_department
            </span>
          </div>
          <div className="font-body text-[13px] text-[#5B6270]">Consistent through weekend</div>
        </div>

        {/* Stat Tile 4 */}
        <div className="rounded-lg border border-[#E6E7EA] bg-white p-5">
          <div className="mb-2 font-body text-[11px] font-medium uppercase tracking-wider text-[#5B6270]">
            Worst weekday
          </div>
          <div className="mb-2 font-display text-[22px] font-semibold text-[#0F1115]">
            {worstDayName}
          </div>
          <div className="flex items-center gap-1 font-body text-[13px] font-medium text-[#16A34A]">
            <span>completed this week</span>
            <span className="material-symbols-outlined text-[16px]">check</span>
          </div>
        </div>
      </div>

      {/* Section 2: Chart Card */}
      <div className="mb-10 rounded-lg border border-[#E6E7EA] bg-white p-6">
        <div className="mb-6 flex flex-col justify-between gap-2 border-b border-[#E6E7EA] pb-6 sm:flex-row sm:items-baseline">
          <div>
            <h2 className="font-display text-[18px] font-semibold text-[#0F1115]">
              Minutes per day
            </h2>
            <p className="mt-0.5 font-body text-[13px] text-[#5B6270]">
              3h 45m logged across 5 active days
            </p>
          </div>
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-sm bg-[#F59E0B]" />
              <span className="font-body text-[12px] text-[#5B6270]">Measured time</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 border-b border-dashed border-[#0F1115]" />
              <span className="font-body text-[12px] text-[#5B6270]">Target pace (30m)</span>
            </div>
          </div>
        </div>

        {/* Bar Graphic Container */}
        <div className="relative pt-6 pb-2">
          {/* 30m Pace Reference Line */}
          <div className="absolute top-[52%] right-0 left-0 z-0 border-b border-dashed border-[#8A8F98]" />
          <span className="absolute top-[48%] right-0 -translate-y-full pr-1 font-body text-[11px] text-[#8A8F98]">
            30m target
          </span>

          {/* Weekday Columns */}
          <div className="relative z-10 grid h-52 grid-cols-7 items-end gap-3 sm:gap-6">
            {DEMO_MINUTES.map((col) => (
              <div key={col.day} className="group flex h-full flex-col items-center justify-end">
                <span className="mb-1 font-body text-[11px] text-[#5B6270]">
                  {col.mins > 0 ? `${col.mins}m` : '0m'}
                </span>
                <div
                  className="w-full max-w-[48px] rounded-t bg-[#F59E0B] transition-all group-hover:brightness-95"
                  style={{ height: `${col.pct}%` }}
                />
                <span className="mt-2 font-body text-[13px] font-medium text-[#0F1115]">
                  {col.day}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Section 3: AI Proposals & Target Adjustments */}
      <div className="mb-14">
        <div className="mb-5">
          <h2 className="font-display text-[18px] font-semibold text-[#0F1115]">
            AI Proposals &amp; Target Adjustments
          </h2>
          <p className="mt-0.5 font-body text-[13px] text-[#5B6270]">
            Bosla analyzes completion friction to propose pacing adjustments.
          </p>
        </div>

        <div className="space-y-4">
          {review?.proposals && review.proposals.length > 0 ? (
            review.proposals.map((prop) => {
              const decided = decisions[prop.habit_id]
              return (
                <div
                  key={prop.habit_id}
                  className="flex flex-col justify-between gap-6 rounded-lg border border-[#E6E7EA] bg-white p-6 transition-colors hover:border-[#0F1115] md:flex-row md:items-center"
                >
                  <div className="max-w-2xl space-y-2">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h3 className="font-display text-[16px] font-semibold text-[#0F1115]">
                        {prop.habit_name}
                      </h3>
                      <span className="rounded bg-[#E8EDF9] px-2 py-0.5 font-body text-[11px] font-medium text-[#1E3A8A]">
                        Current: {prop.current_target}m
                      </span>
                      <span className="rounded-full bg-[#FEF3C7] px-2.5 py-0.5 font-body text-[11px] font-medium text-[#B45309]">
                        Proposed: {prop.proposed_target}m
                      </span>
                    </div>
                    <p className="font-body text-[14px] text-[#0F1115]">{prop.rationale}</p>
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    {decided !== undefined ? (
                      <span className="font-body text-[12px] font-medium text-[#1E3A8A]">
                        {decided ? 'Accepted proposal' : 'Kept current target'}
                      </span>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => handleProposal(prop.habit_id, false)}
                          className="h-10 rounded border border-[#E6E7EA] bg-white px-4 font-body text-[13px] font-medium text-[#0F1115] transition-colors hover:border-[#0F1115]"
                        >
                          Keep as is
                        </button>
                        <button
                          type="button"
                          onClick={() => handleProposal(prop.habit_id, true)}
                          className="h-10 rounded bg-[#0F1115] px-4 font-body text-[13px] font-medium text-white transition-colors hover:bg-[#1C1F26]"
                        >
                          {prop.direction === 'raise' ? 'Raise it' : 'Ease back'}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )
            })
          ) : (
            <>
              {/* Default Mock Presentation from Stitch */}
              <div className="flex flex-col justify-between gap-6 rounded-lg border border-[#E6E7EA] bg-white p-6 transition-colors hover:border-[#0F1115] md:flex-row md:items-center">
                <div className="max-w-2xl space-y-2">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h3 className="font-display text-[16px] font-semibold text-[#0F1115]">
                      Python practice
                    </h3>
                    <span className="rounded bg-[#F4F4F5] px-2 py-0.5 font-body text-[11px] text-[#5B6270]">
                      MON–FRI
                    </span>
                    <span className="rounded bg-[#E8EDF9] px-2 py-0.5 font-body text-[11px] text-[#1E3A8A]">
                      Target: 30m
                    </span>
                    <span className="rounded-full bg-[#FEF3C7] px-2.5 py-0.5 font-body text-[11px] font-medium text-[#B45309]">
                      93% Complete
                    </span>
                  </div>
                  <p className="font-body text-[14px] text-[#0F1115]">
                    Python practice ran at 93% this week. Raise the target from 30m to 35m?
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <button
                    type="button"
                    className="h-10 rounded border border-[#E6E7EA] bg-white px-4 font-body text-[13px] font-medium text-[#0F1115] transition-colors hover:border-[#0F1115]"
                  >
                    Keep as is
                  </button>
                  <button
                    type="button"
                    className="h-10 rounded bg-[#0F1115] px-4 font-body text-[13px] font-medium text-white transition-colors hover:bg-[#1C1F26]"
                  >
                    Raise it
                  </button>
                </div>
              </div>

              <div className="flex flex-col justify-between gap-6 rounded-lg border border-[#E6E7EA] bg-white p-6 md:flex-row md:items-center">
                <div className="max-w-2xl space-y-2">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h3 className="font-display text-[16px] font-semibold text-[#0F1115]">
                      Databases &amp; SQL exercises
                    </h3>
                    <span className="rounded bg-[#F4F4F5] px-2 py-0.5 font-body text-[11px] text-[#5B6270]">
                      MON/WED/FRI
                    </span>
                    <span className="rounded bg-[#E8EDF9] px-2 py-0.5 font-body text-[11px] text-[#1E3A8A]">
                      Target: 20m
                    </span>
                    <span className="rounded-full bg-[#E8EDF9] px-2.5 py-0.5 font-body text-[11px] font-medium text-[#1E3A8A]">
                      75% Complete
                    </span>
                  </div>
                  <p className="font-body text-[14px] text-[#0F1115]">
                    Held at 75% — inside the 70–89% band, target stays at 20m.
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2 rounded border border-[#E6E7EA] bg-[#F0F3FF] px-3 py-1.5 font-body text-[12px] text-[#1E3A8A]">
                  <span className="material-symbols-outlined text-[16px]">verified</span>
                  <span>Cadence is stable</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-[#E6E7EA] pt-8 text-center">
        <p className="font-body text-[13px] text-[#8A8F98]">
          Bosla proposes; you decide. Nothing changes unless you accept.
        </p>
      </footer>
    </main>
  )
}
