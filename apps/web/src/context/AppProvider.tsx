import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { api, ApiError, type User } from '../api'
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
  const [loading, setLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    try {
      const current = await api.me()
      setUser(current)
      rememberUser(current)
      return current
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setUser(null)
        rememberUser(null)
        return null
      }
      throw err
    }
  }, [])

  useEffect(() => {
    let active = true
    api.me()
      .then((current) => {
        if (active) {
          setUser(current)
          rememberUser(current)
        }
      })
      .catch((err) => {
        if (!active) return
        if (err instanceof ApiError && err.status === 401) {
          setUser(null)
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
  }, [])

  const signOut = useCallback(async () => {
    try {
      await api.signOut()
    } finally {
      setUser(null)
      rememberUser(null)
    }
  }, [])

  return <AppContext.Provider value={{ user, loading, refreshUser, signOut }}>{children}</AppContext.Provider>
}
