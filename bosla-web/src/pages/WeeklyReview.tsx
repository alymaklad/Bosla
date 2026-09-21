import { ArrowDown, ArrowUp, Minus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { api, type WeeklyReview as WeeklyReviewData } from '../api'
import { Card } from '../components/Card'

const WEEKDAY = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const DIRECTION_ICON = { raise: ArrowUp, hold: Minus, reduce: ArrowDown }

export function WeeklyReview() {
  const [data, setData] = useState<WeeklyReviewData | null>(null)
  const [resolved, setResolved] = useState<Set<string>>(new Set())

  const load = () => api.weeklyReview().then(setData)
  useEffect(() => {
    load()
  }, [])

  async function respond(habitId: string, accept: boolean) {
    await api.acceptDifficulty(habitId, accept)
    setResolved((s) => new Set(s).add(habitId))
  }

  if (!data) return null

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-6 md:px-6 md:py-8">
      <h1 className="text-[26px] font-semibold">This week's review</h1>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <Card>
          <div className="text-[12px] font-semibold uppercase tracking-[0.06em] text-text-3">Completion</div>
          <div className="mt-1 text-[24px] font-semibold font-display">{Math.round(data.completion_pct)}%</div>
        </Card>
        <Card>
          <div className="text-[12px] font-semibold uppercase tracking-[0.06em] text-text-3">Points</div>
          <div className="mt-1 text-[24px] font-semibold font-display">{data.total_points}</div>
        </Card>
        <Card>
          <div className="text-[12px] font-semibold uppercase tracking-[0.06em] text-text-3">Toughest day</div>
          <div className="mt-1 text-[15px] font-semibold">{data.worst_weekday ? WEEKDAY[data.worst_weekday] : '—'}</div>
        </Card>
      </div>

      <h2 className="mt-6 text-[15px] font-semibold">Difficulty proposals</h2>
      {data.proposals.length === 0 ? (
        <p className="mt-2 text-[13px] text-text-3">Nothing to adjust this week.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {data.proposals.map((p) => {
            const Icon = DIRECTION_ICON[p.direction]
            const done = resolved.has(p.habit_id)
            return (
              <li key={p.habit_id} className="rounded-card border border-line bg-white p-4">
                <div className="flex items-center gap-2">
                  <Icon size={16} className="text-indigo-brand" />
                  <span className="text-[14px] font-semibold">{p.habit_name}</span>
                </div>
                <p className="mt-1 text-[13px] leading-5 text-text-2">{p.rationale}</p>
                {done ? (
                  <p className="mt-2 text-[12px] text-text-3">Done.</p>
                ) : (
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => respond(p.habit_id, true)}
                      className="h-8 rounded-card bg-ink px-3 text-[12px] font-medium text-white"
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      onClick={() => respond(p.habit_id, false)}
                      className="h-8 rounded-card border border-line px-3 text-[12px] font-medium text-ink hover:bg-page"
                    >
                      Keep as is
                    </button>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </main>
  )
}
