import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { api, type LevelInfo } from '../api'

interface NavItem {
  to: string
  label: string
  icon: string
}

const NAV: NavItem[] = [
  { to: '/dashboard', label: 'Home', icon: 'home' },
  { to: '/matches', label: 'Discover', icon: 'explore' },
  { to: '/habits', label: 'Habits', icon: 'check_circle' },
  { to: '/roadmap', label: 'Learn', icon: 'school' },
  { to: '/progress', label: 'Progress', icon: 'insights' },
  { to: '/mentor', label: 'Mentor', icon: 'psychology' },
  { to: '/settings', label: 'Profile', icon: 'person' },
]

export function Sidebar() {
  const [level, setLevel] = useState<LevelInfo | null>(null)

  useEffect(() => {
    api.progress().then((p) => setLevel(p.level)).catch(() => {})
  }, [])

  const pct = level ? Math.round(level.progress * 100) : 0

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col justify-between border-r border-[#E6E7EA]/90 bg-[#FCFCFB] md:flex">
      {/* Brand header */}
      <div>
        <div className="flex h-16 items-center border-b border-[#E6E7EA]/90 px-5">
          <Link to="/dashboard" aria-label="Bosla home" className="rounded-md focus-visible:outline-2 focus-visible:outline-[#1E3A8A]"><img
            src="/brand/bosla-horizontal.png"
            alt="Bosla"
            className="h-8 w-auto object-contain object-left"
          /></Link>
        </div>

        {/* Navigation links */}
        <nav className="space-y-1 px-3 py-5" aria-label="Primary navigation">
          {NAV.map(({ to, label, icon }) => (
            <NavLink
              key={label}
              to={to}
              className={({ isActive }) =>
                [
                  'group flex items-center gap-3 rounded-xl px-3.5 py-2.5 font-body text-[14px] transition-all',
                  isActive
                    ? 'bg-[#E8EDF9] font-medium text-[#1E3A8A] shadow-[inset_0_0_0_1px_rgba(30,58,138,0.08)]'
                    : 'text-[#5B6270] hover:bg-white hover:text-[#151C28] hover:shadow-sm',
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
      {level && <div className="border-t border-[#E6E7EA]/90 p-4">
        <div className="rounded-2xl border border-[#DCE4FA] bg-[#F4F7FF] p-3.5">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px] text-[#F59E0B] fill-icon">
                military_tech
              </span>
              <span className="font-display text-[13px] font-semibold text-[#0F1115]">
                Level {level.level} · {level.title}
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
              {level.current_xp.toLocaleString()} / {level.level_ceiling.toLocaleString()} XP
            </span>
            <span className="font-medium text-[#F59E0B]">{pct}%</span>
          </div>
        </div>
      </div>}
    </aside>
  )
}
