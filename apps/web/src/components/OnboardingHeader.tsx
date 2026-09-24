interface OnboardingHeaderProps {
  currentStep: 1 | 2 | 3 | 4
  rightStatus?: React.ReactNode
}

const STEPS = [
  { step: 1, label: 'Consent' },
  { step: 2, label: 'Career context' },
  { step: 3, label: 'Conversation' },
  { step: 4, label: 'Matches' },
]

export function OnboardingHeader({ currentStep, rightStatus }: OnboardingHeaderProps) {
  return (
    <header className="fixed top-0 right-0 left-0 z-30 h-14 border-b border-[#E6E7EA] bg-white">
      <div className="mx-auto flex h-14 max-w-[1280px] items-center justify-between px-6">
        {/* Brand Lockup */}
        <div className="flex items-center gap-3">
          <img
            src="/brand/bosla-horizontal.png"
            alt="BOSLA"
            className="h-6 w-auto object-contain"
          />
          <span className="font-light text-[#E6E7EA]">|</span>
          <span className="font-body text-[12px] font-medium text-[#5B6270]">Onboarding</span>
        </div>

        {/* Linear Stepper */}
        <nav aria-label="Onboarding Progress" className="hidden items-center gap-2 sm:flex">
          {STEPS.map((s, idx) => {
            const isCompleted = currentStep > s.step
            const isActive = currentStep === s.step
            return (
              <div key={s.step} className="flex items-center gap-2">
                {idx > 0 && <span className="font-light text-[#E6E7EA]">·</span>}
                <div
                  className={`flex items-center gap-2 font-body text-[12px] transition-colors ${
                    isActive
                      ? 'rounded-full bg-[#E8EDF9] px-2.5 py-1 font-semibold text-[#1E3A8A]'
                      : isCompleted
                        ? 'font-medium text-[#0F1115]'
                        : 'text-[#5B6270] opacity-50'
                  }`}
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
                </div>
              </div>
            )
          })}
        </nav>

        {/* Right Status / Mobile Step Indicator */}
        <div className="flex items-center gap-3">
          <div className="flex font-body text-[12px] text-[#5B6270] sm:hidden">
            Step {currentStep} of 4
          </div>
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
