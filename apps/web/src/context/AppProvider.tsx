import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { api, ApiError, type User } from '../api'
import { AppContext } from './AppContext'

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    try {
      const current = await api.me()
      setUser(current)
      return current
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setUser(null)
        return null
      }
      throw err
    }
  }, [])

  useEffect(() => {
    let active = true
    api.me()
      .then((current) => {
        if (active) setUser(current)
      })
      .catch(() => {
        if (active) setUser(null)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const signOut = useCallback(async () => {
    await api.signOut()
    setUser(null)
  }, [])

  return <AppContext.Provider value={{ user, loading, refreshUser, signOut }}>{children}</AppContext.Provider>
}
