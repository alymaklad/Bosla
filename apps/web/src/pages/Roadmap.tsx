import { BookOpen, Sparkles, Target, Wrench } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, type Roadmap as RoadmapData } from '../api'

const CATEGORY_META = {
  study: { label: 'Study path', icon: BookOpen },
  skill: { label: 'Skills', icon: Wrench },
  portfolio: { label: 'Portfolio steps', icon: Target },
} as const

export function Roadmap() {
  const [roadmap, setRoadmap] = useState<RoadmapData | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    api.getRoadmap().then(async (r) => {
      if (r.id) {
        setRoadmap(r)
        setLoading(false)
        return
      }
      try {
        const generated = await api.generateRoadmap()
        setRoadmap(generated)
      } catch {
        setRoadmap({ id: null, direction: null, steps: [] })
      } finally {
        setLoading(false)
      }
    })
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-3 px-6 text-center">
        <Sparkles className="animate-pulse text-indigo-brand" size={28} />
        <p className="text-[15px] font-medium">Building your roadmap…</p>
      </div>
    )
  }

  if (!roadmap?.direction) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-[15px] font-medium">Choose a career direction first.</p>
        <button
          type="button"
          onClick={() => navigate('/matches')}
          className="h-10 rounded-card bg-ink px-4 text-[14px] font-medium text-white hover:bg-ink-hover"
        >
          See your matches
        </button>
      </div>
    )
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-6 md:px-6 md:py-8">
      <h1 className="text-[26px] font-semibold">Roadmap: {roadmap.direction}</h1>
      <p className="mt-1 text-text-2">Study path, skills, and portfolio steps to get there.</p>

      {(['study', 'skill', 'portfolio'] as const).map((cat) => {
        const steps = roadmap.steps.filter((s) => s.category === cat)
        if (steps.length === 0) return null
        const { label, icon: Icon } = CATEGORY_META[cat]
        return (
          <section key={cat} className="mt-6">
            <div className="flex items-center gap-2 text-[15px] font-semibold">
              <Icon size={16} className="text-indigo-brand" /> {label}
            </div>
            <ol className="mt-3 space-y-2">
              {steps.map((s, i) => (
                <li key={i} className="flex items-center justify-between gap-3 rounded-card border border-line bg-white p-3.5">
                  <div className="min-w-0">
                    <div className="text-[14px] font-medium">{s.title}</div>
                    <div className="text-[12px] text-text-3">{s.description}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('/habit-wizard', { state: { title: s.title, description: s.description } })}
                    className="h-9 shrink-0 whitespace-nowrap rounded-card border border-ink bg-white px-3 text-[12px] font-medium text-ink hover:bg-page"
                  >
                    Make it a habit
                  </button>
                </li>
              ))}
            </ol>
          </section>
        )
      })}
    </main>
  )
}
