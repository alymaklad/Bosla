import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useApp } from '../context/AppContext'

const PERSONAS = [
  { key: 'student', label: 'Student', hint: 'Still studying, exploring directions' },
  { key: 'graduate', label: 'Graduate', hint: 'Recently finished, looking for a start' },
  { key: 'early-career', label: 'Early career', hint: 'A year or two in, finding footing' },
  { key: 'switcher', label: 'Switcher', hint: 'Changing direction entirely' },
]

export function Consent() {
  const [persona, setPersona] = useState<string | null>(null)
  const [agreed, setAgreed] = useState(false)
  const [busy, setBusy] = useState(false)
  const { refreshUser } = useApp()
  const navigate = useNavigate()

  async function submit() {
    if (!persona || !agreed) return
    setBusy(true)
    try {
      await api.setConsent(true, persona)
      await refreshUser()
      navigate('/onboarding/cv')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-full max-w-lg flex-col justify-center px-6 py-16">
      <h1 className="text-[26px] font-semibold">Before we start</h1>
      <p className="mt-1 text-text-2">A quick consent, and where you're standing right now.</p>

      <label className="mt-6 flex items-start gap-3 rounded-card border border-line p-4">
        <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 h-4 w-4" />
        <span className="text-[13px] text-text-2">
          I agree that Bosla can use what I share in this conversation — and my CV, if I upload one — to generate
          career guidance and habit plans. I can export or delete my data at any time from Settings.
        </span>
      </label>

      <h2 className="mt-6 text-[15px] font-semibold">Where are you right now?</h2>
      <div className="mt-3 grid grid-cols-2 gap-3">
        {PERSONAS.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => setPersona(p.key)}
            className={[
              'rounded-card border p-3 text-left transition-colors',
              persona === p.key ? 'border-ink bg-indigo-tint' : 'border-line bg-white hover:bg-page',
            ].join(' ')}
          >
            <div className="text-[14px] font-semibold">{p.label}</div>
            <div className="text-[12px] text-text-3">{p.hint}</div>
          </button>
        ))}
      </div>

      <button
        type="button"
        disabled={!persona || !agreed || busy}
        onClick={submit}
        className="mt-8 h-11 rounded-card bg-ink text-[15px] font-medium text-white hover:bg-ink-hover disabled:opacity-40"
      >
        Continue
      </button>
    </div>
  )
}
