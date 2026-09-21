import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useApp } from '../context/AppContext'

export function SignIn() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { refreshUser } = useApp()
  const navigate = useNavigate()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await api.signIn(email.trim(), name.trim())
      const user = await refreshUser()
      navigate(user?.consent_given ? '/dashboard' : '/onboarding/consent')
    } catch {
      setError('Could not sign in. Try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-full items-center justify-center bg-page px-6 py-16">
      <div className="w-full max-w-sm rounded-card border border-line bg-white p-6">
        <img src="/brand/bosla-mark.png" alt="Bosla" className="h-10 w-10 object-contain" />
        <h1 className="mt-4 text-[22px] font-semibold">Sign in to Bosla</h1>
        <p className="mt-1 text-[13px] text-text-2">Minimal, for now — no password required in this preview.</p>

        <form onSubmit={submit} className="mt-5 space-y-3">
          <div>
            <label className="text-[13px] font-medium text-text-2">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 h-10 w-full rounded-card border border-line px-3 text-[14px] outline-none focus:border-ink"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="text-[13px] font-medium text-text-2">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 h-10 w-full rounded-card border border-line px-3 text-[14px] outline-none focus:border-ink"
              placeholder="Your name"
            />
          </div>
          {error && <p className="text-[13px] text-danger">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="mt-2 h-11 w-full rounded-card bg-ink text-[15px] font-medium text-white hover:bg-ink-hover disabled:opacity-60"
          >
            {busy ? 'Signing in…' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  )
}
