import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { api, apiBaseUrl } from '../api'
import { useApp } from '../context/AppContext'
import { ErrorToast } from '../components/ErrorToast'

export function SignIn() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const location = useLocation()
  const [isRegistering, setIsRegistering] = useState(
    () => new URLSearchParams(location.search).get('mode') === 'signup',
  )
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { refreshUser, user } = useApp()
  const navigate = useNavigate()

  if (user) return <Navigate to={user.consent_given ? '/dashboard' : '/onboarding/consent'} replace />

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      if (isRegistering) {
        await api.register(email.trim(), password, name.trim())
      } else {
        await api.signIn(email.trim(), password)
      }
      const user = await refreshUser()
      navigate(user?.consent_given ? '/dashboard' : '/onboarding/consent')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign in. Try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col justify-between bg-[#FAFAF8] text-[#0F1115] antialiased selection:bg-[#E7EEFF] selection:text-[#1E3A8A]">
      <ErrorToast message={error} onDismiss={() => setError(null)} />
      {/* Minimal Top Header Anchor */}
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-8 py-6">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-[#0F1115]" />
          <span className="font-body text-[11px] font-medium uppercase tracking-wider text-[#5B6270]">
            Precision Navigation
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-body text-[11px] text-[#5B6270]">v2.4.0</span>
        </div>
      </header>

      {/* Central Authentication Canvas */}
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-[420px]">
          {/* Primary Card Container */}
          <div className="rounded-lg border border-[#E6E7EA] bg-white p-8">
            {/* Centered Logo Lockup */}
            <div className="mb-6 flex justify-center">
              <Link to="/" aria-label="Bosla home"><img
                src="/brand/bosla-mark.png"
                alt="Bosla compass-rose brandmark"
                className="h-8 w-auto object-contain"
              /></Link>
            </div>

            {/* Typography Header Group */}
            <div className="mb-6 text-left">
              <h1 className="mb-1 font-display text-[24px] font-semibold tracking-tight text-[#0F1115]">
                {isRegistering ? 'Create your account' : 'Sign in to Bosla'}
              </h1>
              <p className="font-body text-[14px] text-[#5B6270]">
                {isRegistering
                  ? 'Start uncovering your career direction.'
                  : 'Your career direction stays private to your account.'}
              </p>
            </div>

            {/* Registration/Login Form */}
            <form onSubmit={submit} className="space-y-4">
              {isRegistering && (
                <div>
                  <label
                    htmlFor="name"
                    className="mb-1.5 block font-body text-[11px] font-medium uppercase tracking-[0.06em] text-[#0F1115]"
                  >
                    Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Aly Maklad"
                    className="h-10 w-full rounded-lg border border-[#E6E7EA] bg-white px-3 font-body text-[14px] text-[#0F1115] placeholder-[#5B6270] outline-none transition-colors focus:border-[#0F1115]"
                  />
                </div>
              )}

              {/* Email Input */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block font-body text-[11px] font-medium uppercase tracking-[0.06em] text-[#0F1115]"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="h-10 w-full rounded-lg border border-[#E6E7EA] bg-white px-3 font-body text-[14px] text-[#0F1115] placeholder-[#5B6270] outline-none transition-colors focus:border-[#0F1115]"
                />
              </div>

              {/* Password Input */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="block font-body text-[11px] font-medium uppercase tracking-[0.06em] text-[#0F1115]"
                  >
                    Password
                  </label>
                  <span className="font-body text-[11px] text-[#5B6270]">8+ characters</span>
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  minLength={isRegistering ? 8 : undefined}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-10 w-full rounded-lg border border-[#E6E7EA] bg-white px-3 font-body text-[14px] tracking-widest text-[#0F1115] placeholder-[#5B6270] outline-none transition-colors focus:border-[#0F1115]"
                />
              </div>


              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={busy}
                  className="flex h-10 w-full items-center justify-center rounded-lg bg-[#0F1115] font-body text-[14px] font-medium text-white transition-colors hover:bg-[#1C1F26] disabled:opacity-60"
                >
                  {busy ? 'Please wait…' : isRegistering ? 'Create account' : 'Sign in'}
                </button>
              </div>
            </form>

            {/* Divider */}
            <div className="relative my-6 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#E6E7EA]" />
              </div>
              <div className="relative bg-white px-3">
                <span className="font-body text-[11px] uppercase tracking-wider text-[#5B6270]">or</span>
              </div>
            </div>

            {/* Google SSO Button */}
            <a
              href={`${apiBaseUrl}/auth/google/start`}
              className="flex h-10 w-full items-center justify-center gap-3 rounded-lg border border-[#E6E7EA] bg-white font-body text-[14px] font-medium text-[#0F1115] transition-colors hover:border-[#0F1115] hover:bg-[#F0F3FF]"
            >
              <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24">
                <path
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                  fill="#4285F4"
                />
                <path
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                  fill="#34A853"
                />
                <path
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  fill="#EA4335"
                />
              </svg>
              Continue with Google
            </a>
          </div>

          {/* Switcher link */}
          <div className="mt-6 text-center">
            <p className="font-body text-[14px] text-[#5B6270]">
              {isRegistering ? 'Already have an account?' : 'New to Bosla?'}
              <button
                type="button"
                onClick={() => {
                  setIsRegistering((v) => !v)
                  setError(null)
                }}
                className="ml-1 rounded-md px-1.5 py-1 font-body text-[14px] font-medium text-[#1E3A8A] hover:bg-[#E8EDF9] hover:text-[#0F1115]"
              >
                {isRegistering ? 'Sign in' : 'Create an account'}
              </button>
            </p>
          </div>
        </div>
      </main>

      {/* Quiet Editorial Footer */}
      <footer className="w-full px-8 py-6 text-center">
        <div className="flex items-center justify-center gap-4 font-body text-[11px] text-[#5B6270]">
          <span>Privacy Policy</span>
          <span className="h-1 w-1 rounded-full bg-[#E6E7EA]" />
          <span>Terms of Service</span>
          <span className="h-1 w-1 rounded-full bg-[#E6E7EA]" />
          <span>System Status: Optimal</span>
        </div>
      </footer>
    </div>
  )
}
