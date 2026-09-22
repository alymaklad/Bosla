import { BookOpen, CheckCircle2, TrendingUp, User } from 'lucide-react'
import { NavLink } from 'react-router-dom'

/** Mobile (<768px) bottom tab bar. The compass mark is the Discover tab icon. */
export function MobileTabs() {
  const tab = ({ isActive }: { isActive: boolean }) =>
    `flex flex-col items-center gap-1 text-[11px] font-medium ${isActive ? 'text-ink' : 'text-text-2'}`

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 grid h-16 grid-cols-5 border-t border-line bg-white md:hidden">
      <NavLink to="/matches" className={tab}>
        <img src="/brand/bosla-mark.png" alt="" className="h-6 w-6 object-contain" />
        Discover
      </NavLink>
      <NavLink to="/habits" className={tab}>
        <CheckCircle2 size={22} strokeWidth={1.75} />
        Habits
      </NavLink>
      <NavLink to="/roadmap" className={tab}>
        <BookOpen size={22} strokeWidth={1.75} />
        Learn
      </NavLink>
      <NavLink to="/progress" className={tab}>
        <TrendingUp size={22} strokeWidth={1.75} />
        Progress
      </NavLink>
      <NavLink to="/settings" className={tab}>
        <User size={22} strokeWidth={1.75} />
        Profile
      </NavLink>
    </nav>
  )
}
