import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { api, type LevelInfo } from '../api'

interface NavItem {
  to: string
  label: string
  icon: string
}

const NAV: NavItem[] = [
  { to: '/matches', label: 'Discover', icon: 'explore' },
  { to: '/habits', label: 'Habits', icon: 'check_circle' },
  { to: '/roadmap', label: 'Learn', icon: 'school' },
  { to: '/progress', label: 'Progress', icon: 'insights' },
  { to: '/matches', label: 'Mentor', icon: 'psychology' },
  { to: '/settings', label: 'Profile', icon: 'person' },
]

export function Sidebar() {
  const [level, setLevel] = useState<LevelInfo | null>(null)

  useEffect(() => {
    api.progress().then((p) => setLevel(p.level)).catch(() => {})
  }, [])

  const pct = level ? Math.round(level.progress * 100) : 62
  const levelNum = level?.level ?? 3
  const levelTitle = level?.title ?? 'Disciplined'
  const currentXp = level?.current_xp ?? 620
  const ceilingXp = level?.level_ceiling ?? 1000

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-60 flex-col justify-between border-r border-[#E6E7EA] bg-white md:flex">
      {/* Brand header */}
      <div>
        <div className="flex h-14 items-center border-b border-[#E6E7EA] px-5">
          <img
            src="/brand/bosla-horizontal.png"
            alt="Bosla"
            className="h-8 w-auto object-contain object-left"
          />
        </div>

        {/* Navigation links */}
        <nav className="space-y-1 py-4">
          {NAV.map(({ to, label, icon }) => (
            <NavLink
              key={label}
              to={to}
              className={({ isActive }) =>
                [
                  'group flex items-center gap-3 px-4 py-2.5 font-body text-[14px] transition-colors',
                  isActive
                    ? 'border-l-[3px] border-[#1E3A8A] bg-[#E8EDF9] font-medium text-[#1E3A8A]'
                    : 'text-[#5B6270] hover:bg-[#F0F3FF] hover:text-[#151C28]',
                ].join(' ')
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`material-symbols-outlined text-[20px] ${
                      isActive ? 'text-[#1E3A8A] fill-icon' : 'text-[#76777B] group-hover:text-[#0F1115]'
                    }`}
                  >
                    {icon}
                  </span>
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Bottom User Progression Tier Card */}
      <div className="border-t border-[#E6E7EA] p-4">
        <div className="rounded-lg border border-[#E6E7EA] bg-[#F0F3FF]/60 p-3">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px] text-[#F59E0B] fill-icon">
                military_tech
              </span>
              <span className="font-display text-[13px] font-semibold text-[#0F1115]">
                Level {levelNum} · {levelTitle}
              </span>
            </div>
          </div>
          {/* Progress bar track */}
          <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-[#E6E7EA]">
            <div
              className="h-full rounded-full bg-[#F59E0B] transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex items-center justify-between font-body text-[11px] text-[#5B6270]">
            <span className="tabular-nums">
              {currentXp.toLocaleString()} / {ceilingXp.toLocaleString()} XP
            </span>
            <span className="font-medium text-[#F59E0B]">{pct}%</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
