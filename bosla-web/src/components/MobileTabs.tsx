import { BookOpen, CheckCircle2, TrendingUp, User } from 'lucide-react'

/** Mobile (<768px) bottom tab bar. The compass mark is the Discover tab icon. */
export function MobileTabs() {
  const tab = 'flex flex-col items-center gap-1 text-[11px] font-medium text-text-2'
  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 grid h-16 grid-cols-5 border-t border-line bg-white md:hidden">
      <a href="#" className={`${tab} text-ink`}>
        <img src="/brand/bosla-mark.png" alt="" className="h-6 w-6 object-contain" />
        Discover
      </a>
      <a href="#" className={tab}>
        <CheckCircle2 size={22} strokeWidth={1.75} />
        Habits
      </a>
      <a href="#" className={tab}>
        <BookOpen size={22} strokeWidth={1.75} />
        Learn
      </a>
      <a href="#" className={tab}>
        <TrendingUp size={22} strokeWidth={1.75} />
        Progress
      </a>
      <a href="#" className={tab}>
        <User size={22} strokeWidth={1.75} />
        Profile
      </a>
    </nav>
  )
}
