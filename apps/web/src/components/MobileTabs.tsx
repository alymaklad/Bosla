import { BookOpen, CheckCircle2, TrendingUp, User } from 'lucide-react'
import { NavLink } from 'react-router-dom'

/** Mobile (<768px) bottom tab bar. The compass mark is the Discover tab icon. */
export function MobileTabs() {
  const tab = ({ isActive }: { isActive: boolean }) =>
    `flex flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-medium transition-all ${isActive ? 'bg-[#E8EDF9] text-ink' : 'text-text-2 hover:bg-[#F4F7FF]'}`

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 grid h-[72px] grid-cols-5 gap-1 border-t border-line bg-white/95 px-2 pb-[max(0.25rem,env(safe-area-inset-bottom))] pt-1 backdrop-blur-xl md:hidden" aria-label="Mobile navigation">
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
