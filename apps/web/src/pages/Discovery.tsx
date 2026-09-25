import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, type DiscoveryMessage, type DiscoveryProfile } from '../api'
import { OnboardingHeader } from '../components/OnboardingHeader'
import { ErrorToast } from '../components/ErrorToast'
import { PageLoading } from '../components/PageLoading'
import { useApp } from '../context/AppContext'

type DimensionKey = 'interests' | 'strengths' | 'skills' | 'experience' | 'motivations'

const DIMENSION_KEYS: { key: DimensionKey; label: string }[] = [
  { key: 'interests', label: 'Interests' },
  { key: 'strengths', label: 'Strengths' },
  { key: 'skills', label: 'Skills' },
  { key: 'experience', label: 'Experience' },
  { key: 'motivations', label: 'Motivations' },
]

export function Discovery() {
  const { user, refreshOnboarding } = useApp()
  const [messages, setMessages] = useState<DiscoveryMessage[]>([])
  const [profile, setProfile] = useState<DiscoveryProfile | null>(null)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [preparing, setPreparing] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    api.discoveryMessages().then(async (existing) => {
      if (existing.length === 0) {
        const opening = await api.startDiscovery(user?.persona)
        setMessages([opening])
      } else {
        setMessages(existing)
        api.discoveryProfile().then(setProfile).catch(() => {})
      }
    }).catch(() => setError('Could not load conversation. Check your connection and retry.')).finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, sending])

  if (loading) return <PageLoading label="Loading your discovery conversation…" />

  async function send() {
    const text = input.trim()
    if (!text || sending) return
    setInput('')
    setMessages((m) => [...m, { role: 'user', content: text }])
    setSending(true)
    setMessages((m) => [...m, { role: 'assistant', content: '' }])

    try {
      await api.sendDiscoveryMessage(text, {
        onChunk: (chunk) => {
          setMessages((m) => {
            const copy = [...m]
            copy[copy.length - 1] = {
              role: 'assistant',
              content: copy[copy.length - 1].content + chunk,
            }
            return copy
          })
        },
        onDone: (p) => {
          setProfile(p)
          setSending(false)
          void refreshOnboarding().catch(() => {})
        },
      })
    } catch (err) {
      setMessages((m) => m.slice(0, -1))
      setError(err instanceof Error ? err.message : 'Connection failed. Please retry.')
      setSending(false)
    }
  }

  async function getMatches() {
    if (!profile?.ready) {
      setError('Keep talking with Bosla until the five career signals are clear. You can leave now and finish later.')
      return
    }
    setError(null)
    try {
      setPreparing('Reading everything you shared…')
      let assessmentText = ''
      await api.runAssessment({
        onChunk: () => {},
        onDone: (text) => {
          assessmentText = text
        },
      })
      if (!assessmentText) {
        setError('Assessment could not be completed. Please try again.')
        return
      }
      setPreparing('Ranking career directions…')
      await api.generateMatches()
      await refreshOnboarding()
      navigate('/matches')
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not generate matches. Check your connection and retry.',
      )
    } finally {
      setPreparing(null)
    }
  }

  if (preparing) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#FAFAF8] px-6 text-center">
        <span className="material-symbols-outlined animate-spin text-[32px] text-[#1E3A8A]">
          refresh
        </span>
        <p className="font-display text-[18px] font-semibold text-[#0F1115]">{preparing}</p>
        <p className="font-body text-[13px] text-[#5B6270]">This takes a few seconds.</p>
      </div>
    )
  }

  const turnCount = messages.filter((m) => m.role === 'user').length + 1
  const firstName = (user?.name || 'there').split(' ')[0]

  return (
    <div className="flex min-h-screen flex-col justify-between bg-[#FAFAF8] text-[#0F1115] antialiased">
      <ErrorToast message={error} onDismiss={() => setError(null)} />
      <OnboardingHeader currentStep={3} />

      {/* Main Canvas */}
      <main className="mx-auto w-full max-w-[1280px] flex-1 px-6 pt-20 pb-8">
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
          {/* Left Column: Chat Conversation Panel (8 cols) */}
          <section className="flex flex-col rounded-lg border border-[#E6E7EA] bg-white lg:col-span-8">
            {/* Conversation Header */}
            <div className="flex items-center justify-between border-b border-[#E6E7EA] px-6 py-5">
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <span className="rounded bg-[#E7EEFF] px-2 py-0.5 font-body text-[11px] font-medium text-[#1E3A8A]">
                    STEP 3 OF 4
                  </span>
                  <span className="font-body text-[11px] uppercase tracking-wider text-[#5B6270]">
                    ORIENTATION ENGINE
                  </span>
                </div>
                <h1 className="font-display text-[22px] font-semibold tracking-tight text-[#0F1115]">
                  Let's find your direction
                </h1>
                <p className="mt-2 font-body text-[12px] text-[#5B6270]">Saved automatically. Use the steps above to revisit your career context.</p>
              </div>
              <div className="hidden text-right sm:block">
                <div className="font-body text-[11px] text-[#5B6270]">Progress to unlock</div>
                <div className="font-body text-[14px] font-medium text-[#0F1115]">
                  Turn {turnCount} of ~12
                </div>
              </div>
            </div>

            {/* Chat Stream Canvas */}
            <div ref={scrollRef} className="h-[480px] space-y-6 overflow-y-auto p-6">
              {messages.map((m, idx) => {
                if (m.role === 'assistant') {
                  const isLast = idx === messages.length - 1
                  return (
                    <div key={idx} className="flex max-w-2xl flex-col items-start gap-1">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="font-body text-[11px] font-medium text-[#1E3A8A]">
                          Bosla Orientation
                        </span>
                        <span className="font-body text-[11px] text-[#8A8F98]">Assistant</span>
                      </div>
                      <div className="relative rounded-lg border border-[#E6E7EA] border-l-[3px] border-l-[#1E3A8A] bg-white p-4 font-body text-[14px] leading-relaxed text-[#0F1115]">
                        <span className="whitespace-pre-wrap">{m.content}</span>
                        {isLast && sending && (
                          <span className="ml-1 inline-block h-4 w-1.5 animate-pulse bg-[#1E3A8A] align-middle" />
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setInput('Could you rephrase that question in another way?')
                        }}
                        className="mt-1 flex items-center gap-1 font-body text-[11px] text-[#5B6270] transition-colors hover:text-[#0F1115]"
                      >
                        <span className="material-symbols-outlined text-[14px]">refresh</span>
                        Rephrase this question
                      </button>
                    </div>
                  )
                }

                return (
                  <div key={idx} className="ml-auto flex max-w-xl flex-col items-end gap-1">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="font-body text-[11px] text-[#5B6270]">{firstName}</span>
                    </div>
                    <div className="rounded-lg bg-[#F0F1F3] p-4 font-body text-[14px] leading-relaxed text-[#0F1115]">
                      <span className="whitespace-pre-wrap">{m.content}</span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Chat Input Footer */}
            <div className="rounded-b-lg border-t border-[#E6E7EA] bg-white p-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  send()
                }}
                className="flex items-center gap-3"
              >
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={input}
                    disabled={sending}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your answer…"
                    className="h-10 w-full rounded-lg border border-[#E6E7EA] bg-white px-4 font-body text-[14px] text-[#0F1115] placeholder-[#8A8F98] outline-none transition-colors focus:border-[#1E3A8A]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!input.trim() || sending}
                  className="flex h-10 items-center justify-center gap-1.5 rounded-lg bg-[#0F1115] px-5 font-body text-[14px] font-medium text-white transition-colors hover:bg-[#1C1F26] disabled:opacity-50"
                >
                  <span>Send</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_upward</span>
                </button>
              </form>
              <div className="mt-2.5 flex items-center justify-between font-body text-[11px] text-[#5B6270]">
                <span>Press Enter to send · Shift+Enter for new line</span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">lock</span>
                  Encrypted synthesis
                </span>
              </div>
            </div>
          </section>

          {/* Right Column: Sticky Structured Knowledge Card (4 cols) */}
          <aside className="sticky top-20 flex flex-col gap-4 lg:col-span-4">
            <div className="flex flex-col rounded-lg border border-[#E6E7EA] bg-white p-6">
              {/* Card Header */}
              <div className="mb-5 flex items-center justify-between border-b border-[#E6E7EA] pb-4">
                <div>
                  <h2 className="font-display text-[18px] font-semibold text-[#0F1115]">
                    What we've learned
                  </h2>
                  <p className="mt-0.5 font-body text-[11px] text-[#5B6270]">
                    Real-time profile synthesis
                  </p>
                </div>
                <div className="flex items-center gap-1 rounded bg-[#E7EEFF] px-2 py-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#16A34A]" />
                  <span className="font-body text-[11px] font-medium text-[#1E3A8A]">Live</span>
                </div>
              </div>

              {/* Structured Rows */}
              <div className="space-y-4">
                {DIMENSION_KEYS.map(({ key, label }) => {
                  const dim = profile?.[key]
                  const text = dim?.text || 'Listening for signals…'
                  const confidence = dim?.confidence || 'none'
                  const isClear = confidence === 'high' || confidence === 'medium'
                  const isGettingThere = confidence === 'low'

                  return (
                    <div
                      key={key}
                      className="flex items-start justify-between gap-3 border-b border-[#E6E7EA]/60 pb-3 last:border-b-0"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="mb-0.5 block font-body text-[11px] uppercase tracking-wider text-[#5B6270]">
                          {label}
                        </span>
                        <span
                          className={`block truncate font-body text-[13px] ${
                            dim?.text ? 'font-medium text-[#0F1115]' : 'text-[#8A8F98] italic'
                          }`}
                        >
                          {text}
                        </span>
                      </div>
                      <div className="mt-1 flex shrink-0 items-center gap-1.5">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            isClear
                              ? 'bg-[#16A34A]'
                              : isGettingThere
                                ? 'bg-[#F59E0B]'
                                : 'bg-[#E6E7EA]'
                          }`}
                        />
                        <span className="font-body text-[11px] text-[#5B6270]">
                          {isClear ? 'clear' : isGettingThere ? 'getting there' : 'analyzing'}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Explanatory Note */}
              <div className="mt-6 flex items-start gap-2 border-t border-[#E6E7EA] pt-4 text-[#5B6270]">
                <span className="material-symbols-outlined mt-0.5 text-[16px]">info</span>
                <p className="font-body text-[12px] leading-relaxed">
                  We'll ask 8–20 questions and stop when the picture is clear.
                </p>
              </div>

              {/* View Matches Button */}
              <div className="mt-5 pt-2">
                <button
                  type="button"
                  onClick={getMatches}
                  className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#0F1115] font-body text-[14px] font-medium text-white transition-colors hover:bg-[#1C1F26]"
                >
                  <span>{profile?.ready ? 'Generate Career Matches' : 'Continue conversation to unlock'}</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}
