import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, type DiscoveryMessage, type Roadmap } from '../api'

const PROMPTS = [
  'What should I focus on this week to move my career forward?',
  'How can I use my current strengths in my target role?',
  'What is one practical project I can begin today?',
]

/** A dedicated, direction-agnostic workspace for the ongoing career mentor. */
export function Mentor() {
  const [messages, setMessages] = useState<DiscoveryMessage[]>([])
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    api.mentorMessages().then(setMessages).catch(() => {})
    api.getRoadmap().then(setRoadmap).catch(() => {})
  }, [])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, sending])

  async function send(textToSend?: string) {
    const text = (textToSend ?? input).trim()
    if (!text || sending) return

    setError(null)
    setInput('')
    setSending(true)
    setMessages((current) => [...current, { role: 'user', content: text }, { role: 'assistant', content: '' }])

    try {
      await api.sendMentorMessage(text, null, {
        onChunk: (chunk) =>
          setMessages((current) => {
            const copy = [...current]
            copy[copy.length - 1] = { role: 'assistant', content: copy[copy.length - 1].content + chunk }
            return copy
          }),
        onDone: () => setSending(false),
      })
    } catch (err) {
      setMessages((current) => current.slice(0, -1))
      setError(err instanceof Error ? err.message : 'The mentor is temporarily unavailable. Please retry.')
      setSending(false)
    }
  }

  const direction = roadmap?.direction

  return (
    <main className="mx-auto flex w-full max-w-[1040px] flex-col gap-6 p-6 md:p-8">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-[#E6E7EA] pb-6">
        <div>
          <p className="mb-2 font-body text-[12px] font-medium uppercase tracking-[0.12em] text-[#1E3A8A]">
            Your career workspace
          </p>
          <h1 className="font-display text-[28px] font-bold tracking-tight text-[#0F1115] md:text-[32px]">
            AI Career Mentor
          </h1>
          <p className="mt-2 max-w-2xl font-body text-[14px] leading-relaxed text-[#5B6270]">
            Get practical guidance for your transition, learning plan, and next career decision.
          </p>
        </div>
        {direction ? (
          <div className="rounded-lg border border-[#E6E7EA] bg-[#F0F3FF]/60 px-3.5 py-2.5 font-body text-[12px] text-[#1E3A8A]">
            Current direction: <span className="font-semibold">{direction}</span>
          </div>
        ) : (
          <Link to="/matches" className="rounded-lg border border-[#1E3A8A] px-3.5 py-2.5 font-body text-[12px] font-medium text-[#1E3A8A] hover:bg-[#F0F3FF]">
            Explore career matches
          </Link>
        )}
      </header>

      <section className="flex min-h-[620px] flex-col overflow-hidden rounded-xl border border-[#E6E7EA] bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-[#E6E7EA] bg-[#FAFAF8] p-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E6E7EA] bg-white p-1.5">
            <img src="/brand/bosla-mark.png" alt="Bosla" className="h-full w-full object-contain" />
          </div>
          <div>
            <p className="font-display text-[15px] font-semibold text-[#0F1115]">Bosla Mentor</p>
            <p className="font-body text-[11px] text-[#5B6270]">Career guidance grounded in your Bosla profile</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 border-b border-[#E6E7EA] p-3">
          {PROMPTS.map((prompt) => (
            <button key={prompt} type="button" disabled={sending} onClick={() => send(prompt)} className="rounded border border-[#E6E7EA] bg-white px-2.5 py-1.5 text-left font-body text-[12px] text-[#0F1115] hover:border-[#1E3A8A] disabled:opacity-50">
              {prompt}
            </button>
          ))}
        </div>

        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-5">
          {messages.length === 0 && (
            <div className="mx-auto max-w-md py-16 text-center">
              <span className="material-symbols-outlined text-[36px] text-[#1E3A8A]">psychology</span>
              <p className="mt-3 font-display text-[18px] font-semibold text-[#0F1115]">What would you like to work through?</p>
              <p className="mt-2 font-body text-[13px] leading-relaxed text-[#5B6270]">Ask about a career change, your learning plan, portfolio ideas, or a decision you are weighing.</p>
            </div>
          )}
          {messages.map((message, index) => (
            <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-lg p-3 font-body text-[13px] leading-relaxed ${message.role === 'user' ? 'bg-[#0F1115] text-white' : 'border border-[#E6E7EA] border-l-[3px] border-l-[#1E3A8A] bg-[#FAFAF8] text-[#0F1115]'}`}>
                <span className="whitespace-pre-wrap">{message.content}</span>
                {sending && index === messages.length - 1 && message.role === 'assistant' && <span className="ml-1 inline-block h-3.5 w-1 animate-pulse bg-[#1E3A8A] align-middle" />}
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={(event) => { event.preventDefault(); void send() }} className="flex items-center gap-2 border-t border-[#E6E7EA] p-3">
          <input value={input} disabled={sending} onChange={(event) => setInput(event.target.value)} placeholder="Ask your career mentor…" className="h-10 flex-1 rounded-lg border border-[#E6E7EA] px-3 font-body text-[13px] outline-none focus:border-[#1E3A8A] disabled:bg-[#FAFAF8]" />
          <button type="submit" disabled={!input.trim() || sending} className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0F1115] text-white hover:bg-[#1C1F26] disabled:opacity-50" aria-label="Send message">
            <span className="material-symbols-outlined text-[17px]">send</span>
          </button>
        </form>
        {error && <p className="border-t border-[#FECACA] bg-[#FEF2F2] px-4 py-3 font-body text-[13px] text-[#B91C1C]">{error}</p>}
      </section>
    </main>
  )
}
