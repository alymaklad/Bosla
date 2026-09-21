import { BookOpen, CheckCircle2, Compass, MessageCircle, TrendingUp, User } from 'lucide-react'
import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { api, type LevelInfo } from '../api'

const NAV = [
  { to: '/matches', label: 'Discover', icon: Compass },
  { to: '/habits', label: 'Habits', icon: CheckCircle2 },
  { to: '/roadmap', label: 'Learn', icon: BookOpen },
  { to: '/progress', label: 'Progress', icon: TrendingUp },
  { to: '/matches', label: 'Mentor', icon: MessageCircle },
  { to: '/settings', label: 'Profile', icon: User },
]

export function Sidebar() {
  const [level, setLevel] = useState<LevelInfo | null>(null)

  useEffect(() => {
    api.progress().then((p) => setLevel(p.level)).catch(() => {})
  }, [])

  const pct = level ? Math.round(level.progress * 100) : 0

  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-line bg-white md:flex">
      <div className="px-5 pt-5 pb-4">
        <img src="/brand/bosla-horizontal.png" alt="Bosla" className="h-9 w-auto object-contain object-left" />
      </div>

      <nav className="flex-1 px-3 space-y-0.5">
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={label}
            to={to}
            className={({ isActive }) =>
              [
                'relative flex items-center gap-3 rounded-card px-3 py-2 text-[14px] font-medium transition-colors',
                isActive
                  ? 'bg-indigo-tint text-indigo-brand before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-[3px] before:rounded-r before:bg-indigo-brand'
                  : 'text-text-2 hover:bg-page hover:text-ink',
              ].join(' ')
            }
          >
            <Icon size={18} strokeWidth={1.75} />
            {label}
          </NavLink>
        ))}
      </nav>

      {level && (
        <div className="m-3 rounded-card border border-line p-3">
          <div className="flex items-baseline justify-between">
            <span className="font-display text-[13px] font-semibold">
              Level {level.level} · {level.title}
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-amber-tint">
            <div className="h-full rounded-full bg-amber-brand" style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-1.5 text-[12px] text-text-3">
            {level.current_xp.toLocaleString()} / {level.level_ceiling.toLocaleString()} XP
          </div>
        </div>
      )}
    </aside>
  )
}
