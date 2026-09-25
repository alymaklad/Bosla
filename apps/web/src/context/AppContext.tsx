import { createContext, useContext } from 'react'
import type { OnboardingStatus, User } from '../api'

export interface AppContextValue {
  user: User | null
  loading: boolean
  onboardingStatus: OnboardingStatus | null
  refreshOnboarding: () => Promise<void>
  refreshUser: () => Promise<User | null>
  signOut: () => Promise<void>
}

export const AppContext = createContext<AppContextValue | null>(null)

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
