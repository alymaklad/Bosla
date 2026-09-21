import { Send, Sparkles } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, type DiscoveryMessage, type DiscoveryProfile } from '../api'
import { ConfidenceDot } from '../components/Card'
import { useApp } from '../context/AppContext'

const DIMENSION_LABELS: [keyof DiscoveryProfile, string][] = [
  ['interests', 'Interests'],
  ['strengths', 'Strengths'],
  ['skills', 'Skills'],
  ['experience', 'Experience'],
  ['motivations', 'Motivations'],
]

export function Discovery() {
  const { user } = useApp()
  const [messages, setMessages] = useState<DiscoveryMessage[]>([])
  const [profile, setProfile] = useState<DiscoveryProfile | null>(null)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [preparing, setPreparing] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    api.discoveryMessages().then(async (existing) => {
      if (existing.length === 0) {
        const opening = await api.startDiscovery(user?.persona)
        setMessages([opening])
      } else {
        setMessages(existing)
        api.discoveryProfile().then(setProfile)
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  async function send() {
    const text = input.trim()
    if (!text || sending) return
    setInput('')
    setMessages((m) => [...m, { role: 'user', content: text }])
    setSending(true)
    setMessages((m) => [...m, { role: 'assistant', content: '' }])

    await api.sendDiscoveryMessage(text, {
      onChunk: (chunk) => {
        setMessages((m) => {
          const copy = [...m]
          copy[copy.length - 1] = { role: 'assistant', content: copy[copy.length - 1].content + chunk }
          return copy
        })
      },
      onDone: (p) => {
        setProfile(p)
        setSending(false)
      },
    })
  }

  async function getMatches() {
    setPreparing('Reading everything you shared…')
    let assessmentText = ''
    await api.runAssessment({
      onChunk: () => {},
      onDone: (text) => {
        assessmentText = text
      },
    })
    if (!assessmentText) return
    setPreparing('Ranking career directions…')
    await api.generateMatches()
    navigate('/matches')
  }

  if (preparing) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-3 px-6 text-center">
        <Sparkles className="animate-pulse text-indigo-brand" size={28} />
        <p className="text-[15px] font-medium">{preparing}</p>
        <p className="text-[13px] text-text-3">This takes a few seconds.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto grid min-h-full max-w-5xl grid-cols-1 gap-4 px-4 py-6 md:grid-cols-[1fr_280px] md:px-6">
      <div className="flex min-h-[70vh] flex-col rounded-card border border-line bg-white">
        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={[
                  'max-w-[85%] rounded-card px-3.5 py-2.5 text-[14px] leading-6',
                  m.role === 'user' ? 'bg-ink text-white' : 'border border-line bg-page text-ink',
                ].join(' ')}
              >
                {m.content || (sending && i === messages.length - 1 ? '…' : '')}
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 border-t border-line p-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder="Type your answer…"
            disabled={sending}
            className="h-10 flex-1 rounded-card border border-line px-3 text-[14px] outline-none focus:border-ink disabled:opacity-60"
          />
          <button
            type="button"
            onClick={send}
            disabled={sending || !input.trim()}
            className="grid h-10 w-10 place-items-center rounded-card bg-ink text-white hover:bg-ink-hover disabled:opacity-40"
          >
            <Send size={16} />
          </button>
        </div>
      </div>

      <div className="rounded-card border border-line bg-white p-4">
        <h3 className="text-[14px] font-semibold">What we've learned</h3>
        <ul className="mt-3 space-y-3">
          {DIMENSION_LABELS.map(([key, label]) => {
            const dim = profile?.[key] as { text: string; confidence: string } | undefined
            return (
              <li key={key}>
                <div className="flex items-center gap-2">
                  <ConfidenceDot confidence={dim?.confidence ?? 'none'} />
                  <span className="text-[13px] font-medium">{label}</span>
                </div>
                <p className="mt-0.5 pl-4 text-[12px] leading-5 text-text-3">{dim?.text || 'Not yet covered'}</p>
              </li>
            )
          })}
        </ul>
        <button
          type="button"
          disabled={!profile?.ready}
          onClick={getMatches}
          className="mt-4 h-10 w-full rounded-card bg-ink text-[13px] font-medium text-white hover:bg-ink-hover disabled:opacity-30"
        >
          Get my matches
        </button>
        {!profile?.ready && <p className="mt-2 text-[11px] text-text-3">Unlocks once every dimension has a signal.</p>}
      </div>
    </div>
  )
}
