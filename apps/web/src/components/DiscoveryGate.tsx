import { Link, Outlet } from 'react-router-dom'
import { useApp } from '../context/AppContext'

export function DiscoveryGate() {
  const { onboardingStatus, refreshOnboarding } = useApp()
  if (onboardingStatus?.discoveryReady) return <Outlet />

  return (
    <main className="mx-auto flex min-h-[65vh] max-w-[680px] items-center px-6 py-12">
      <section className="w-full rounded-2xl border border-[#E6E7EA] bg-white p-8 shadow-sm sm:p-10">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#E8EDF9] text-[#1E3A8A]">
          <span className="material-symbols-outlined">explore</span>
        </div>
        <p className="font-body text-[11px] font-semibold uppercase tracking-widest text-[#1E3A8A]">Complete discovery first</p>
        <h1 className="mt-2 font-display text-[26px] font-semibold text-[#0F1115]">Your career guidance is still taking shape</h1>
        <p className="mt-3 font-body text-[14px] leading-relaxed text-[#5B6270]">Finish your onboarding conversation to unlock career matches, the roadmap, and your AI mentor. Your answers are saved, so you can pick up where you left off.</p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link to={onboardingStatus?.nextPath ?? '/onboarding/consent'} className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#0F1115] px-4 font-body text-[13px] font-medium text-white hover:bg-[#252A34]">
            Continue onboarding <span className="material-symbols-outlined text-[17px]">arrow_forward</span>
          </Link>
          {!onboardingStatus && <button type="button" onClick={() => void refreshOnboarding()} className="rounded-lg border border-[#E6E7EA] px-4 py-2 font-body text-[13px]">Retry status check</button>}
        </div>
      </section>
    </main>
  )
}
