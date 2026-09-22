import { Briefcase, Calendar, Globe, Send, TrendingUp } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api, type CareerMatch, type DiscoveryMessage } from '../api'
import { FitRing } from '../components/Card'

export function MatchDetail() {
  const { id } = useParams<{ id: string }>()
  const [match, setMatch] = useState<CareerMatch | null>(null)
  const [messages, setMessages] = useState<DiscoveryMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    api.listMatches().then((all) => setMatch(all.find((m) => m.id === id) ?? null))
    api.mentorMessages().then(setMessages)
  }, [id])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  async function chooseDirection() {
    if (!id) return
    try {
      await api.chooseDirection(id)
      navigate('/roadmap')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save this direction. Please retry.')
    }
  }

  async function send() {
    const text = input.trim()
    if (!text || sending || !id) return
    setInput('')
    setMessages((m) => [...m, { role: 'user', content: text }])
    setSending(true)
    setMessages((m) => [...m, { role: 'assistant', content: '' }])
    try { await api.sendMentorMessage(text, id, {
      onChunk: (chunk) =>
        setMessages((m) => {
          const copy = [...m]
          copy[copy.length - 1] = { role: 'assistant', content: copy[copy.length - 1].content + chunk }
          return copy
        }),
      onDone: () => setSending(false),
    }) } catch (err) {
      setMessages((m) => m.slice(0, -1))
      setError(err instanceof Error ? err.message : 'Connection failed. Please retry.')
      setSending(false)
    }
  }

  if (!match) return null

  return (
    <main className="mx-auto grid w-full max-w-5xl gap-4 px-4 py-6 md:grid-cols-[1fr_360px] md:px-6 md:py-8">
      <div>
        <div className="flex items-start gap-4 rounded-card border border-line bg-white p-5">
          <FitRing value={match.fit_score} size={64} />
          <div>
            <h1 className="text-[24px] font-semibold">{match.title}</h1>
            <p className="mt-1 text-[14px] leading-6 text-text-2">{match.why}</p>
            <p className="mt-2 text-[12px] italic text-text-3">Uncertainty: {match.uncertainty_note}</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-card border border-line bg-white p-4">
            <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.06em] text-text-3">
              <Briefcase size={14} /> Salary
            </div>
            <p className="mt-1 text-[14px]">{match.salary}</p>
          </div>
          <div className="rounded-card border border-line bg-white p-4">
            <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.06em] text-text-3">
              <Globe size={14} /> Remote
            </div>
            <p className="mt-1 text-[14px]">{match.remote}</p>
          </div>
          <div className="rounded-card border border-line bg-white p-4">
            <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.06em] text-text-3">
              <TrendingUp size={14} /> Demand
            </div>
            <p className="mt-1 text-[14px]">{match.demand}</p>
          </div>
          <div className="rounded-card border border-line bg-white p-4">
            <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.06em] text-text-3">
              <Calendar size={14} /> Source
            </div>
            <p className="mt-1 text-[13px]">
              {match.source} <span className="text-text-3">· {match.as_of}</span>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={chooseDirection}
          className="mt-4 h-11 w-full rounded-card bg-ink text-[15px] font-medium text-white hover:bg-ink-hover"
        >
          Choose this direction
        </button>
        {error && <p role="alert" className="mt-2 text-[13px] text-danger">{error}</p>}
      </div>

      <div className="flex min-h-[420px] flex-col rounded-card border border-line bg-white">
        <div className="border-b border-line p-3 text-[13px] font-semibold">Ask the mentor about this path</div>
        <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto p-3">
          {messages.length === 0 && <p className="text-[12px] text-text-3">Ask anything about this direction.</p>}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={[
                  'max-w-[90%] rounded-card px-3 py-2 text-[13px] leading-5',
                  m.role === 'user' ? 'bg-ink text-white' : 'border border-line bg-page',
                ].join(' ')}
              >
                {m.content || (sending && i === messages.length - 1 ? '…' : '')}
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 border-t border-line p-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder="Ask a question…"
            disabled={sending}
            className="h-9 flex-1 rounded-card border border-line px-3 text-[13px] outline-none focus:border-ink disabled:opacity-60"
          />
          <button
            type="button"
            onClick={send}
            disabled={sending || !input.trim()}
            aria-label="Send message to mentor"
            className="grid h-9 w-9 place-items-center rounded-card bg-ink text-white disabled:opacity-40"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </main>
  )
}
