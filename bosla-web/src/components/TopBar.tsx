import { Bell, Search } from 'lucide-react'

export function TopBar() {
  return (
    <header className="flex h-14 items-center gap-4 border-b border-line bg-white px-4 md:px-6">
      {/* Compass mark alone (logo file #4) — the mobile/collapsed-rail version. */}
      <img src="/brand/bosla-mark.png" alt="Bosla" className="h-8 w-8 object-contain md:hidden" />

      <label className="relative flex-1 max-w-xl">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-3" />
        <input
          type="search"
          placeholder="Search careers, habits, courses"
          className="h-9 w-full rounded-card border border-line bg-page pl-9 pr-3 text-[14px] outline-none placeholder:text-text-3 focus:border-ink"
        />
      </label>

      <div className="ml-auto flex items-center gap-3">
        <button
          type="button"
          aria-label="Notifications"
          className="relative grid h-9 w-9 place-items-center rounded-card border border-line bg-white text-text-2 hover:text-ink"
        >
          <Bell size={18} strokeWidth={1.75} />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-amber-brand" />
        </button>
        <div className="grid h-9 w-9 place-items-center rounded-full bg-ink text-[13px] font-semibold text-white">
          A
        </div>
      </div>
    </header>
  )
}
