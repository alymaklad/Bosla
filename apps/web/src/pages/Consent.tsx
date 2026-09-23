import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { OnboardingHeader } from '../components/OnboardingHeader'
import { useApp } from '../context/AppContext'

interface PersonaOption {
  key: string
  title: string
  subtitle: string
  icon: string
}

const PERSONAS: PersonaOption[] = [
  {
    key: 'student',
    title: 'Secondary-school student',
    subtitle: 'Choosing a study path',
    icon: 'school',
  },
  {
    key: 'university',
    title: 'University student',
    subtitle: 'Choosing a track',
    icon: 'auto_stories',
  },
  {
    key: 'graduate',
    title: 'Recent graduate',
    subtitle: "Don't know where to begin",
    icon: 'explore',
  },
  {
    key: 'switcher',
    title: 'Shifting career',
    subtitle: 'Reusing my skills in a new field',
    icon: 'swap_horiz',
  },
]

export function Consent() {
  const [persona, setPersona] = useState<string | null>('switcher')
  const [agreedAnswers, setAgreedAnswers] = useState(true)
  const [storeConversation, setStoreConversation] = useState(true)
  const [allowNotifications, setAllowNotifications] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { refreshUser } = useApp()
  const navigate = useNavigate()

  async function submit() {
    if (!persona || !agreedAnswers) return
    setBusy(true)
    setError(null)
    try {
      await api.setConsent(true, persona)
      await refreshUser()
      navigate('/onboarding/cv')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'We could not save your consent. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col justify-between bg-[#FAFAF8] text-[#0F1115] antialiased">
      <OnboardingHeader currentStep={1} />

      {/* Main Canvas Container */}
      <main className="flex-grow px-6 pt-24 pb-16">
        <div className="mx-auto max-w-4xl">
          {/* Meta Header Info */}
          <div className="mb-8">
            <div className="mb-2 inline-flex items-center gap-1.5 rounded bg-[#E7EEFF] px-2.5 py-1 font-body text-[11px] font-medium text-[#1E3A8A]">
              <span className="material-symbols-outlined text-[14px]">lock</span>
              <span>Privacy-first orientation</span>
            </div>
            <h1 className="font-display text-[28px] font-bold tracking-tight text-[#0F1115]">
              Setup your direction profile
            </h1>
            <p className="mt-1 font-body text-[14px] text-[#45474B]">
              Bosla operates with strict structural boundaries to guide long-term career planning without selling personal data.
            </p>
          </div>

          {/* Persona first, then explicit consent */}
          <div className="flex flex-col gap-6">
            {/* Left Column: Consent */}
            <section
              aria-labelledby="consent-title"
              className="order-2 flex flex-col justify-between rounded-lg border border-[#E6E7EA] bg-white p-6"
            >
              <div>
                <div className="mb-4 flex items-center justify-between border-b border-[#E6E7EA] pb-4">
                  <h2 className="font-display text-[18px] font-semibold text-[#0F1115]" id="consent-title">
                    Before we start
                  </h2>
                  <span className="font-body text-[11px] text-[#5B6270]">Step 1 of 4</span>
                </div>
                <p className="mb-6 font-body text-[14px] leading-relaxed text-[#45474B]">
                  Bosla evaluates your trajectory solely using your provided history and exploratory responses. Your data remains strictly isolated and is never monetized.
                </p>

                <div className="space-y-3.5">
                  {/* Item 1: Required */}
                  <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-[#E6E7EA] bg-white p-3 transition-colors hover:border-[#0F1115]">
                    <div className="pt-0.5">
                      <input
                        type="checkbox"
                        checked={agreedAnswers}
                        onChange={(e) => setAgreedAnswers(e.target.checked)}
                        className="h-4 w-4 cursor-pointer rounded border-[#76777B] text-[#1E3A8A] focus:ring-0"
                      />
                    </div>
                    <div className="flex-grow">
                      <div className="flex items-center gap-2">
                        <span className="font-body text-[14px] font-medium text-[#0F1115]">
                          Use my answers to recommend careers
                        </span>
                        <span className="rounded bg-[#E7EEFF] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#1E3A8A]">
                          Required
                        </span>
                      </div>
                      <p className="mt-0.5 font-body text-[12px] text-[#5B6270]">
                        Analyzed solely to map skill and role affinities.
                      </p>
                    </div>
                  </label>

                  {/* Item 2 */}
                  <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-[#E6E7EA] bg-white p-3 transition-colors hover:border-[#0F1115]">
                    <div className="pt-0.5">
                      <input
                        type="checkbox"
                        checked={storeConversation}
                        onChange={(e) => setStoreConversation(e.target.checked)}
                        className="h-4 w-4 cursor-pointer rounded border-[#76777B] text-[#1E3A8A] focus:ring-0"
                      />
                    </div>
                    <div className="flex-grow">
                      <span className="font-body text-[14px] font-medium text-[#0F1115]">
                        Store my conversation so I can come back later
                      </span>
                      <p className="mt-0.5 font-body text-[12px] text-[#5B6270]">
                        Encrypted and associated with your session.
                      </p>
                    </div>
                  </label>

                  {/* Item 3 */}
                  <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-[#E6E7EA] bg-white p-3 transition-colors hover:border-[#0F1115]">
                    <div className="pt-0.5">
                      <input
                        type="checkbox"
                        checked={allowNotifications}
                        onChange={(e) => setAllowNotifications(e.target.checked)}
                        className="h-4 w-4 cursor-pointer rounded border-[#76777B] text-[#1E3A8A] focus:ring-0"
                      />
                    </div>
                    <div className="flex-grow">
                      <span className="font-body text-[14px] font-medium text-[#0F1115]">
                        Allow notifications for habit reminders
                      </span>
                      <p className="mt-0.5 font-body text-[12px] text-[#5B6270]">
                        Gentle nudges for daily commitments.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-2 border-t border-[#E6E7EA] pt-4 text-[#5B6270]">
                <span className="material-symbols-outlined text-[16px] text-[#76777B]">shield</span>
                <span className="font-body text-[11px]">Encrypted transport and user-controlled deletion</span>
              </div>
            </section>

            {/* Right Column: Where are you right now? */}
            <section
              aria-labelledby="status-title"
              className="order-1 flex flex-col justify-between rounded-lg border border-[#E6E7EA] bg-white p-6"
            >
              <div>
                <div className="mb-4 flex items-center justify-between border-b border-[#E6E7EA] pb-4">
                  <h2 className="font-display text-[18px] font-semibold text-[#0F1115]" id="status-title">
                    Where are you right now?
                  </h2>
                  <span className="font-body text-[11px] font-medium text-[#1E3A8A]">
                    Single selection
                  </span>
                </div>

                {/* 2x2 Persona Card Grid */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2" role="radiogroup">
                  {PERSONAS.map((p) => {
                    const isSelected = persona === p.key
                    return (
                      <div
                        key={p.key}
                        role="radio"
                        aria-checked={isSelected}
                        tabIndex={0}
                        onClick={() => setPersona(p.key)}
                        onKeyDown={(e) => e.key === 'Enter' && setPersona(p.key)}
                        className={[
                          'group flex min-h-[120px] cursor-pointer flex-col justify-between rounded-lg p-4 transition-all',
                          isSelected
                            ? 'border-2 border-[#1E3A8A] bg-[#E8EDF9]'
                            : 'border border-[#E6E7EA] bg-white hover:border-[#0F1115]',
                        ].join(' ')}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`material-symbols-outlined text-[20px] transition-colors ${
                              isSelected ? 'text-[#1E3A8A]' : 'text-[#76777B] group-hover:text-[#0F1115]'
                            }`}
                          >
                            {p.icon}
                          </span>
                          <span
                            className={`h-3.5 w-3.5 rounded-full ${
                              isSelected
                                ? 'border-4 border-[#1E3A8A] bg-white'
                                : 'border border-[#C6C6CB]'
                            }`}
                          />
                        </div>
                        <div className="mt-4">
                          <div
                            className={`font-body text-[14px] font-medium leading-snug ${
                              isSelected ? 'text-[#1E3A8A]' : 'text-[#0F1115]'
                            }`}
                          >
                            {p.title}
                          </div>
                          <div
                            className={`mt-0.5 font-body text-[12px] ${
                              isSelected ? 'text-[#1E3A8A]/80' : 'text-[#5B6270]'
                            }`}
                          >
                            {p.subtitle}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="mt-6 border-t border-[#E6E7EA] pt-4">
                <p className="font-body text-[11px] text-[#5B6270]">
                  This anchors the depth and terminology of your interactive session.
                </p>
              </div>
            </section>
          </div>

          {error && <p className="mt-4 text-[13px] text-[#DC2626]">{error}</p>}

          {/* Bottom Action Bar */}
          <div className="mt-8 flex flex-col items-start justify-between gap-4 border-t border-[#E6E7EA] pt-6 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 font-body text-[12px] text-[#5B6270]">
              <span className="material-symbols-outlined text-[16px]">info</span>
              <span>Consent preferences can be revised in Account Settings at any point</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/signin')}
                className="h-10 rounded-lg border border-[#E6E7EA] bg-white px-4 font-body text-[14px] font-medium text-[#0F1115] transition-colors hover:border-[#0F1115] hover:bg-[#FAFAF8]"
              >
                Back
              </button>
              <button
                type="button"
                disabled={!persona || !agreedAnswers || busy}
                onClick={submit}
                className="flex h-10 items-center gap-2 rounded-lg bg-[#0F1115] px-5 font-body text-[14px] font-medium text-white transition-colors hover:bg-[#1C1F26] disabled:opacity-40"
              >
                <span>{busy ? 'Saving…' : 'Continue'}</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Subtle Footer Indicator */}
      <footer className="border-t border-[#E6E7EA] bg-white py-4 text-center">
        <div className="mx-auto flex max-w-4xl flex-col items-center justify-between gap-2 px-6 font-body text-[11px] text-[#5B6270] sm:flex-row">
          <span>Bosla Career Navigation Infrastructure</span>
          <span>System version 2.4.0 — All interactions calibrated for deliberate planning</span>
        </div>
      </footer>
    </div>
  )
}
