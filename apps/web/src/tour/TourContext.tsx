import { createContext, useContext } from 'react'

export interface TourContextValue {
  /** Open the welcome dialog on the home page (used by "Replay tour"). */
  startTour: () => void
  /** True right after the tour is finished, until the confirmation banner is dismissed. */
  justFinished: boolean
  dismissFinished: () => void
}

export const TourContext = createContext<TourContextValue | null>(null)

export function useTour(): TourContextValue {
  const ctx = useContext(TourContext)
  if (!ctx) throw new Error('useTour must be used within TourProvider')
  return ctx
}
