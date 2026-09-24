import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, type Roadmap } from '../api'

export function Roadmap() {
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null)
  const [selectedSkill, setSelectedSkill] = useState<string>('SQL')
  const navigate = useNavigate()

  useEffect(() => {
    api.getRoadmap().then((r) => {
      if (!r.steps || r.steps.length === 0) {
        api.generateRoadmap().then(setRoadmap).catch(() => {})
      } else {
        setRoadmap(r)
      }
    }).catch(() => {})
  }, [])

  const direction = roadmap?.direction || 'Data Analyst'
  const studySteps = roadmap?.steps.filter((s) => s.category === 'study') || []
  const skillSteps = roadmap?.steps.filter((s) => s.category === 'skill') || []
  const portfolioSteps = roadmap?.steps.filter((s) => s.category === 'portfolio') || []

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

      {/* Horizontal 4-Stage Milestone Card */}
      <div className="rounded-2xl border border-[#E6E7EA] bg-white p-6 shadow-[0_10px_24px_-24px_rgba(15,17,21,0.38)]">
        <div className="mb-6 flex items-center justify-between border-b border-[#EEF0F3] pb-5">
          <h2 className="font-display text-[18px] font-semibold text-[#0F1115]">
            Milestones overview
          </h2>
          <span className="rounded-full bg-[#F0F3FF] px-2.5 py-1 font-body text-[11px] font-medium text-[#1E3A8A]">
            1 of 4 stages finished
          </span>
        </div>
        <div className="relative grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="absolute top-7 right-12 left-12 z-0 hidden h-0.5 bg-[#E6E7EA] md:block" />

          {/* Stage 1 */}
          <div className="relative z-10 flex flex-col items-start rounded-xl border border-[#E6E7EA] bg-white p-4 md:border-transparent">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0F1115] text-white">
                <span className="material-symbols-outlined text-[16px]">check</span>
              </div>
              <span className="rounded-full bg-[#FEF3C7] px-2 py-0.5 font-body text-[11px] font-medium text-[#B45309]">
                Done
              </span>
            </div>
            <h3 className="font-body text-[14px] font-medium text-[#0F1115]">
              Foundations of SQL
            </h3>
            <p className="mt-1 font-body text-[11px] text-[#5B6270]">Completed fundamentals</p>
          </div>

          {/* Stage 2 */}
          <div className="relative z-10 flex flex-col items-start rounded-xl border border-[#1E3A8A] bg-[#FAFAF8] p-4 md:border-transparent md:bg-transparent">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#1E3A8A] bg-[#E8EDF9] font-body text-[12px] font-semibold text-[#1E3A8A]">
                2
              </div>
              <span className="rounded-full bg-[#E8EDF9] px-2 py-0.5 font-body text-[11px] font-medium text-[#1E3A8A]">
                In Progress
              </span>
            </div>
            <h3 className="font-body text-[14px] font-medium text-[#0F1115]">Python for data</h3>
            <p className="mt-1 font-body text-[11px] font-medium text-[#1E3A8A]">Current focus · 45%</p>
          </div>

          {/* Stage 3 */}
          <div className="relative z-10 flex flex-col items-start rounded-xl border border-[#E6E7EA] bg-white p-4 opacity-85 md:border-transparent">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E6E7EA] bg-white font-body text-[12px] text-[#76777B]">
                3
              </div>
              <span className="rounded-full bg-[#F0F3FF] px-2 py-0.5 font-body text-[11px] text-[#5B6270]">
                Upcoming
              </span>
            </div>
            <h3 className="font-body text-[14px] font-medium text-[#0F1115]">Portfolio project</h3>
            <p className="mt-1 font-body text-[11px] text-[#5B6270]">Target: Nov 2026</p>
          </div>

          {/* Stage 4 */}
          <div className="relative z-10 flex flex-col items-start rounded-xl border border-[#E6E7EA] bg-white p-4 opacity-85 md:border-transparent">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E6E7EA] bg-white font-body text-[12px] text-[#76777B]">
                4
              </div>
              <span className="rounded-full bg-[#F0F3FF] px-2 py-0.5 font-body text-[11px] text-[#5B6270]">
                Upcoming
              </span>
            </div>
            <h3 className="font-body text-[14px] font-medium text-[#0F1115]">Mock interviews</h3>
            <p className="mt-1 font-body text-[11px] text-[#5B6270]">Target: Dec 2026</p>
          </div>
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
            {studySteps.length || 2} modules configured
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
            <div className="flex flex-col justify-between rounded-lg border border-[#E6E7EA] bg-white p-4 sm:flex-row sm:items-center">
              <div className="space-y-1">
                <span className="font-body text-[14px] font-medium text-[#0F1115]">
                  Databases & SQL Optimization
                </span>
                <p className="font-body text-[13px] text-[#5B6270]">
                  Window functions, CTEs, indexing, and execution plans
                </p>
              </div>
              <button
                type="button"
                onClick={() => turnIntoHabit('Databases & SQL Optimization', 'Window functions and queries')}
                className="flex items-center gap-1.5 rounded-lg px-2 py-1 font-body text-[12px] font-medium text-[#1E3A8A] hover:bg-[#E8EDF9] hover:text-[#0F1115]"
              >
                <span className="material-symbols-outlined text-[16px]">alarm_add</span>
                <span>Make it a habit</span>
              </button>
            </div>
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
        <div className="mb-4 flex flex-wrap gap-2">
          {['SQL', 'Python (Pandas)', 'Data Modeling', 'Tableau / BI', 'Statistical A/B Testing'].map(
            (skill) => (
              <button
                key={skill}
                type="button"
                onClick={() => setSelectedSkill(skill)}
                className={`rounded px-3 py-1.5 font-body text-[12px] font-medium transition-colors ${
                  selectedSkill === skill
                    ? 'bg-[#0F1115] text-white'
                    : 'border border-[#E6E7EA] bg-white text-[#0F1115] hover:border-[#0F1115]'
                }`}
              >
                {skill}
              </button>
            ),
          )}
        </div>

        {/* Skill Card Detail */}
        <div className="rounded-lg border border-[#E6E7EA] bg-[#FAFAF8] p-4">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <span className="font-body text-[14px] font-semibold text-[#0F1115]">
                {selectedSkill} Core Proficiency
              </span>
              <p className="mt-0.5 font-body text-[13px] text-[#5B6270]">
                {skillSteps[0]?.description ||
                  `Targeted exercises and practical problem-sets for ${selectedSkill}.`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => turnIntoHabit(`${selectedSkill} Practice`, `Daily practice for ${selectedSkill}`)}
              className="flex items-center gap-1.5 self-start rounded-lg bg-[#0F1115] px-3.5 py-1.5 font-body text-[12px] font-medium text-white transition-colors hover:bg-[#1C1F26] sm:self-center"
            >
              <span className="material-symbols-outlined text-[15px]">alarm_add</span>
              <span>Turn into habit</span>
            </button>
          </div>
        </div>
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
            <div className="flex flex-col justify-between rounded-lg border border-[#E6E7EA] bg-white p-4 sm:flex-row sm:items-center">
              <div className="space-y-1">
                <span className="font-body text-[14px] font-medium text-[#0F1115]">
                  E-commerce User Retention Dashboard
                </span>
                <p className="font-body text-[13px] text-[#5B6270]">
                  Clean public cohort data, calculate LTV & retention metrics, and publish an interactive report.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  turnIntoHabit(
                    'Portfolio Project Sprint',
                    'Build an interactive cohort retention dashboard',
                  )
                }
                className="mt-2 flex items-center gap-1.5 rounded-lg px-2 py-1 font-body text-[12px] font-medium text-[#1E3A8A] hover:bg-[#E8EDF9] hover:text-[#0F1115] sm:mt-0"
              >
                <span className="material-symbols-outlined text-[16px]">alarm_add</span>
                <span>Turn into weekly habit</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
