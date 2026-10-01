import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, HABITS_CHANGED_EVENT, type DashboardData, type Roadmap } from '../api'
import { useApp } from '../context/AppContext'
import { ErrorToast } from './ErrorToast'
import { GettingStarted } from './GettingStarted'
import { useTour } from '../tour/TourContext'
import { PageLoading } from './PageLoading'

const PERSONAS: Record<string, string> = {
  student: 'Secondary-school student',
  university: 'University student',
  graduate: 'Recent graduate',
  switcher: 'Shifting career',
}

async function fetchHome() {
  const [dashboard, roadmap] = await Promise.allSettled([api.dashboard(), api.getRoadmap()])
  if (dashboard.status === 'rejected') throw dashboard.reason
  return {
    dashboard: dashboard.value,
    roadmap: roadmap.status === 'fulfilled' ? roadmap.value : null,
    roadmapError: roadmap.status === 'rejected' ? 'Your roadmap could not be loaded right now.' : null,
  }
}

export function Dashboard() {
  const { user, onboardingStatus, refreshOnboarding } = useApp()
  const { justFinished, dismissFinished } = useTour()
  const [data, setData] = useState<DashboardData | null>(null)
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!onboardingStatus?.completed) return
    try {
      const { dashboard, roadmap: savedRoadmap, roadmapError } = await fetchHome()
      setData(dashboard)
      setRoadmap(savedRoadmap)
      setError(roadmapError)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load your home page. Please retry.')
    } finally {
      setLoading(false)
    }
  }, [onboardingStatus?.completed])

  useEffect(() => {
    if (!onboardingStatus?.completed) return
    let active = true
    void fetchHome()
      .then(({ dashboard, roadmap: savedRoadmap, roadmapError }) => {
        if (!active) return
        setData(dashboard)
        setRoadmap(savedRoadmap)
        setError(roadmapError)
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'Could not load your home page. Please retry.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    window.addEventListener(HABITS_CHANGED_EVENT, load)
    return () => {
      active = false
      window.removeEventListener(HABITS_CHANGED_EVENT, load)
    }
  }, [load, onboardingStatus?.completed])

  async function toggle(id: string, done: boolean) {
    try {
      await api.logOccurrence(id, { completed: !done })
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update this habit. Please retry.')
    }
  }

  if (!onboardingStatus?.completed) {
    return (
      <main className="mx-auto w-full max-w-[1080px] px-6 py-10">
        <div className="rounded-2xl border border-[#DCE4FA] bg-[#F7F9FF] p-8 sm:p-10">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#E8EDF9] text-[#1E3A8A]">
            <span className="material-symbols-outlined">explore</span>
          </span>
          <p className="mt-6 font-body text-[11px] font-semibold uppercase tracking-widest text-[#1E3A8A]">Welcome to Bosla</p>
          <h1 className="mt-2 font-display text-[30px] font-semibold text-[#0F1115]">Your journey starts with your story</h1>
          <p className="mt-3 max-w-2xl font-body text-[15px] leading-relaxed text-[#5B6270]">
            {onboardingStatus
              ? 'Your onboarding progress is saved. Finish the conversation and explore your matches before your personalized dashboard appears.'
              : 'We could not check your onboarding progress right now. Retry to continue where you left off.'}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {onboardingStatus ? (
              <Link to={onboardingStatus.nextPath} className="inline-flex items-center gap-2 rounded-lg bg-[#0F1115] px-5 py-2.5 font-body text-[13px] font-medium text-white hover:bg-[#252936]">
                Continue onboarding <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </Link>
            ) : (
              <button type="button" onClick={() => void refreshOnboarding().catch(() => setError('Could not check your progress. Please retry.'))} className="rounded-lg bg-[#0F1115] px-5 py-2.5 font-body text-[13px] font-medium text-white">Retry status check</button>
            )}
            <Link to="/settings" className="inline-flex items-center rounded-lg border border-[#DCE4FA] bg-white px-5 py-2.5 font-body text-[13px] font-medium text-[#1E3A8A] hover:bg-[#E8EDF9]">View profile</Link>
          </div>
        </div>
        <ErrorToast message={error} onDismiss={() => setError(null)} />
      </main>
    )
  }

  if (loading) return <PageLoading label="Loading your home page…" />
  if (!data) {
    return <main className="mx-auto max-w-[1080px] px-6 py-12">
      <h1 className="font-display text-[24px] font-semibold">Your home page could not be loaded</h1>
      <p className="mt-2 font-body text-[14px] text-[#5B6270]">Your data has not been changed. Check your connection and retry.</p>
      <button type="button" onClick={() => void load()} className="mt-5 rounded-lg bg-[#0F1115] px-4 py-2 font-body text-[13px] font-medium text-white">Retry</button>
      <ErrorToast message={error} onDismiss={() => setError(null)} />
    </main>
  }

  const firstName = (user?.name || user?.email || 'there').split(' ')[0]
  const today = data.today ?? []
  const matches = data.top_matches ?? []
  const steps = roadmap?.steps ?? []
  const direction = data.chosen_direction
  const weekPct = Math.max(0, Math.min(100, Math.round(data.week_completion_pct)))

  return (
    <main className="mx-auto w-full max-w-[1280px] space-y-7 px-6 py-8">
      <ErrorToast message={error} onDismiss={() => setError(null)} />
      {justFinished && (
        <div role="status" className="flex items-center justify-between gap-3 rounded-xl border border-[#E6E7EA] bg-white px-4 py-3">
          <span className="flex items-center gap-2.5 font-body text-[14px] text-[#0F1115]">
            <span className="material-symbols-outlined text-[19px] text-[#1E3A8A]" aria-hidden="true">check_circle</span>
            Tour complete. Replay it anytime from Profile → Help.
          </span>
          <button type="button" onClick={dismissFinished} aria-label="Dismiss" className="flex h-8 w-8 items-center justify-center rounded-lg text-[#5B6270] hover:bg-[#F0F3FF]">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      )}
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-[#E6E7EA] pb-6">
        <div>
          <p className="font-body text-[11px] uppercase tracking-wider text-[#5B6270]">{new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date())}</p>
          <h1 className="mt-2 font-display text-[32px] font-bold text-[#0F1115]">Welcome back, {firstName}</h1>
          <p className="mt-2 font-body text-[14px] text-[#5B6270]">{direction ? `Your current direction is ${direction}.` : 'Explore your matches and choose a direction when you are ready.'}</p>
        </div>
        {user?.persona && <span className="rounded-lg border border-[#DCE4FA] bg-[#F7F9FF] px-3 py-2 font-body text-[12px] text-[#1E3A8A]">{PERSONAS[user.persona] ?? user.persona}</span>}
      </header>

      {user?.tour_completed_at && <GettingStarted userId={user.id} data={data} roadmap={roadmap} />}

      <section aria-label="Your activity" className="grid gap-4 sm:grid-cols-3">
        <article data-tour="streaks" className="rounded-xl border border-[#E6E7EA] bg-white p-5">
          <p className="font-body text-[12px] text-[#5B6270]">Current streak</p>
          <p className="mt-2 font-display text-[28px] font-semibold text-[#0F1115]">{data.streak.current} days</p>
          <p className="mt-1 font-body text-[11px] text-[#5B6270]">Longest streak: {data.streak.longest} days</p>
        </article>
        <article data-tour="streaks" className="rounded-xl border border-[#E6E7EA] bg-white p-5">
          <p className="font-body text-[12px] text-[#5B6270]">Habits this week</p>
          <p className="mt-2 font-display text-[28px] font-semibold text-[#0F1115]">{data.week_completed} of {data.week_scheduled}</p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#E6E7EA]"><div className="h-full rounded-full bg-[#1E3A8A]" style={{ width: `${weekPct}%` }} /></div>
          <p className="mt-2 font-body text-[11px] text-[#5B6270]">{data.week_scheduled ? `${weekPct}% completed so far` : 'No habits scheduled yet'}</p>
        </article>
        <article data-tour="direction" className="rounded-xl border border-[#E6E7EA] bg-white p-5">
          <p className="font-body text-[12px] text-[#5B6270]">Career direction</p>
          <p className="mt-2 font-display text-[22px] font-semibold text-[#0F1115]">{direction ?? 'Not selected yet'}</p>
          <p className="mt-2 font-body text-[11px] text-[#5B6270]">{direction ? 'Based on your selected career match' : 'Choose a match to build your roadmap'}</p>
        </article>
      </section>

      <div className="grid items-start gap-5 lg:grid-cols-2">
        <section data-tour="today-habits" className="rounded-xl border border-[#E6E7EA] bg-white p-6">
          <div className="mb-5 flex items-center justify-between border-b border-[#E6E7EA] pb-4">
            <h2 className="font-display text-[18px] font-semibold">Today's habits</h2>
            <Link to="/habits" className="font-body text-[12px] font-medium text-[#1E3A8A] hover:underline">View all</Link>
          </div>
          {today.length ? <ul className="space-y-3">{today.map((item) => <li key={item.id} className="flex items-center gap-3 rounded-lg border border-[#E6E7EA] p-3">
            <button type="button" onClick={() => void toggle(item.id, item.status === 'complete')} aria-label={`${item.status === 'complete' ? 'Undo' : 'Complete'} ${item.habit_name}`} className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-[#1E3A8A] text-[#1E3A8A] hover:bg-[#E8EDF9]">{item.status === 'complete' && <span className="material-symbols-outlined text-[17px]">check</span>}</button>
            <span className="min-w-0 flex-1 font-body text-[13px] text-[#0F1115]">{item.habit_name}</span>
            <span className="font-body text-[11px] text-[#5B6270]">{item.target_minutes} min</span>
          </li>)}</ul> : <p className="py-8 text-center font-body text-[13px] text-[#5B6270]">No habits due today.</p>}
        </section>

        <section className="rounded-xl border border-[#E6E7EA] bg-white p-6">
          <div className="mb-5 flex items-center justify-between border-b border-[#E6E7EA] pb-4">
            <h2 className="font-display text-[18px] font-semibold">Your career matches</h2>
            <Link to="/matches" className="font-body text-[12px] font-medium text-[#1E3A8A] hover:underline">View all</Link>
          </div>
          {matches.length ? <ul className="space-y-3">{matches.map((match) => <li key={match.id}><Link to={`/matches/${match.id}`} className="flex items-center justify-between gap-3 rounded-lg border border-[#E6E7EA] p-3 transition-colors hover:border-[#1E3A8A] hover:bg-[#F8FAFF]"><span className="font-body text-[13px] font-medium text-[#0F1115]">{match.title}</span><span className="shrink-0 font-body text-[12px] font-semibold text-[#1E3A8A]">{match.fit_score}% fit</span></Link></li>)}</ul> : <p className="py-8 text-center font-body text-[13px] text-[#5B6270]">No matches generated yet. Continue discovery to explore possible directions.</p>}
        </section>
      </div>

      <section className="rounded-xl border border-[#E6E7EA] bg-white p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-[#E6E7EA] pb-4">
          <div>
            <h2 className="font-display text-[18px] font-semibold">Your roadmap</h2>
            <p className="mt-1 font-body text-[12px] text-[#5B6270]">{roadmap?.direction ? `Next steps toward ${roadmap.direction}` : direction ? 'Your roadmap is not available right now.' : 'Choose a career direction to create a personal roadmap.'}</p>
          </div>
          {steps.length > 0 && <Link to="/roadmap" className="rounded-lg border border-[#E6E7EA] px-3 py-2 font-body text-[12px] font-medium text-[#1E3A8A] hover:bg-[#F8FAFF]">Open roadmap</Link>}
        </div>
        {steps.length ? <ol className="grid gap-3 md:grid-cols-4">{steps.slice(0, 4).map((step, index) => <li key={index} className="rounded-lg border border-[#E6E7EA] p-4">
          <span className="font-body text-[11px] font-semibold uppercase tracking-wider text-[#5B6270]">Step {index + 1} · {step.done ? 'Done' : 'To do'}</span>
          <h3 className="mt-2 font-body text-[14px] font-semibold text-[#0F1115]">{step.title}</h3>
          <p className="mt-1 line-clamp-3 font-body text-[12px] text-[#5B6270]">{step.description}</p>
        </li>)}</ol> : direction ? <button type="button" onClick={() => void load()} className="font-body text-[13px] font-medium text-[#1E3A8A] hover:underline">Retry loading roadmap</button> : <Link to="/matches" className="inline-flex items-center gap-2 font-body text-[13px] font-medium text-[#1E3A8A] hover:underline">Explore matches <span className="material-symbols-outlined text-[17px]">arrow_forward</span></Link>}
      </section>
    </main>
  )
}
