import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, type DashboardData, type Roadmap } from '../api'

const dismissKey = (userId: string) => `bosla.getting-started-dismissed.${userId}`

function readDismissed(userId: string): boolean {
  try {
    return window.localStorage.getItem(dismissKey(userId)) === '1'
  } catch {
    return false
  }
}

interface Props {
  userId: string
  data: DashboardData
  roadmap: Roadmap | null
}

/** First-week checklist shown after the tour; every item is read from the account's real data. */
export function GettingStarted({ userId, data, roadmap }: Props) {
  const [habitCount, setHabitCount] = useState<number | null>(null)
  const [dismissed, setDismissed] = useState(() => readDismissed(userId))

  useEffect(() => {
    let active = true
    api.listHabits().then((habits) => { if (active) setHabitCount(habits.length) }).catch(() => {})
    return () => { active = false }
  }, [data])

  const items = [
    { label: 'Complete your discovery conversation', done: true, to: '/onboarding/discovery', action: '' },
    { label: 'Review your career matches', done: data.top_matches.length > 0, to: '/matches', action: 'View matches' },
    { label: 'Choose a direction and open your roadmap', done: (roadmap?.steps.length ?? 0) > 0, to: '/roadmap', action: 'View roadmap' },
    { label: 'Turn one roadmap step into a habit', done: (habitCount ?? 0) > 0, to: '/roadmap', action: 'Create habit' },
    { label: 'Log your first habit', done: data.level.current_xp > 0, to: '/habits', action: 'Open habits' },
  ]
  const completed = items.filter((item) => item.done).length
  const pct = Math.round((completed / items.length) * 100)

  if (dismissed || habitCount === null || completed === items.length) return null

  function dismiss() {
    setDismissed(true)
    try {
      window.localStorage.setItem(dismissKey(userId), '1')
    } catch {
      // Storage can be unavailable (private mode); the card simply returns next visit.
    }
  }

  return (
    <section aria-labelledby="getting-started-title" className="rounded-xl border border-[#E6E7EA] bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <h2 id="getting-started-title" className="font-display text-[18px] font-semibold text-[#0F1115]">Getting started</h2>
          <span className="font-body text-[12px] text-[#5B6270]">{completed} of {items.length} complete</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-1.5 w-40 overflow-hidden rounded-full bg-[#E6E7EA]" role="progressbar" aria-label="Getting started progress" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full bg-[#1E3A8A]" style={{ width: `${pct}%` }} />
          </div>
          <span className="font-body text-[12px] tabular-nums text-[#5B6270]">{pct}%</span>
        </div>
      </div>
      <ul className="mt-4 divide-y divide-[#EEF0F3] border-t border-[#E6E7EA]">
        {items.map((item) => (
          <li key={item.label} className="flex items-center justify-between gap-3 py-3">
            <span className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded border ${item.done ? 'border-[#0F1115] bg-[#0F1115] text-white' : 'border-[#C9CDD4] bg-white'}`}
              >
                {item.done && <span className="material-symbols-outlined text-[14px]">check</span>}
              </span>
              <span className={`font-body text-[14px] ${item.done ? 'text-[#5B6270] line-through' : 'text-[#0F1115]'}`}>
                {item.label}
                <span className="sr-only">{item.done ? ' (completed)' : ' (not done yet)'}</span>
              </span>
            </span>
            {item.done ? (
              <span className="font-body text-[12px] text-[#5B6270]">Completed</span>
            ) : (
              <Link to={item.to} className="shrink-0 font-body text-[13px] font-medium text-[#1E3A8A] hover:underline">
                {item.action} →
              </Link>
            )}
          </li>
        ))}
      </ul>
      <div className="flex justify-end border-t border-[#E6E7EA] pt-3">
        <button type="button" onClick={dismiss} className="rounded px-2 py-1 font-body text-[13px] text-[#5B6270] hover:text-[#0F1115]">
          Dismiss
        </button>
      </div>
    </section>
  )
}
