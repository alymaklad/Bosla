import { ArrowRight, Check, Flame, Sparkles } from 'lucide-react'
import { Card, Chip } from './Card'

// Demo data. In the real app these come from bosla-services (habit-engine / career-discovery).
const HABITS = [
  { name: 'Python practice', minutes: 30, recurrence: 'Mon–Fri', done: true, assumed: false },
  { name: 'Read data-science article', minutes: 15, recurrence: 'Daily', done: false, assumed: false },
  { name: 'SQL exercises', minutes: 20, recurrence: 'Mon/Wed/Fri', done: false, assumed: true },
]

const MATCHES = [
  { title: 'Data Analyst', fit: 78, why: 'Your SQL and Python habits plus a strong interest in finding patterns.' },
  { title: 'Product Analyst', fit: 71, why: 'You said you enjoy asking "why" — this role lives on that question.' },
  { title: 'BI Developer', fit: 64, why: 'Fits your tooling strengths; less certain on your appetite for reporting work.' },
]

const ROADMAP = [
  { label: 'Foundations of SQL', state: 'done' },
  { label: 'Python for data', state: 'active' },
  { label: 'Portfolio project', state: 'todo' },
  { label: 'Mock interviews', state: 'todo' },
] as const

function FitRing({ value }: { value: number }) {
  const r = 16
  const c = 2 * Math.PI * r
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" className="shrink-0">
      <circle cx="22" cy="22" r={r} fill="none" stroke="#E6E7EA" strokeWidth="4" />
      <circle
        cx="22"
        cy="22"
        r={r}
        fill="none"
        stroke="#1E3A8A"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - value / 100)}
        transform="rotate(-90 22 22)"
      />
      <text x="22" y="26" textAnchor="middle" fontSize="11" fontWeight="600" fill="#0F1115" fontFamily="Space Grotesk">
        {value}%
      </text>
    </svg>
  )
}

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
  return (
    <main className="mx-auto w-full min-w-0 max-w-[1280px] overflow-x-hidden px-4 py-6 md:px-6 md:py-8">
      <h1 className="text-[32px] font-semibold leading-10">Good morning, Aly</h1>
      <p className="mt-1 text-text-2">Your compass is pointing at Data Analyst — 3 habits due today.</p>

      {/* Row 1: stats */}
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Stat label="Current streak" value="7 days" aside={<Flame size={22} className="text-amber-brand" />} />
        <Card>
          <div className="text-[12px] font-semibold uppercase tracking-[0.06em] text-text-3">Habits this week</div>
          <div className="mt-2 text-[28px] font-semibold leading-8 font-display">12 of 15</div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-amber-tint">
            <div className="h-full rounded-full bg-amber-brand" style={{ width: '80%' }} />
          </div>
        </Card>
        <Stat label="Career direction" value="Data Analyst" aside={<Chip>78% fit</Chip>} />
      </div>

      {/* Row 2: habits + matches */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card
          className="lg:col-span-2"
          title="Today's habits"
          action={
            <a href="#" className="inline-flex items-center gap-1 text-[13px] font-medium text-indigo-brand">
              View all habits <ArrowRight size={14} />
            </a>
          }
        >
          <ul className="divide-y divide-line">
            {HABITS.map((h) => (
              <li key={h.name} className="flex items-center gap-3 py-3">
                <button
                  type="button"
                  aria-pressed={h.done}
                  className={[
                    'grid h-5 w-5 shrink-0 place-items-center rounded-chip border',
                    h.done ? 'border-ink bg-ink text-white' : 'border-line bg-white',
                  ].join(' ')}
                >
                  {h.done && <Check size={13} strokeWidth={3} />}
                </button>
                <span className={`min-w-0 flex-1 truncate text-[15px] ${h.done ? 'text-text-3 line-through' : ''}`}>
                  {h.name}
                </span>
                {h.assumed && (
                  <Chip tone="amber" outline>
                    Assumed
                  </Chip>
                )}
                <span className="hidden sm:inline-flex">
                  <Chip tone="neutral">{h.recurrence}</Chip>
                </span>
                <span className="w-12 shrink-0 text-right text-[13px] text-text-2">{h.minutes}m</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Your top career matches">
          <ul className="space-y-3">
            {MATCHES.map((m) => (
              <li key={m.title} className="flex gap-3 border-l-2 border-indigo-brand pl-3">
                <FitRing value={m.fit} />
                <div className="min-w-0">
                  <div className="text-[15px] font-semibold">{m.title}</div>
                  <div className="text-[13px] leading-5 text-text-2">{m.why}</div>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-[12px] text-text-3">
            Every recommendation shows its reasoning and uncertainty. Tap one to see why.
          </p>
        </Card>
      </div>

      {/* Row 3: roadmap */}
      <Card
        className="mt-4"
        title="Next steps on your roadmap"
        action={
          <button
            type="button"
            className="h-9 whitespace-nowrap rounded-card border border-ink bg-white px-3 text-[13px] font-medium text-ink hover:bg-page"
          >
            Turn a step into a habit
          </button>
        }
      >
        <ol className="grid gap-4 md:grid-cols-4">
          {ROADMAP.map((step, i) => (
            <li key={step.label} className="relative">
              <div className="flex items-center gap-2">
                <span
                  className={[
                    'grid h-7 w-7 shrink-0 place-items-center rounded-full text-[12px] font-semibold',
                    step.state === 'done'
                      ? 'bg-ink text-white'
                      : step.state === 'active'
                        ? 'border-2 border-indigo-brand bg-white text-indigo-brand'
                        : 'border border-line bg-white text-text-3',
                  ].join(' ')}
                >
                  {step.state === 'done' ? <Check size={14} strokeWidth={3} /> : i + 1}
                </span>
                {i < ROADMAP.length - 1 && <span className="hidden h-px flex-1 bg-line md:block" />}
              </div>
              <div className="mt-2 text-[14px] font-medium">{step.label}</div>
              <div className="text-[12px] text-text-3">
                {step.state === 'done' ? 'Done' : step.state === 'active' ? 'In progress' : 'Up next'}
              </div>
            </li>
          ))}
        </ol>
      </Card>

      {/* AI mentor entry point */}
      <button
        type="button"
        className="fixed bottom-20 right-5 z-20 flex h-12 items-center gap-2 rounded-full bg-ink px-4 text-[14px] font-medium text-white shadow-[0_1px_2px_rgba(15,17,21,.06),0_8px_24px_rgba(15,17,21,.18)] hover:bg-ink-hover md:bottom-6 md:right-6"
      >
        <Sparkles size={18} />
        Ask Bosla
      </button>
    </main>
  )
}
