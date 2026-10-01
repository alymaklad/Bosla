import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useApp } from '../context/AppContext'
import { SpotlightStep, WelcomeDialog } from './ProductTour'
import { availableSteps } from './targets'
import { TOUR_STEPS, type TourStep } from './steps'
import { TourContext } from './TourContext'

const HOME = '/dashboard'
const READY_TARGET = '[data-tour="direction"]'

/** Wait briefly for the home page cards, so starting during a slow load does not drop their steps. */
async function waitForHome(timeoutMs = 4000): Promise<void> {
  const started = Date.now()
  while (!document.querySelector(READY_TARGET) && Date.now() - started < timeoutMs) {
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
}

export function TourProvider({ children }: { children: ReactNode }) {
  const { user, onboardingStatus, refreshUser } = useApp()
  const location = useLocation()
  const navigate = useNavigate()
  const [phase, setPhase] = useState<'idle' | 'welcome' | 'steps'>('idle')
  const [autoHandled, setAutoHandled] = useState(false)
  const [starting, setStarting] = useState(false)
  const [steps, setSteps] = useState<TourStep[]>([])
  const [index, setIndex] = useState(0)
  const [justFinished, setJustFinished] = useState(false)

  const onHome = location.pathname === HOME
  const firstTime = Boolean(user && onboardingStatus?.completed && !user.tour_completed_at)
  const showWelcome = onHome && (phase === 'welcome' || (phase === 'idle' && firstTime && !autoHandled))

  const complete = useCallback((finished: boolean) => {
    setPhase('idle')
    setAutoHandled(true)
    setJustFinished(finished)
    if (user && !user.tour_completed_at) {
      // Best effort: if this fails the tour is offered again next visit, which is harmless.
      void api.setTourCompleted(true).then(() => refreshUser()).catch(() => {})
    }
  }, [refreshUser, user])

  const begin = useCallback(async () => {
    setStarting(true)
    await waitForHome()
    const visible = availableSteps(TOUR_STEPS)
    setStarting(false)
    if (!visible.length) {
      complete(true)
      return
    }
    setAutoHandled(true)
    setSteps(visible)
    setIndex(0)
    setPhase('steps')
  }, [complete])

  const startTour = useCallback(() => {
    setAutoHandled(true)
    setJustFinished(false)
    setPhase('welcome')
    if (location.pathname !== HOME) navigate(HOME)
  }, [location.pathname, navigate])

  const next = useCallback(() => {
    if (index >= steps.length - 1) complete(true)
    else setIndex((current) => current + 1)
  }, [complete, index, steps.length])
  const back = useCallback(() => setIndex((current) => Math.max(0, current - 1)), [])
  const skip = useCallback(() => complete(false), [complete])
  const dismissFinished = useCallback(() => setJustFinished(false), [])

  const value = useMemo(() => ({ startTour, justFinished, dismissFinished }), [dismissFinished, justFinished, startTour])
  const firstName = (user?.name || user?.email || 'there').split(' ')[0]
  const step = steps[index]

  return (
    <TourContext.Provider value={value}>
      {children}
      {showWelcome && <WelcomeDialog firstName={firstName} starting={starting} onStart={() => void begin()} onExplore={skip} />}
      {phase === 'steps' && onHome && step && (
        <SpotlightStep key={step.target} step={step} index={index} total={steps.length} onBack={back} onNext={next} onSkip={skip} />
      )}
    </TourContext.Provider>
  )
}
