import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { api, ApiError, type OnboardingStatus, type User } from '../api'
import { AppContext } from './AppContext'

const USER_CACHE_KEY = 'bosla.cached-user.v1'

function cachedUser(): User | null {
  try {
    const raw = window.localStorage.getItem(USER_CACHE_KEY)
    if (!raw) return null
    const value = JSON.parse(raw) as Partial<User>
    if (typeof value.id !== 'string' || typeof value.email !== 'string' || typeof value.name !== 'string') return null
    return {
      id: value.id,
      email: value.email,
      name: value.name,
      persona: typeof value.persona === 'string' ? value.persona : null,
      consent_given: value.consent_given === true,
    }
  } catch {
    return null
  }
}

function rememberUser(user: User | null) {
  try {
    if (user) window.localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user))
    else window.localStorage.removeItem(USER_CACHE_KEY)
  } catch {
    // Storage can be unavailable in privacy-restricted browsers; the secure cookie still works.
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(cachedUser)
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshOnboarding = useCallback(async (currentUser?: User | null) => {
    const account = currentUser === undefined ? await api.me() : currentUser
    if (!account) {
      setOnboardingStatus(null)
      return
    }
    if (!account.consent_given) {
      setOnboardingStatus({ consentGiven: false, discoveryReady: false, matchesGenerated: false, completed: false, nextPath: '/onboarding/consent' })
      return
    }
    const [profile, matches] = await Promise.all([api.discoveryProfile(), api.listMatches()])
    const matchesGenerated = matches.length > 0
    setOnboardingStatus({
      consentGiven: true,
      discoveryReady: profile.ready,
      matchesGenerated,
      completed: profile.ready && matchesGenerated,
      nextPath: !profile.ready ? (profile.exchange_count > 0 ? '/onboarding/discovery' : '/onboarding/cv') : matchesGenerated ? '/dashboard' : '/onboarding/discovery',
    })
  }, [])

  const refreshUser = useCallback(async () => {
    try {
      const current = await api.me()
      setUser(current)
      rememberUser(current)
      try {
        await refreshOnboarding(current)
      } catch {
        setOnboardingStatus(null)
      }
      return current
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setUser(null)
        setOnboardingStatus(null)
        rememberUser(null)
        return null
      }
      throw err
    }
  }, [refreshOnboarding])

  useEffect(() => {
    let active = true
    api.me()
      .then(async (current) => {
        if (active) {
          setUser(current)
          rememberUser(current)
          await refreshOnboarding(current)
        }
      })
      .catch((err) => {
        if (!active) return
        if (err instanceof ApiError && err.status === 401) {
          setUser(null)
          setOnboardingStatus(null)
          rememberUser(null)
          return
        }
        // Keep the last known profile through a temporary network outage.
        if (!cachedUser()) setUser(null)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [refreshOnboarding])

  const signOut = useCallback(async () => {
    try {
      await api.signOut()
    } finally {
      setUser(null)
      setOnboardingStatus(null)
      rememberUser(null)
    }
  }, [])

  return <AppContext.Provider value={{ user, loading, onboardingStatus, refreshOnboarding, refreshUser, signOut }}>{children}</AppContext.Provider>
}
