import { ArrowRight, Check, Flame } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, type DashboardData } from '../api'
import { useApp } from '../context/AppContext'
import { Card, Chip, FitRing } from './Card'

function Stat({ label, value, aside }: { label: string; value: string; aside?: React.ReactNode }) {
  return (
    <Card>
      <div className="text-[12px] font-semibold uppercase tracking-[0.06em] text-text-3">{label}</div>
      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
        <div className="text-[28px] font-semibold leading-8 font-display">{value}</div>
        {aside}
      </div>
    </Card>
  )
}

export function Dashboard() {
  const { user } = useApp()
  const [data, setData] = useState<DashboardData | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    api.dashboard().then(setData)
  }, [])

  async function toggle(id: string, done: boolean) {
    await api.logOccurrence(id, { completed: !done })
    api.dashboard().then(setData)
  }

  if (!data) return null

  const firstName = (user?.name || 'there').split(' ')[0]

  return (
    <main className="mx-auto w-full min-w-0 max-w-[1280px] overflow-x-hidden px-4 py-6 md:px-6 md:py-8">
      <h1 className="text-[32px] font-semibold leading-10">Good to see you, {firstName}</h1>
      <p className="mt-1 text-text-2">
        {data.chosen_direction ? `Your compass is pointing at ${data.chosen_direction} — ` : ''}
        {data.today.length} habit{data.today.length === 1 ? '' : 's'} due today.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Stat label="Current streak" value={`${data.streak.current} days`} aside={<Flame size={22} className="text-amber-brand" />} />
        <Card>
          <div className="text-[12px] font-semibold uppercase tracking-[0.06em] text-text-3">Today's completion</div>
          <div className="mt-2 text-[28px] font-semibold leading-8 font-display">{Math.round(data.week_completion_pct)}%</div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-amber-tint">
            <div className="h-full rounded-full bg-amber-brand" style={{ width: `${data.week_completion_pct}%` }} />
          </div>
        </Card>
        <Stat
          label="Career direction"
          value={data.chosen_direction ?? 'Not chosen yet'}
          aside={data.top_matches[0] ? <Chip>{data.top_matches[0].fit_score}% fit</Chip> : undefined}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card
          className="lg:col-span-2"
          title="Today's habits"
          action={
            <Link to="/habits" className="inline-flex items-center gap-1 text-[13px] font-medium text-indigo-brand">
              View all habits <ArrowRight size={14} />
            </Link>
          }
        >
          {data.today.length === 0 ? (
            <p className="py-6 text-center text-[13px] text-text-3">Nothing scheduled today. Add a habit from your roadmap.</p>
          ) : (
            <ul className="divide-y divide-line">
              {data.today.map((o) => {
                const done = o.status === 'complete'
                return (
                  <li key={o.id} className="flex items-center gap-3 py-3">
                    <button
                      type="button"
                      aria-pressed={done}
                      onClick={() => toggle(o.id, done)}
                      className={[
                        'grid h-5 w-5 shrink-0 place-items-center rounded-chip border',
                        done ? 'border-ink bg-ink text-white' : 'border-line bg-white',
                      ].join(' ')}
                    >
                      {done && <Check size={13} strokeWidth={3} />}
                    </button>
                    <span className={`min-w-0 flex-1 truncate text-[15px] ${done ? 'text-text-3 line-through' : ''}`}>{o.habit_name}</span>
                    {o.origin === 'assumed' && (
                      <Chip tone="amber" outline>
                        Assumed
                      </Chip>
                    )}
                    <span className="w-12 shrink-0 text-right text-[13px] text-text-2">{o.target_minutes}m</span>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>

        <Card title="Your top career matches">
          {data.top_matches.length === 0 ? (
            <p className="text-[13px] text-text-3">Complete the discovery conversation to see matches.</p>
          ) : (
            <ul className="space-y-3">
              {data.top_matches.map((m) => (
                <li key={m.id} className="flex gap-3 border-l-2 border-indigo-brand pl-3">
                  <FitRing value={m.fit_score} />
                  <div className="min-w-0">
                    <div className="text-[15px] font-semibold">{m.title}</div>
                    <div className="text-[13px] leading-5 text-text-2">{m.why}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <Link to="/matches" className="mt-4 block text-[12px] text-indigo-brand">
            See all matches and why they fit →
          </Link>
        </Card>
      </div>

      <Card
        className="mt-4"
        title="Keep building your roadmap"
        action={
          <button
            type="button"
            onClick={() => navigate('/roadmap')}
            className="h-9 whitespace-nowrap rounded-card border border-ink bg-white px-3 text-[13px] font-medium text-ink hover:bg-page"
          >
            View roadmap
          </button>
        }
      >
        <p className="text-[13px] text-text-2">
          Every roadmap step can become a scheduled habit — Bosla researches, drafts a plan, and checks it against
          your calendar before anything is added.
        </p>
      </Card>
    </main>
  )
}
