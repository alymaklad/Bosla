import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

export function TopBar() {
  const { user, signOut } = useApp()
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const initial = (user?.name || user?.email || 'A').slice(0, 1).toUpperCase()
  const displayName = user?.name || user?.email?.split('@')[0] || 'User'
  const personaTrack = user?.persona
    ? user.persona.charAt(0).toUpperCase() + user.persona.slice(1) + ' Track'
    : 'Professional Track'

  return (
    <header className="fixed top-0 right-0 left-0 z-30 flex h-14 items-center justify-between border-b border-[#E6E7EA] bg-white px-4 md:left-60 md:px-6">
      {/* Search Bar */}
      <div className="relative w-72 sm:w-80">
        <span
          className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[#8A8F98]"
          data-icon="search"
        >
          search
        </span>
        <input
          type="search"
          placeholder="Search careers, habits, courses"
          className="h-9 w-full rounded-lg border border-[#E6E7EA] bg-[#FAFAF8] pl-9 pr-12 font-body text-[13px] text-[#0F1115] placeholder-[#8A8F98] outline-none transition-colors focus:border-[#1E3A8A]"
        />
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5">
          <kbd className="hidden rounded border border-[#E6E7EA] bg-white px-1.5 py-0.5 font-mono text-[11px] font-medium text-[#5B6270] sm:inline-block">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Trailing Utilities */}
      <div className="flex items-center gap-4">
        {/* Notifications with Amber Dot */}
        <button
          type="button"
          aria-label="Notifications"
          className="relative rounded-lg p-2 text-[#5B6270] transition-colors hover:bg-[#F0F3FF] hover:text-[#0F1115]"
        >
          <span className="material-symbols-outlined text-[20px]" data-icon="notifications">
            notifications
          </span>
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#F59E0B]" />
        </button>

        <div className="h-4 w-px bg-[#E6E7EA]" />

        {/* User Profile Avatar Lockup */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setDropdownOpen((v) => !v)}
            className="flex items-center gap-2.5 text-left transition-opacity hover:opacity-85"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0F1115] font-display text-[13px] font-bold text-white">
              {initial}
            </div>
            <div className="hidden flex-col sm:flex">
              <span className="font-body text-[13px] font-medium leading-tight text-[#0F1115]">
                {displayName}
              </span>
              <span className="font-body text-[11px] leading-tight text-[#5B6270]">
                {personaTrack}
              </span>
            </div>
          </button>

          {/* Profile Dropdown */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-lg border border-[#E6E7EA] bg-white py-1 shadow-lg">
              <div className="border-b border-[#E6E7EA] px-4 py-2 sm:hidden">
                <p className="font-body text-[13px] font-medium text-[#0F1115]">{displayName}</p>
                <p className="font-body text-[11px] text-[#5B6270]">{user?.email}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setDropdownOpen(false)
                  navigate('/settings')
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-left font-body text-[13px] text-[#5B6270] hover:bg-[#F0F3FF] hover:text-[#0F1115]"
              >
                <span className="material-symbols-outlined text-[16px]">settings</span>
                Settings
              </button>
              <button
                type="button"
                onClick={async () => {
                  setDropdownOpen(false)
                  await signOut()
                  navigate('/')
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-left font-body text-[13px] text-[#DC2626] hover:bg-[#FFDAD6]/30"
              >
                <span className="material-symbols-outlined text-[16px]">logout</span>
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
