import { Link } from 'react-router-dom'

interface OnboardingHeaderProps {
  currentStep: 1 | 2 | 3 | 4
  rightStatus?: React.ReactNode
}

const STEPS = [
  { step: 1, label: 'Consent', to: '/onboarding/consent' },
  { step: 2, label: 'Career context', to: '/onboarding/cv' },
  { step: 3, label: 'Conversation', to: '/onboarding/discovery' },
  { step: 4, label: 'Matches', to: '/matches' },
]

export function OnboardingHeader({ currentStep, rightStatus }: OnboardingHeaderProps) {
  return (
    <header className="fixed top-0 right-0 left-0 z-30 h-14 border-b border-[#E6E7EA] bg-white">
      <div className="mx-auto flex h-14 max-w-[1280px] items-center justify-between px-6">
        {/* Brand Lockup */}
        <div className="flex items-center gap-3">
          <Link to="/dashboard" aria-label="Bosla home" className="rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1E3A8A]"><img
            src="/brand/bosla-horizontal.png"
            alt="BOSLA"
            className="h-6 w-auto object-contain"
          /></Link>
          <span className="font-light text-[#E6E7EA]">|</span>
          <span className="font-body text-[12px] font-medium text-[#5B6270]">Onboarding</span>
        </div>

        {/* Linear Stepper */}
        <nav aria-label="Onboarding steps" className="hidden items-center gap-2 sm:flex">
          {STEPS.map((s, idx) => {
            const isCompleted = currentStep > s.step
            const isActive = currentStep === s.step
            return (
              <div key={s.step} className="flex items-center gap-2">
                {idx > 0 && <span className="font-light text-[#E6E7EA]">·</span>}
                <Link
                  to={s.to}
                  aria-current={isActive ? 'step' : undefined}
                  className={`flex items-center gap-2 font-body text-[12px] transition-colors ${
                    isActive
                      ? 'rounded-full bg-[#E8EDF9] px-2.5 py-1 font-semibold text-[#1E3A8A]'
                      : isCompleted
                        ? 'font-medium text-[#0F1115]'
                        : 'text-[#5B6270]'
                  } hover:text-[#1E3A8A] focus-visible:rounded-full focus-visible:outline-2 focus-visible:outline-[#1E3A8A]`}
                >
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-medium ${
                      isActive
                        ? 'bg-[#1E3A8A] text-white'
                        : isCompleted
                          ? 'bg-[#0F1115] text-white'
                          : 'bg-[#E6E7EA] text-[#5B6270]'
                    }`}
                  >
                    {isCompleted ? (
                      <span className="material-symbols-outlined text-[13px]">check</span>
                    ) : (
                      s.step
                    )}
                  </span>
                  <span>{s.label}</span>
                </Link>
              </div>
            )
          })}
        </nav>

        {/* Right Status / Mobile Step Indicator */}
        <div className="flex items-center gap-3">
          <details className="relative sm:hidden">
            <summary className="cursor-pointer list-none rounded-lg px-2 py-1 font-body text-[12px] font-medium text-[#1E3A8A]">Steps {currentStep}/4</summary>
            <nav aria-label="Onboarding steps" className="absolute right-0 top-9 z-50 flex w-44 flex-col rounded-xl border border-[#E6E7EA] bg-white p-1.5 shadow-lg">
              {STEPS.map((step) => <Link key={step.step} to={step.to} aria-current={currentStep === step.step ? 'step' : undefined} className="rounded-lg px-3 py-2 font-body text-[12px] text-[#0F1115] hover:bg-[#E8EDF9]">{step.step}. {step.label}</Link>)}
            </nav>
          </details>
          <Link to="/dashboard" className="rounded-lg border border-[#E6E7EA] px-3 py-1.5 font-body text-[12px] font-medium text-[#0F1115] transition-colors hover:bg-[#F4F5F7]">Save &amp; leave</Link>
          {rightStatus ?? (
            <div className="hidden items-center gap-1.5 font-body text-[12px] text-[#5B6270] md:flex">
              <span className="h-2 w-2 rounded-full bg-[#16A34A]" />
              <span>Session synced</span>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
