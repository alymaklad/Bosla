import { BookOpen, CheckCircle2, Compass, MessageCircle, TrendingUp, User } from 'lucide-react'

const NAV = [
  { key: 'discover', label: 'Discover', icon: Compass, active: true },
  { key: 'habits', label: 'Habits', icon: CheckCircle2 },
  { key: 'learn', label: 'Learn', icon: BookOpen },
  { key: 'progress', label: 'Progress', icon: TrendingUp },
  { key: 'mentor', label: 'Mentor', icon: MessageCircle },
  { key: 'profile', label: 'Profile', icon: User },
]

/** Level curve is the Habit Tracker's native one (levels.ts): floor(n) = 100·(n−1)·(n+2). */
const LEVEL = { level: 3, title: 'Disciplined', xp: 620, floor: 400, ceiling: 1000 }

export function Sidebar() {
  const pct = Math.round(((LEVEL.xp - LEVEL.floor) / (LEVEL.ceiling - LEVEL.floor)) * 100)

  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-line bg-white md:flex">
      <div className="px-5 pt-5 pb-4">
        {/* Horizontal lockup (logo file #2) at 28px — the nav-bar version. */}
        <img src="/brand/bosla-horizontal.png" alt="Bosla" className="h-9 w-auto object-contain object-left" />
      </div>

      <nav className="flex-1 px-3 space-y-0.5">
        {NAV.map(({ key, label, icon: Icon, active }) => (
          <a
            key={key}
            href="#"
            className={[
              'relative flex items-center gap-3 rounded-card px-3 py-2 text-[14px] font-medium transition-colors',
              active
                ? 'bg-indigo-tint text-indigo-brand before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-[3px] before:rounded-r before:bg-indigo-brand'
                : 'text-text-2 hover:bg-page hover:text-ink',
            ].join(' ')}
          >
            <Icon size={18} strokeWidth={1.75} />
            {label}
          </a>
        ))}
      </nav>

      <div className="m-3 rounded-card border border-line p-3">
        <div className="flex items-baseline justify-between">
          <span className="font-display text-[13px] font-semibold">Level {LEVEL.level} · {LEVEL.title}</span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-amber-tint">
          <div className="h-full rounded-full bg-amber-brand" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-1.5 text-[12px] text-text-3">
          {LEVEL.xp.toLocaleString()} / {LEVEL.ceiling.toLocaleString()} XP
        </div>
      </div>
    </aside>
  )
}
