import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, type DiscoveryMessage, type Roadmap } from '../api'

const PROMPTS = [
  { title: 'Plan my week', text: 'What should I focus on this week to move my career forward?', icon: 'calendar_month' },
  { title: 'Use my strengths', text: 'How can I use my current strengths in my target role?', icon: 'psychology' },
  { title: 'Build a project', text: 'What is one practical project I can begin today?', icon: 'construction' },
]

/** A dedicated, profile-aware workspace for ongoing career guidance. */
export function Mentor() {
  const [messages, setMessages] = useState<DiscoveryMessage[]>([])
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    void Promise.all([
      api.mentorMessages().then(setMessages).catch(() => {}),
      api.getRoadmap().then(setRoadmap).catch(() => {}),
    ])
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
        onChunk: (chunk) => setMessages((current) => {
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
  const exchangeCount = Math.ceil(messages.length / 2)

  return (
    <main className="mx-auto w-full max-w-[1320px] p-5 md:p-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-3 flex items-center gap-2 font-body text-[11px] font-semibold uppercase tracking-[0.12em] text-[#1E3A8A]"><span className="h-2 w-2 rounded-full bg-[#16A34A]" />Private, profile-aware guidance</div>
          <h1 className="font-display text-[30px] font-bold tracking-tight text-[#0F1115] md:text-[36px]">Career mentor</h1>
          <p className="mt-2 max-w-2xl font-body text-[14px] leading-relaxed text-[#5B6270]">Think through your next move with practical guidance grounded in your goals, habits, and career direction.</p>
        </div>
        {direction ? <div className="rounded-2xl border border-[#D8E1FF] bg-[#F4F7FF] px-4 py-3"><p className="font-body text-[10px] font-semibold uppercase tracking-[0.1em] text-[#1E3A8A]">Current direction</p><p className="mt-0.5 font-body text-[13px] font-semibold text-[#0F1115]">{direction}</p></div> : <Link to="/matches" className="inline-flex items-center gap-2 rounded-xl border border-[#1E3A8A] bg-white px-4 py-2.5 font-body text-[13px] font-medium text-[#1E3A8A] hover:bg-[#F0F3FF]">Explore career matches<span className="material-symbols-outlined text-[17px]">arrow_forward</span></Link>}
      </header>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        <section className="flex min-h-[650px] flex-col overflow-hidden rounded-2xl border border-[#E2E5EA] bg-white shadow-[0_12px_36px_-24px_rgba(15,17,21,0.34)]">
          <div className="flex items-center justify-between border-b border-[#E6E7EA] bg-gradient-to-r from-[#F8FAFF] to-white px-5 py-4">
            <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#D8E1FF] bg-white p-2 shadow-sm"><img src="/brand/bosla-mark.png" alt="Bosla" className="h-full w-full object-contain" /></div><div><p className="font-display text-[15px] font-semibold text-[#0F1115]">Bosla Mentor</p><p className="mt-0.5 font-body text-[11px] text-[#5B6270]">A focused space for your career decisions</p></div></div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EAF8EE] px-2.5 py-1 font-body text-[11px] font-medium text-[#17733B]"><span className="h-1.5 w-1.5 rounded-full bg-[#16A34A]" />Available</span>
          </div>

          {messages.length === 0 && <div className="border-b border-[#E6E7EA] bg-[#FCFCFD] px-5 py-4"><p className="mb-3 font-body text-[11px] font-semibold uppercase tracking-[0.1em] text-[#76777B]">Start with a focused prompt</p><div className="grid gap-2 md:grid-cols-3">{PROMPTS.map((prompt) => <button key={prompt.title} type="button" disabled={sending} onClick={() => void send(prompt.text)} className="group rounded-xl border border-[#E6E7EA] bg-white p-3 text-left hover:border-[#AFC2FA] hover:bg-[#F4F7FF]"><span className="material-symbols-outlined text-[18px] text-[#1E3A8A]">{prompt.icon}</span><span className="mt-2 block font-body text-[12px] font-semibold text-[#0F1115]">{prompt.title}</span><span className="mt-0.5 block font-body text-[11px] leading-relaxed text-[#5B6270]">Ask Bosla for a clear next step.</span></button>)}</div></div>}

          <div ref={scrollRef} className="flex-1 space-y-5 overflow-y-auto bg-[#FCFCFD] px-5 py-6" aria-live="polite">
            {messages.length === 0 && <div className="mx-auto flex max-w-lg flex-col items-center py-14 text-center"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E8EDF9] text-[#1E3A8A]"><span className="material-symbols-outlined text-[28px]">forum</span></div><h2 className="mt-5 font-display text-[20px] font-semibold text-[#0F1115]">What would you like to work through?</h2><p className="mt-2 font-body text-[13px] leading-relaxed text-[#5B6270]">Bring a decision, a learning goal, or a career concern. Bosla will help turn it into a practical next step.</p></div>}
            {messages.map((message, index) => {
              const fromUser = message.role === 'user'
              return <div key={`${message.role}-${index}`} className={`flex gap-3 ${fromUser ? 'justify-end' : 'justify-start'}`}>
                {!fromUser && <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#E8EDF9]"><span className="material-symbols-outlined text-[16px] text-[#1E3A8A]">auto_awesome</span></div>}
                <div className={`max-w-[82%] rounded-2xl px-4 py-3 font-body text-[13px] leading-relaxed shadow-sm ${fromUser ? 'rounded-tr-sm bg-[#111827] text-white' : 'rounded-tl-sm border border-[#E6E7EA] bg-white text-[#1D2430]'}`}>
                  {!fromUser && <p className="mb-1 font-body text-[10px] font-semibold uppercase tracking-[0.09em] text-[#1E3A8A]">Bosla Mentor</p>}
                  <span className="whitespace-pre-wrap">{message.content}</span>
                  {sending && index === messages.length - 1 && !fromUser && <span className="ml-1 inline-block h-3.5 w-1 animate-pulse bg-[#1E3A8A] align-middle" />}
                </div>
              </div>
            })}
          </div>

          <form onSubmit={(event) => { event.preventDefault(); void send() }} className="border-t border-[#E6E7EA] bg-white p-4">
            <div className="flex items-end gap-3 rounded-2xl border border-[#CCD3E0] bg-[#FCFCFD] p-2 transition-colors focus-within:border-[#1E3A8A] focus-within:ring-4 focus-within:ring-[#E8EDF9]"><textarea value={input} disabled={sending} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void send() } }} placeholder="Ask about your next step, a decision, or a project idea…" rows={2} className="max-h-28 min-h-11 flex-1 resize-none bg-transparent px-2 py-1.5 font-body text-[13px] leading-relaxed text-[#0F1115] outline-none placeholder:text-[#8A8F98] disabled:cursor-not-allowed" /><button type="submit" disabled={!input.trim() || sending} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0F1115] text-white hover:bg-[#1E3A8A] disabled:opacity-40" aria-label="Send message"><span className="material-symbols-outlined text-[18px]">arrow_upward</span></button></div>
            <p className="mt-2 px-2 font-body text-[11px] text-[#8A8F98]">Press Enter to send · Shift + Enter for a new line</p>
          </form>
          {error && <p className="border-t border-[#FECACA] bg-[#FEF2F2] px-5 py-3 font-body text-[13px] text-[#B91C1C]">{error}</p>}
        </section>

        <aside className="space-y-4 xl:sticky xl:top-20 xl:self-start">
          <section className="rounded-2xl border border-[#E6E7EA] bg-white p-5"><div className="flex items-center gap-2"><span className="material-symbols-outlined text-[18px] text-[#1E3A8A]">radar</span><h2 className="font-display text-[15px] font-semibold text-[#0F1115]">Mentor context</h2></div><dl className="mt-4 space-y-3"><div className="border-b border-[#EEF0F3] pb-3"><dt className="font-body text-[11px] text-[#76777B]">Career direction</dt><dd className="mt-1 font-body text-[13px] font-medium text-[#0F1115]">{direction || 'Not selected yet'}</dd></div><div className="border-b border-[#EEF0F3] pb-3"><dt className="font-body text-[11px] text-[#76777B]">Roadmap steps</dt><dd className="mt-1 font-body text-[13px] font-medium text-[#0F1115]">{roadmap?.steps.length ?? 0} available</dd></div><div><dt className="font-body text-[11px] text-[#76777B]">Conversation</dt><dd className="mt-1 font-body text-[13px] font-medium text-[#0F1115]">{exchangeCount ? `${exchangeCount} mentor exchange${exchangeCount > 1 ? 's' : ''}` : 'Ready when you are'}</dd></div></dl></section>
          <section className="rounded-2xl border border-[#D8E1FF] bg-[#F4F7FF] p-5"><span className="material-symbols-outlined text-[20px] text-[#1E3A8A]">tips_and_updates</span><h2 className="mt-3 font-display text-[15px] font-semibold text-[#0F1115]">A good mentor prompt</h2><p className="mt-2 font-body text-[12px] leading-relaxed text-[#5B6270]">Share the decision you are weighing, what you have tried, and the outcome you want. Bosla can give more useful trade-offs and next actions.</p></section>
        </aside>
      </div>
    </main>
  )
}
