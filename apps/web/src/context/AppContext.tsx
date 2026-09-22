import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { api, ApiError, type User } from '../api'

interface AppContextValue {
  user: User | null
  loading: boolean
  refreshUser: () => Promise<User | null>
  signOut: () => Promise<void>
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    try {
      const u = await api.me()
      setUser(u)
      return u
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setUser(null)
        return null
      }
      throw err
    }
  }, [])

  useEffect(() => {
    refreshUser().finally(() => setLoading(false))
  }, [refreshUser])

  useEffect(() => {
    document.documentElement.lang = 'en'
    document.documentElement.dir = 'ltr'
  }, [])

  const signOut = useCallback(async () => {
    await api.signOut()
    setUser(null)
  }, [])

  return <AppContext.Provider value={{ user, loading, refreshUser, signOut }}>{children}</AppContext.Provider>
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
