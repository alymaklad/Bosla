import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, type Roadmap } from '../api'
import { PageLoading } from '../components/PageLoading'

export function Roadmap() {
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    async function loadRoadmap() {
      try {
        const existing = await api.getRoadmap()
        setRoadmap(existing.steps.length > 0 ? existing : await api.generateRoadmap())
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : 'Your roadmap could not be loaded.')
      } finally {
        setLoading(false)
      }
    }
    void loadRoadmap()
  }, [])

  if (loading) return <PageLoading label="Loading your learning roadmap…" />

  if (!roadmap) {
    return (
      <main className="mx-auto flex min-h-[56vh] w-full max-w-[760px] flex-col items-center justify-center px-6 text-center">
        <span className="material-symbols-outlined text-[34px] text-[#1E3A8A]">route</span>
        <h1 className="mt-4 font-display text-[24px] font-semibold text-[#0F1115]">Your roadmap is not ready yet</h1>
        <p className="mt-2 max-w-md font-body text-[14px] leading-relaxed text-[#5B6270]">{loadError || 'Choose a career direction first, then Bosla can create a focused learning path.'}</p>
        <button type="button" onClick={() => navigate('/matches')} className="mt-5 rounded-xl bg-[#0F1115] px-4 py-2.5 font-body text-[13px] font-medium text-white hover:bg-[#1C1F26]">Explore career matches</button>
      </main>
    )
  }

  const direction = roadmap.direction || 'your selected direction'
  const studySteps = roadmap.steps.filter((s) => s.category === 'study')
  const skillSteps = roadmap.steps.filter((s) => s.category === 'skill')
  const portfolioSteps = roadmap.steps.filter((s) => s.category === 'portfolio')
  const activeSkill = skillSteps.find((step) => step.title === selectedSkill) || skillSteps[0]
  const stages = [
    { title: 'Foundations', detail: studySteps.length ? `${studySteps.length} learning module${studySteps.length === 1 ? '' : 's'} mapped` : 'Learning modules appear here', icon: 'menu_book', state: 'Current' },
    { title: 'Skill practice', detail: skillSteps.length ? `${skillSteps.length} skill focus${skillSteps.length === 1 ? '' : 'es'} mapped` : 'Build your core capabilities', icon: 'construction', state: 'Next' },
    { title: 'Portfolio proof', detail: portfolioSteps.length ? `${portfolioSteps.length} project${portfolioSteps.length === 1 ? '' : 's'} mapped` : 'Turn practice into proof of work', icon: 'folder_open', state: 'Next' },
    { title: 'Career readiness', detail: 'Apply, interview, and refine your direction', icon: 'rocket_launch', state: 'Later' },
  ]

  function turnIntoHabit(stepTitle: string, description: string) {
    navigate('/habit-wizard', { state: { title: stepTitle, description } })
  }

  return (
    <main className="mx-auto w-full max-w-[1280px] space-y-8 px-6 py-8 md:py-10">
      {/* Header Section */}
      <div className="flex flex-col justify-between gap-6 border-b border-[#E6E7EA] pb-7 md:flex-row md:items-end">
        <div>
          <div className="mb-4 flex items-center gap-3">
            <span className="rounded-md bg-[#E8EDF9] px-2.5 py-1 font-body text-[10px] font-semibold tracking-[0.1em] uppercase text-[#1E3A8A]">
              Active Track
            </span>
            <span className="h-1 w-1 rounded-full bg-[#C6C6CB]" />
            <span className="font-body text-[12px] text-[#5B6270]">Updated recently</span>
          </div>
          <h1 className="font-display text-[32px] font-bold leading-[1.08] tracking-tight text-[#0F1115] md:text-[38px]">
            Your roadmap to {direction}
          </h1>
          <p className="mt-3 font-body text-[14px] leading-relaxed text-[#5B6270]">
            A first path — not a syllabus. Change anything.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/habit-wizard')}
            className="flex h-11 items-center gap-2 rounded-xl bg-[#0F1115] px-4 font-body text-[13px] font-medium text-white hover:bg-[#1C3A8A]"
          >
            <span className="material-symbols-outlined text-[16px]">add_task</span>
            <span>Turn a step into a habit</span>
          </button>
        </div>
      </div>

      {/* Data-based 4-stage learning progression */}
      <div className="rounded-2xl border border-[#E6E7EA] bg-white p-6 shadow-[0_10px_24px_-24px_rgba(15,17,21,0.38)]">
        <div className="mb-6 flex items-center justify-between border-b border-[#EEF0F3] pb-5">
          <h2 className="font-display text-[18px] font-semibold text-[#0F1115]">
            Learning progression
          </h2>
          <span className="rounded-full bg-[#F0F3FF] px-2.5 py-1 font-body text-[11px] font-medium text-[#1E3A8A]">
            4-stage path
          </span>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          {stages.map((stage, index) => {
            const current = index === 0
            return <article key={stage.title} className={`relative overflow-hidden rounded-xl border p-4 ${current ? 'border-[#AFC2FA] bg-[#F4F7FF]' : 'border-[#E6E7EA] bg-white'}`}>
              <div className="flex items-center justify-between"><div className={`flex h-8 w-8 items-center justify-center rounded-lg ${current ? 'bg-[#1E3A8A] text-white' : 'bg-[#F4F5F7] text-[#5B6270]'}`}><span className="material-symbols-outlined text-[17px]">{stage.icon}</span></div><span className={`font-body text-[10px] font-semibold uppercase tracking-[0.08em] ${current ? 'text-[#1E3A8A]' : 'text-[#76777B]'}`}>Stage {index + 1}</span></div>
              <p className="mt-4 font-body text-[13px] font-semibold text-[#0F1115]">{stage.title}</p>
              <p className="mt-1 min-h-9 font-body text-[11px] leading-relaxed text-[#5B6270]">{stage.detail}</p>
              <span className={`mt-3 inline-flex rounded-full px-2 py-0.5 font-body text-[10px] font-medium ${current ? 'bg-[#E8EDF9] text-[#1E3A8A]' : 'bg-[#F4F5F7] text-[#5B6270]'}`}>{stage.state}</span>
            </article>
          })}
        </div>
      </div>

      {/* Section 1: Study path */}
      <div className="rounded-lg border border-[#E6E7EA] bg-white p-6">
        <div className="mb-4 flex items-center justify-between border-b border-[#E6E7EA] pb-4">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[#1E3A8A]">menu_book</span>
            <div>
              <h2 className="font-display text-[18px] font-semibold text-[#0F1115]">Study path</h2>
              <p className="font-body text-[11px] text-[#5B6270]">Structured Learning Modules</p>
            </div>
          </div>
          <span className="font-body text-[12px] text-[#5B6270]">
            {studySteps.length} modules configured
          </span>
        </div>

        <div className="space-y-3">
          {studySteps.length > 0 ? (
            studySteps.map((step, idx) => (
              <div
                key={idx}
                className="flex flex-col justify-between rounded-lg border border-[#E6E7EA] bg-white p-4 transition-colors hover:border-[#0F1115] sm:flex-row sm:items-center"
              >
                <div className="mb-3 space-y-1 sm:mb-0">
                  <div className="flex items-center gap-2">
                    <span className="font-body text-[14px] font-medium text-[#0F1115]">
                      {step.title}
                    </span>
                    <span className="rounded bg-[#F0F3FF] px-2 py-0.5 font-body text-[11px] text-[#5B6270]">
                      Study module
                    </span>
                  </div>
                  <p className="font-body text-[13px] text-[#5B6270]">{step.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => turnIntoHabit(step.title, step.description)}
                  className="flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 font-body text-[12px] font-medium text-[#1E3A8A] transition-colors hover:bg-[#E8EDF9]"
                >
                  <span className="material-symbols-outlined text-[16px]">alarm_add</span>
                  <span>Make it a habit</span>
                </button>
              </div>
            ))
          ) : (
            <p className="rounded-xl border border-dashed border-[#D7DAE0] px-4 py-5 font-body text-[13px] text-[#5B6270]">No study modules have been added to this roadmap yet.</p>
          )}
        </div>
      </div>

      {/* Section 2: Skills to build */}
      <div className="rounded-lg border border-[#E6E7EA] bg-white p-6">
        <div className="mb-4 flex items-center justify-between border-b border-[#E6E7EA] pb-4">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[#1E3A8A]">construction</span>
            <div>
              <h2 className="font-display text-[18px] font-semibold text-[#0F1115]">
                Skills to build
              </h2>
              <p className="font-body text-[11px] text-[#5B6270]">Core competencies to acquire</p>
            </div>
          </div>
          <span className="font-body text-[12px] text-[#5B6270]">Click to inspect mastery</span>
        </div>

        {/* Skill Chips */}
        {skillSteps.length > 0 ? <>
        <div className="mb-4 flex flex-wrap gap-2">
          {skillSteps.map((skill) => (
              <button
                key={skill.title}
                type="button"
                onClick={() => setSelectedSkill(skill.title)}
                className={`rounded px-3 py-1.5 font-body text-[12px] font-medium transition-colors ${
                  activeSkill?.title === skill.title
                    ? 'bg-[#0F1115] text-white'
                    : 'border border-[#E6E7EA] bg-white text-[#0F1115] hover:border-[#0F1115]'
                }`}
              >
                {skill.title}
              </button>
          ))}
        </div>

        {/* Skill Card Detail */}
        <div className="rounded-lg border border-[#E6E7EA] bg-[#FAFAF8] p-4">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <span className="font-body text-[14px] font-semibold text-[#0F1115]">
                {activeSkill?.title}
              </span>
              <p className="mt-0.5 font-body text-[13px] text-[#5B6270]">
                {activeSkill?.description}
              </p>
            </div>
            <button
              type="button"
              onClick={() => activeSkill && turnIntoHabit(activeSkill.title, activeSkill.description)}
              className="flex items-center gap-1.5 self-start rounded-lg bg-[#0F1115] px-3.5 py-1.5 font-body text-[12px] font-medium text-white transition-colors hover:bg-[#1C1F26] sm:self-center"
            >
              <span className="material-symbols-outlined text-[15px]">alarm_add</span>
              <span>Turn into habit</span>
            </button>
          </div>
        </div>
        </> : <p className="rounded-xl border border-dashed border-[#D7DAE0] px-4 py-5 font-body text-[13px] text-[#5B6270]">No skill-practice steps have been added to this roadmap yet.</p>}
      </div>

      {/* Section 3: Portfolio Projects */}
      <div className="rounded-lg border border-[#E6E7EA] bg-white p-6">
        <div className="mb-4 flex items-center justify-between border-b border-[#E6E7EA] pb-4">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[#1E3A8A]">folder_open</span>
            <div>
              <h2 className="font-display text-[18px] font-semibold text-[#0F1115]">
                Portfolio projects
              </h2>
              <p className="font-body text-[11px] text-[#5B6270]">Tangible proof of competence</p>
            </div>
          </div>
          <span className="font-body text-[12px] text-[#5B6270]">Proof of work</span>
        </div>

        <div className="space-y-3">
          {portfolioSteps.length > 0 ? (
            portfolioSteps.map((step, idx) => (
              <div
                key={idx}
                className="flex flex-col justify-between rounded-lg border border-[#E6E7EA] bg-white p-4 transition-colors hover:border-[#0F1115] sm:flex-row sm:items-center"
              >
                <div className="space-y-1">
                  <span className="font-body text-[14px] font-medium text-[#0F1115]">
                    {step.title}
                  </span>
                  <p className="font-body text-[13px] text-[#5B6270]">{step.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => turnIntoHabit(step.title, step.description)}
                  className="mt-2 flex items-center gap-1.5 rounded-lg px-2 py-1 font-body text-[12px] font-medium text-[#1E3A8A] hover:bg-[#E8EDF9] hover:text-[#0F1115] sm:mt-0"
                >
                  <span className="material-symbols-outlined text-[16px]">alarm_add</span>
                  <span>Turn into weekly habit</span>
                </button>
              </div>
            ))
          ) : (
            <p className="rounded-xl border border-dashed border-[#D7DAE0] px-4 py-5 font-body text-[13px] text-[#5B6270]">No portfolio project has been added to this roadmap yet.</p>
          )}
        </div>
      </div>
    </main>
  )
}
