import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api, type CareerMatch, type DiscoveryMessage } from '../api'
import { ChatMarkdown } from '../components/ChatMarkdown'
import { PageLoading } from '../components/PageLoading'
import { ErrorToast } from '../components/ErrorToast'

export function MatchDetail() {
  const { id } = useParams<{ id: string }>()
  const [match, setMatch] = useState<CareerMatch | null>(null)
  const [messages, setMessages] = useState<DiscoveryMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [choosing, setChoosing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(() => Boolean(id))
  const scrollRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!id) return
    void Promise.all([
      api.listMatches().then((all) => setMatch(all.find((m) => m.id === id) ?? null)).catch(() => setMatch(null)),
      api.mentorMessages().then(setMessages).catch(() => {}),
    ]).finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, sending])

  async function chooseDirection() {
    if (!id) return
    setChoosing(true)
    try {
      await api.chooseDirection(id)
      navigate('/roadmap')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save this direction. Please retry.')
    } finally {
      setChoosing(false)
    }
  }

  async function send(textToSend?: string) {
    const text = (textToSend ?? input).trim()
    if (!text || sending || !id) return
    setInput('')
    setMessages((m) => [...m, { role: 'user', content: text }])
    setSending(true)
    setMessages((m) => [...m, { role: 'assistant', content: '' }])

    try {
      await api.sendMentorMessage(text, id, {
        onChunk: (chunk) =>
          setMessages((m) => {
            const copy = [...m]
            copy[copy.length - 1] = {
              role: 'assistant',
              content: copy[copy.length - 1].content + chunk,
            }
            return copy
          }),
        onDone: () => setSending(false),
      })
    } catch (err) {
      setMessages((m) => m.slice(0, -1))
      setError(err instanceof Error ? err.message : 'Connection failed. Please retry.')
      setSending(false)
    }
  }

  if (loading) return <PageLoading label="Loading this career match…" />

  if (!match) {
    return (
      <main className="mx-auto w-full max-w-[1280px] p-6 md:p-8">
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
          <span className="material-symbols-outlined text-[36px] text-[#8A8F98]">search_off</span>
          <h2 className="font-display text-[22px] font-semibold text-[#0F1115]">Match not found</h2>
          <p className="font-body text-[14px] text-[#5B6270]">
            This match may have been removed or the link is invalid.
          </p>
          <Link
            to="/matches"
            className="mt-2 flex h-10 items-center rounded-lg bg-[#0F1115] px-5 font-body text-[14px] font-medium text-white hover:bg-[#1C1F26]"
          >
            Back to matches
          </Link>
        </div>
      </main>
    )
  }

  const circumference = 2 * Math.PI * 15.9155
  const strokeOffset = circumference * (1 - match.fit_score / 100)

  return (
    <main className="mx-auto w-full max-w-[1280px] p-6 md:p-8">
      {/* Breadcrumb / Back Link */}
      <div className="mb-4">
        <Link
          to="/matches"
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 font-body text-[13px] font-medium text-[#1E3A8A] hover:bg-[#E8EDF9] hover:text-[#0F1115]"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          <span>All matches</span>
        </Link>
      </div>

      {/* Role Title Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E6E7EA] pb-6">
        <div className="flex items-center gap-4">
          <h1 className="font-display text-[28px] font-bold tracking-tight text-[#0F1115] md:text-[32px]">
            {match.title}
          </h1>
          <div className="flex items-center gap-2">
            <span className="rounded bg-[#E8EDF9] px-2.5 py-1 font-body text-[11px] font-semibold tracking-wider uppercase text-[#1E3A8A]">
              {match.rank === 1 ? 'TOP MATCH' : `RANK ${match.rank}`}
            </span>
          </div>
        </div>

        {/* Fit Ring Indicator */}
        <div className="flex items-center gap-3 rounded-lg border border-[#E6E7EA] bg-white px-3.5 py-2">
          <div className="relative flex h-10 w-10 items-center justify-center">
            <svg className="h-10 w-10 -rotate-90 transform" viewBox="0 0 36 36">
              <path
                className="text-[#E6E7EA]"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
              />
              <path
                className="text-[#1E3A8A]"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeDasharray={`${circumference}`}
                strokeDashoffset={`${strokeOffset}`}
                strokeLinecap="round"
                strokeWidth="3"
              />
            </svg>
            <span className="absolute font-display text-[12px] font-bold text-[#0F1115]">
              {match.fit_score}%
            </span>
          </div>
          <div className="flex flex-col">
            <span className="font-body text-[11px] uppercase text-[#5B6270]">Role Fit Score</span>
            <span className="font-body text-[13px] font-medium text-[#0F1115]">
              Strong Trajectory
            </span>
          </div>
        </div>
      </div>

      {/* Two-Column Workspace: Left 7 cols / Right 5 cols */}
      <div className="mt-6 grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        {/* Left Column: Deep Path Insights */}
        <div className="flex flex-col gap-6 lg:col-span-7">
          {/* 1. Why this fits you */}
          <div className="flex flex-col gap-4 rounded-lg border border-[#E6E7EA] bg-white p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#1E3A8A]">verified</span>
                <h2 className="font-display text-[18px] font-semibold text-[#0F1115]">
                  Why this fits you
                </h2>
              </div>
              <span className="font-body text-[11px] text-[#5B6270]">
                Synthesized from conversation & career context
              </span>
            </div>
            <div className="space-y-4 pt-1">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 rounded bg-[#E8EDF9] px-2 py-0.5 font-body text-[11px] font-medium text-[#1E3A8A]">
                  CORE SIGNAL
                </span>
                <p className="font-body text-[14px] leading-relaxed text-[#151C28]">
                  {match.why}
                </p>
              </div>
            </div>
          </div>

          {/* 2. Where we're less sure */}
          <div className="flex flex-col gap-4 rounded-lg border border-[#E6E7EA] bg-white p-6">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#F59E0B]">help_outline</span>
              <h2 className="font-display text-[18px] font-semibold text-[#0F1115]">
                Where we're less sure
              </h2>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3 rounded-lg border border-[#E6E7EA] bg-[#FAFAF8] p-3">
                <span className="material-symbols-outlined mt-0.5 text-[18px] text-[#76777B]">
                  calendar_month
                </span>
                <p className="font-body text-[13.5px] leading-relaxed text-[#5B6270]">
                  <strong className="font-medium text-[#0F1115]">Signal gap:</strong>{' '}
                  {match.uncertainty_note}
                </p>
              </div>
            </div>
          </div>

          {/* 3. Market context */}
          <div className="flex flex-col gap-4 rounded-lg border border-[#E6E7EA] bg-white p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0F1115]">query_stats</span>
                <h2 className="font-display text-[18px] font-semibold text-[#0F1115]">
                  Market context
                </h2>
              </div>
              {match.source && match.as_of && (
                <span className="font-body text-[11px] text-[#76777B]">
                  {match.location} · Source: {match.source} · {match.as_of}
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {match.salary && match.location && match.source && match.as_of ? <div className="flex flex-col gap-1 rounded-lg border border-[#E6E7EA] bg-[#FAFAF8] p-4">
                <span className="font-body text-[11px] uppercase text-[#5B6270]">
                  Salary range
                </span>
                <span className="font-display text-[20px] font-bold text-[#0F1115]">
                  {match.salary}
                </span>
                <span className="font-body text-[11px] text-[#76777B]">{match.location}</span>
              </div> : <div className="rounded-lg border border-[#E6E7EA] bg-[#FAFAF8] p-4 font-body text-[12px] text-[#5B6270]">Verified salary data is unavailable.</div>}
              <div className="flex flex-col gap-1 rounded-lg border border-[#E6E7EA] bg-[#FAFAF8] p-4">
                <span className="font-body text-[11px] uppercase text-[#5B6270]">
                  Remote Availability
                </span>
                <span className="font-display text-[20px] font-bold text-[#0F1115]">
                  {match.remote}
                </span>
                <span className="font-body text-[11px] text-[#76777B]">Hybrid/remote roles</span>
              </div>
              <div className="flex flex-col gap-1 rounded-lg border border-[#E6E7EA] bg-[#FAFAF8] p-4">
                <span className="font-body text-[11px] uppercase text-[#5B6270]">
                  Demand Growth
                </span>
                <span className="font-display text-[20px] font-bold text-[#1E3A8A]">
                  {match.demand}
                </span>
                <span className="font-body text-[11px] text-[#76777B]">Projected expansion</span>
              </div>
            </div>
          </div>

          {/* Bottom pinned action */}
          <div className="flex flex-col items-start justify-between gap-4 rounded-lg border border-[#E6E7EA] bg-white p-6 sm:flex-row sm:items-center">
            <div className="flex flex-col">
              <span className="font-display text-[18px] font-semibold text-[#0F1115]">
                Ready to align your trajectory?
              </span>
              <span className="font-body text-[13px] text-[#5B6270]">
                Sets this as your active roadmap and configures tailored daily habits.
              </span>
            </div>
            <button
              type="button"
              disabled={choosing}
              onClick={chooseDirection}
              className="h-10 rounded-lg bg-[#0F1115] px-5 font-body text-[14px] font-medium text-white transition-colors hover:bg-[#1C1F26] disabled:opacity-60"
            >
              {choosing ? 'Saving…' : 'Choose this direction'}
            </button>
          </div>
          <ErrorToast message={error} onDismiss={() => setError(null)} />
        </div>

        {/* Right Column: Sticky AI Mentor Chat (5 cols) */}
        <div className="sticky top-20 lg:col-span-5">
          <div className="flex h-[720px] flex-col overflow-hidden rounded-lg border border-[#E6E7EA] bg-white shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#E6E7EA] bg-white p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E6E7EA] bg-[#FAFAF8] p-1.5">
                  <img
                    src="/brand/bosla-mark.png"
                    alt="Bosla"
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="font-display text-[15px] font-semibold text-[#0F1115]">
                    Ask Bosla about this path
                  </span>
                  <span className="flex items-center gap-1.5 font-body text-[11px] text-[#1E3A8A]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#1E3A8A]" />
                    AI Career Mentor · Focused on {match.title}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Prompts */}
            <div className="flex flex-wrap gap-1.5 border-b border-[#E6E7EA] bg-[#FAFAF8] p-3">
              <button
                type="button"
                onClick={() => send(`What does a typical junior workday look like as a ${match.title}?`)}
                className="rounded border border-[#E6E7EA] bg-white px-2.5 py-1 text-left font-body text-[11px] text-[#0F1115] transition-colors hover:border-[#1E3A8A]"
              >
                Workday routine
              </button>
              <button
                type="button"
                onClick={() => send(`How steep is the transition into ${match.title} from my background?`)}
                className="rounded border border-[#E6E7EA] bg-white px-2.5 py-1 text-left font-body text-[11px] text-[#0F1115] transition-colors hover:border-[#1E3A8A]"
              >
                Transition difficulty
              </button>
              <button
                type="button"
                onClick={() => send(`What portfolio project would prove readiness for ${match.title}?`)}
                className="rounded border border-[#E6E7EA] bg-white px-2.5 py-1 text-left font-body text-[11px] text-[#0F1115] transition-colors hover:border-[#1E3A8A]"
              >
                Portfolio project ideas
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
              {messages.length === 0 && (
                <div className="py-8 text-center font-body text-[13px] text-[#8A8F98]">
                  Ask any questions about {match.title} salary, day-to-day work, or portfolio requirements.
                </div>
              )}
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg p-3 font-body text-[13px] leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-[#0F1115] text-white'
                        : 'border border-[#E6E7EA] border-l-[3px] border-l-[#1E3A8A] bg-[#FAFAF8] text-[#0F1115]'
                    }`}
                  >
                    {m.role === 'user' ? <span className="whitespace-pre-wrap">{m.content}</span> : <ChatMarkdown content={m.content} />}
                    {i === messages.length - 1 && sending && m.role === 'assistant' && (
                      <span className="ml-1 inline-block h-3.5 w-1 animate-pulse bg-[#1E3A8A] align-middle" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                send()
              }}
              className="flex items-center gap-2 border-t border-[#E6E7EA] p-3"
            >
              <input
                type="text"
                value={input}
                disabled={sending}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`Ask about ${match.title}…`}
                className="h-9 flex-1 rounded-lg border border-[#E6E7EA] bg-white px-3 font-body text-[13px] text-[#0F1115] placeholder-[#8A8F98] outline-none transition-colors focus:border-[#1E3A8A]"
              />
              <button
                type="submit"
                disabled={!input.trim() || sending}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0F1115] text-white transition-colors hover:bg-[#1C1F26] disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[16px]">send</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  )
}
