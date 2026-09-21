import { Check, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { api, type Occurrence } from '../api'
import { Chip } from '../components/Card'

const STATUS_TONE: Record<Occurrence['status'], 'indigo' | 'amber' | 'neutral'> = {
  complete: 'indigo',
  partial: 'amber',
  pending: 'neutral',
  missed: 'neutral',
  skipped: 'neutral',
}

export function TodayHabits() {
  const [occs, setOccs] = useState<Occurrence[] | null>(null)
  const [skipping, setSkipping] = useState<string | null>(null)
  const [skipReason, setSkipReason] = useState('')
  const [minutesEditing, setMinutesEditing] = useState<string | null>(null)
  const [minutesValue, setMinutesValue] = useState('')

  const load = () => api.todayHabits().then(setOccs)
  useEffect(() => {
    load()
  }, [])

  async function toggle(o: Occurrence) {
    await api.logOccurrence(o.id, { completed: o.status !== 'complete' })
    load()
  }

  async function logMinutes(o: Occurrence) {
    const minutes = Number(minutesValue)
    if (!Number.isFinite(minutes) || minutes <= 0) return
    await api.logOccurrence(o.id, { minutes, origin: 'manual' })
    setMinutesEditing(null)
    setMinutesValue('')
    load()
  }

  async function submitSkip(o: Occurrence) {
    if (!skipReason.trim()) return
    await api.skipOccurrence(o.id, skipReason.trim())
    setSkipping(null)
    setSkipReason('')
    load()
  }

  if (!occs) return null

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-6 md:px-6 md:py-8">
      <h1 className="text-[26px] font-semibold">Today's habits</h1>
      <p className="mt-1 text-text-2">Tick, log minutes, or skip with a reason.</p>

      {occs.length === 0 && <p className="mt-8 text-center text-[13px] text-text-3">Nothing scheduled today.</p>}

      <ul className="mt-5 space-y-3">
        {occs.map((o) => (
          <li key={o.id} className="rounded-card border border-line bg-white p-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => toggle(o)}
                className={[
                  'grid h-6 w-6 shrink-0 place-items-center rounded-chip border',
                  o.status === 'complete' ? 'border-ink bg-ink text-white' : 'border-line bg-white',
                ].join(' ')}
              >
                {o.status === 'complete' && <Check size={14} strokeWidth={3} />}
              </button>
              <div className="min-w-0 flex-1">
                <div className={`text-[15px] font-medium ${o.status === 'complete' ? 'text-text-3 line-through' : ''}`}>{o.habit_name}</div>
                <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                  <Chip tone={STATUS_TONE[o.status]}>{o.status}</Chip>
                  {o.origin === 'assumed' && (
                    <Chip tone="amber" outline>
                      Assumed
                    </Chip>
                  )}
                  <span className="text-[12px] text-text-3">
                    {o.logged_minutes}/{o.target_minutes}m · +{o.xp} XP
                  </span>
                </div>
              </div>
            </div>

            {o.status !== 'complete' && o.status !== 'skipped' && (
              <div className="mt-3 flex flex-wrap items-center gap-2 pl-9">
                {minutesEditing === o.id ? (
                  <>
                    <input
                      type="number"
                      autoFocus
                      value={minutesValue}
                      onChange={(e) => setMinutesValue(e.target.value)}
                      placeholder="minutes"
                      className="h-8 w-24 rounded-card border border-line px-2 text-[13px] outline-none focus:border-ink"
                    />
                    <button type="button" onClick={() => logMinutes(o)} className="h-8 rounded-card bg-ink px-3 text-[12px] font-medium text-white">
                      Log
                    </button>
                    <button type="button" onClick={() => setMinutesEditing(null)} className="h-8 rounded-card px-2 text-[12px] text-text-3">
                      Cancel
                    </button>
                  </>
                ) : skipping === o.id ? (
                  <>
                    <input
                      autoFocus
                      value={skipReason}
                      onChange={(e) => setSkipReason(e.target.value)}
                      placeholder="Why are you skipping?"
                      className="h-8 flex-1 rounded-card border border-line px-2 text-[13px] outline-none focus:border-ink"
                    />
                    <button type="button" onClick={() => submitSkip(o)} className="h-8 rounded-card bg-ink px-3 text-[12px] font-medium text-white">
                      Confirm skip
                    </button>
                    <button type="button" onClick={() => setSkipping(null)} className="h-8 rounded-card px-2 text-[12px] text-text-3">
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setMinutesEditing(o.id)
                        setMinutesValue('')
                      }}
                      className="h-8 rounded-card border border-line px-3 text-[12px] font-medium text-ink hover:bg-page"
                    >
                      Log minutes
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSkipping(o.id)
                        setSkipReason('')
                      }}
                      className="flex h-8 items-center gap-1 rounded-card border border-line px-3 text-[12px] font-medium text-text-2 hover:bg-page"
                    >
                      <X size={12} /> Skip
                    </button>
                  </>
                )}
              </div>
            )}
            {o.justified_skip && o.skip_reason && <p className="mt-2 pl-9 text-[12px] text-text-3">Skipped: {o.skip_reason}</p>}
          </li>
        ))}
      </ul>
    </main>
  )
}
