import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, apiBaseUrl } from '../api'
import { useApp } from '../context/AppContext'

export function SignIn() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [isRegistering, setIsRegistering] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { refreshUser } = useApp()
  const navigate = useNavigate()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      if (isRegistering) await api.register(email.trim(), password, name.trim())
      else await api.signIn(email.trim(), password)
      const user = await refreshUser()
      navigate(user?.consent_given ? '/dashboard' : '/onboarding/consent')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign in. Try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-full items-center justify-center bg-page px-6 py-16">
      <div className="w-full max-w-sm rounded-card border border-line bg-white p-6">
        <img src="/brand/bosla-mark.png" alt="Bosla" className="h-10 w-10 object-contain" />
        <h1 className="mt-4 text-[22px] font-semibold">{isRegistering ? 'Create your Bosla account' : 'Sign in to Bosla'}</h1>
        <p className="mt-1 text-[13px] text-text-2">Your career direction and progress stay private to your account.</p>

        <form onSubmit={submit} className="mt-5 space-y-3">
          {isRegistering && <div>
            <label className="text-[13px] font-medium text-text-2">Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 h-10 w-full rounded-card border border-line px-3 text-[14px] outline-none focus:border-ink"
              placeholder="Your name"
            />
          </div>}
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
            <label className="text-[13px] font-medium text-text-2">Password</label>
            <input
              type="password"
              required
              minLength={isRegistering ? 8 : undefined}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 h-10 w-full rounded-card border border-line px-3 text-[14px] outline-none focus:border-ink"
              placeholder="At least 8 characters"
            />
          </div>
          {error && <p className="text-[13px] text-danger">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="mt-2 h-11 w-full rounded-card bg-ink text-[15px] font-medium text-white hover:bg-ink-hover disabled:opacity-60"
          >
            {busy ? 'Please wait…' : isRegistering ? 'Create account' : 'Sign in'}
          </button>
          <button type="button" onClick={() => { setIsRegistering((v) => !v); setError(null) }} className="w-full text-[13px] text-indigo-brand hover:underline">
            {isRegistering ? 'Already have an account? Sign in' : 'New to Bosla? Create an account'}
          </button>
          <a href={`${apiBaseUrl}/auth/google/start`} className="block w-full text-center text-[13px] text-text-2 hover:underline">Continue with Google</a>
        </form>
      </div>
    </div>
  )
}
