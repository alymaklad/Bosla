import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, HABITS_CHANGED_EVENT, type DashboardData } from '../api'
import { useApp } from '../context/AppContext'

export function TopBar() {
  const { user, signOut, onboardingStatus } = useApp()
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [summary, setSummary] = useState<DashboardData | null>(null)

  useEffect(() => {
    if (!onboardingStatus?.completed) return
    let active = true
    const refresh = () => {
      void api.dashboard().then((value) => {
        if (active) setSummary(value)
      }).catch(() => {
        if (active) setSummary(null)
      })
    }
    refresh()
    window.addEventListener(HABITS_CHANGED_EVENT, refresh)
    return () => {
      active = false
      window.removeEventListener(HABITS_CHANGED_EVENT, refresh)
    }
  }, [onboardingStatus?.completed, user?.id])

  const initial = (user?.name || user?.email || 'A').slice(0, 1).toUpperCase()
  const displayName = user?.name || user?.email?.split('@')[0] || 'User'
  const personaTrack = user?.persona
    ? ({
        student: 'Secondary-school student',
        university: 'University student',
        graduate: 'Recent graduate',
        switcher: 'Shifting career',
      }[user.persona] || user.persona)
    : 'Direction not selected'

  const hasSetupReminder = user ? !onboardingStatus?.completed : false
  const today = summary?.today ?? []
  const todayCompleted = today.filter((item) => item.status === 'complete').length
  const journey = !onboardingStatus
    ? { eyebrow: 'Your journey', title: 'Checking your progress', detail: '', href: '/settings', action: 'View profile', progress: null }
    : !onboardingStatus.consentGiven
      ? { eyebrow: 'Your journey · Step 1 of 4', title: 'Set your preferences', detail: 'Start when you are ready', href: onboardingStatus.nextPath, action: 'Continue', progress: 0 }
      : !onboardingStatus.discoveryReady
        ? onboardingStatus.nextPath === '/onboarding/cv'
          ? { eyebrow: 'Your journey · Step 2 of 4', title: 'Add career context', detail: 'Your progress is saved', href: onboardingStatus.nextPath, action: 'Continue', progress: 25 }
          : { eyebrow: 'Your journey · Step 3 of 4', title: 'Discovery in progress', detail: 'Your answers are saved', href: onboardingStatus.nextPath, action: 'Resume', progress: 50 }
        : !onboardingStatus.matchesGenerated
          ? { eyebrow: 'Your journey · Step 4 of 4', title: 'Ready to explore matches', detail: 'Your conversation is saved', href: onboardingStatus.nextPath, action: 'Explore', progress: 75 }
          : summary?.chosen_direction && today.length > 0
            ? { eyebrow: 'Your journey · Today', title: summary.chosen_direction, detail: `${todayCompleted} of ${today.length} habits complete`, href: '/habits', action: 'View habits', progress: null }
            : summary?.chosen_direction
              ? { eyebrow: 'Your journey · Direction selected', title: summary.chosen_direction, detail: 'Your career direction', href: '/roadmap', action: 'Open roadmap', progress: null }
              : { eyebrow: 'Your journey · Discovery complete', title: 'Your matches are ready', detail: 'Choose a direction', href: '/matches', action: 'View matches', progress: null }

  return (
    <header className="fixed top-0 right-0 left-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-[#E6E7EA]/90 bg-white/90 px-4 backdrop-blur-xl md:left-64 md:px-7">
      <div className="flex min-w-0 items-center gap-3 sm:gap-4" aria-label="Your journey status">
        <span className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#E8EDF9] text-[#1E3A8A] lg:inline-flex">
          <span className="material-symbols-outlined text-[20px]" aria-hidden="true">explore</span>
        </span>
        <div className="min-w-0">
          <p className="hidden font-body text-[10px] font-semibold uppercase tracking-[0.08em] text-[#1E3A8A] sm:block">{journey.eyebrow}</p>
          <p className="truncate font-body text-[12px] font-semibold text-[#0F1115] sm:text-[13px]">{journey.title}</p>
          {journey.progress !== null ? (
            <div className="mt-1 hidden h-1 w-28 overflow-hidden rounded-full bg-[#E8EDF9] sm:block" role="progressbar" aria-label="Onboarding milestones" aria-valuenow={journey.progress} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-full rounded-full bg-[#1E3A8A]" style={{ width: `${journey.progress}%` }} />
            </div>
          ) : <p className="hidden truncate font-body text-[11px] text-[#5B6270] sm:block">{journey.detail}</p>}
        </div>
        <Link to={journey.href} className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-[#DCE4FA] bg-white px-2.5 py-1.5 font-body text-[11px] font-semibold text-[#1E3A8A] transition-colors hover:border-[#1E3A8A] hover:bg-[#F0F3FF] focus-visible:outline-2 focus-visible:outline-[#1E3A8A] sm:px-3 sm:text-[12px]">
          {journey.action}<span className="material-symbols-outlined text-[15px]" aria-hidden="true">arrow_forward</span>
        </Link>
      </div>
      {/* Trailing Utilities */}
      <div className="flex shrink-0 items-center gap-3">
        <div className="relative">
          <button
            type="button"
            aria-label="Notifications"
            aria-expanded={notificationsOpen}
            onClick={() => {
              setNotificationsOpen((value) => !value)
              setDropdownOpen(false)
            }}
            className="relative flex h-9 w-9 items-center justify-center rounded-xl text-[#5B6270] hover:bg-[#F0F3FF] hover:text-[#1E3A8A]"
          >
            <span className="material-symbols-outlined text-[20px]" data-icon="notifications">notifications</span>
            {hasSetupReminder && <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-white bg-[#F59E0B]" />}
          </button>
          {notificationsOpen && (
            <section className="absolute right-0 mt-2 w-80 overflow-hidden rounded-2xl border border-[#E6E7EA] bg-white shadow-xl" aria-label="Notifications">
              <div className="flex items-center justify-between border-b border-[#E6E7EA] px-4 py-3">
                <div>
                  <p className="font-display text-[14px] font-semibold text-[#0F1115]">Notifications</p>
                  <p className="font-body text-[11px] text-[#76777B]">Your Bosla workspace updates</p>
                </div>
                <button type="button" onClick={() => setNotificationsOpen(false)} className="flex h-7 w-7 items-center justify-center rounded-lg text-[#5B6270] hover:bg-[#F0F3FF]" aria-label="Close notifications">
                  <span className="material-symbols-outlined text-[17px]">close</span>
                </button>
              </div>
              {hasSetupReminder ? (
                <button
                  type="button"
                  onClick={() => { setNotificationsOpen(false); navigate(onboardingStatus?.nextPath ?? '/onboarding/consent') }}
                  className="flex w-full items-start gap-3 px-4 py-4 text-left hover:bg-[#F8FAFF]"
                >
                  <span className="material-symbols-outlined mt-0.5 text-[19px] text-[#1E3A8A]">flag</span>
                  <span>
                    <span className="block font-body text-[13px] font-medium text-[#0F1115]">Complete your direction profile</span>
                    <span className="mt-0.5 block font-body text-[12px] leading-relaxed text-[#5B6270]">Your progress is saved. Continue where you left off to unlock career guidance.</span>
                  </span>
                </button>
              ) : (
                <div className="flex items-start gap-3 px-4 py-5">
                  <span className="material-symbols-outlined mt-0.5 text-[19px] text-[#16A34A]">check_circle</span>
                  <span>
                    <span className="block font-body text-[13px] font-medium text-[#0F1115]">You are all caught up</span>
                    <span className="mt-0.5 block font-body text-[12px] leading-relaxed text-[#5B6270]">New habit and mentor updates will appear here.</span>
                  </span>
                </div>
              )}
            </section>
          )}
        </div>

        <div className="h-4 w-px bg-[#E6E7EA]" />

        {/* User Profile Avatar Lockup */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setDropdownOpen((v) => !v)}
            className="flex items-center gap-2.5 rounded-xl px-1.5 py-1 text-left hover:bg-[#F0F3FF]"
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
