import { useEffect, useState } from 'react'
import { api, type LevelInfo, type StreakInfo } from '../api'

interface Achievement {
  id: string
  title: string
  desc: string
  icon: string
  unlocked: boolean
  progressText?: string
  progressPct?: number
  footer: string
}

const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'streak-7',
    title: 'First 7-Day Streak',
    desc: 'Completed 7 days in a row',
    icon: 'star',
    unlocked: true,
    footer: 'Unlocked recently',
  },
  {
    id: 'hours-10',
    title: '10 Hours Studied',
    desc: 'Logged 10 hours of verified study',
    icon: 'school',
    unlocked: true,
    footer: 'Unlocked 18 Aug',
  },
  {
    id: 'tasks-50',
    title: '50 Tasks Completed',
    desc: 'Finish 50 curriculum milestones',
    icon: 'task_alt',
    unlocked: false,
    progressText: '34 / 50',
    progressPct: 68,
    footer: '16 to go',
  },
  {
    id: 'morning',
    title: 'Morning Practitioner',
    desc: 'Complete 20 morning sessions before 9 AM',
    icon: 'wb_sunny',
    unlocked: false,
    progressText: '18 / 20',
    progressPct: 90,
    footer: '2 to go',
  },
  {
    id: 'streak-30',
    title: '30-Day Streak',
    desc: 'Sustain uninterrupted monthly cadence',
    icon: 'local_fire_department',
    unlocked: false,
    progressText: '7 / 30',
    progressPct: 23,
    footer: '23 to go',
  },
  {
    id: 'hours-50',
    title: '50 Hours Studied',
    desc: 'Deep focus milestone across all roadmaps',
    icon: 'schedule',
    unlocked: false,
    progressText: '41 / 50',
    progressPct: 82,
    footer: '9h remaining',
  },
  {
    id: 'tasks-100',
    title: '100 Tasks Completed',
    desc: 'Centurion milestone in career execution',
    icon: 'done_all',
    unlocked: false,
    progressText: '34 / 100',
    progressPct: 34,
    footer: '66 to go',
  },
  {
    id: 'pioneer',
    title: 'Direction Pioneer',
    desc: 'Formulate roadmap and schedule first week',
    icon: 'explore',
    unlocked: true,
    footer: 'Unlocked on onboarding',
  },
]

export function Progress() {
  const [data, setData] = useState<{
    level: LevelInfo
    streak: StreakInfo
    total_xp: number
  } | null>(null)

  useEffect(() => {
    api.progress().then(setData).catch(() => {})
  }, [])

  const level = data?.level?.level ?? 3
  const title = data?.level?.title ?? 'Disciplined'
  const currentXp = data?.level?.current_xp ?? 620
  const ceilingXp = data?.level?.level_ceiling ?? 1000
  const pct = Math.round(data?.level?.progress ? data.level.progress * 100 : 62)
  const streak = data?.streak?.current ?? 7
  const longest = data?.streak?.longest ?? 12
  const totalXp = data?.total_xp ?? 1420

  return (
    <main className="mx-auto w-full max-w-[1280px] px-6 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="font-display text-[32px] font-bold tracking-tight text-[#0F1115] md:text-[36px]">
          Progress
        </h1>
        <p className="mt-1 font-body text-[15px] text-[#5B6270]">
          Your momentum, milestones, and personal records across all habits and roadmaps.
        </p>
      </div>

      {/* Hero Card: Level & Milestone Status */}
      <div className="mb-8 rounded-lg border border-[#E6E7EA] bg-white p-6">
        <div className="flex flex-col justify-between gap-4 border-b border-[#E6E7EA] pb-5 md:flex-row md:items-center">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-[#E6E7EA] bg-[#FAFAF8]">
              <span className="material-symbols-outlined text-[26px] text-[#0F1115]">
                military_tech
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-[22px] font-bold text-[#0F1115]">
                  Level {level} · {title}
                </h2>
                <span className="rounded-full bg-[#FEF3C7] px-2 py-0.5 font-body text-[11px] font-medium text-[#B45309]">
                  Active tier
                </span>
              </div>
              <p className="mt-0.5 font-body text-[13px] text-[#5B6270]">
                Next tier: <span className="font-medium text-[#0F1115]">Focused</span> at {ceilingXp.toLocaleString()} XP ({ceilingXp - currentXp} XP remaining)
              </p>
            </div>
          </div>

          <div className="flex items-baseline justify-between gap-1 text-right md:flex-col md:items-end">
            <span className="font-display text-[18px] font-bold text-[#0F1115]">
              {currentXp.toLocaleString()} / {ceilingXp.toLocaleString()} XP
            </span>
            <span className="font-body text-[12px] text-[#5B6270]">{pct}% completed</span>
          </div>
        </div>

        {/* Large Progress Bar with Markers */}
        <div className="pt-5">
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#E6E7EA]">
            <div
              className="h-full rounded-full bg-[#F59E0B] transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="mt-2.5 flex items-center justify-between font-body text-[11px] text-[#5B6270]">
            <span>Level {level - 1}: Apprentice</span>
            <span className="font-medium text-[#0F1115]">Current: {title} ({currentXp} XP)</span>
            <span>Level {level + 1}: Focused ({ceilingXp} XP)</span>
          </div>
        </div>
      </div>

      {/* Stat Summary Cards (Row of 3) */}
      <div className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* 1. Current streak */}
        <div className="rounded-lg border border-[#E6E7EA] bg-white p-6">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-body text-[12px] font-medium text-[#5B6270]">Current streak</span>
            <span className="material-symbols-outlined text-[#F59E0B] fill-icon">
              local_fire_department
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-[32px] font-bold text-[#0F1115]">{streak} days</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 border-t border-[#E6E7EA] pt-3 font-body text-[11px] text-[#5B6270]">
            <span className="material-symbols-outlined text-[16px] text-[#1E3A8A]">
              check_circle
            </span>
            <span>Target logged today</span>
          </div>
        </div>

        {/* 2. Longest streak */}
        <div className="rounded-lg border border-[#E6E7EA] bg-white p-6">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-body text-[12px] font-medium text-[#5B6270]">Longest streak</span>
            <span className="material-symbols-outlined text-[#5B6270]">history</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-[32px] font-bold text-[#0F1115]">
              {longest} days
            </span>
          </div>
          <div className="mt-3 border-t border-[#E6E7EA] pt-3 font-body text-[11px] text-[#5B6270]">
            Personal record
          </div>
        </div>

        {/* 3. Total XP earned */}
        <div className="rounded-lg border border-[#E6E7EA] bg-white p-6">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-body text-[12px] font-medium text-[#5B6270]">
              Total XP earned
            </span>
            <span className="material-symbols-outlined text-[#5B6270]">military_tech</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-[32px] font-bold text-[#0F1115]">
              {totalXp.toLocaleString()} XP
            </span>
          </div>
          <div className="mt-3 border-t border-[#E6E7EA] pt-3 font-body text-[11px] text-[#5B6270]">
            Across active roadmaps
          </div>
        </div>
      </div>

      {/* Section: Achievements */}
      <section className="mb-10">
        <div className="mb-5">
          <h2 className="font-display text-[22px] font-bold text-[#0F1115]">Achievements</h2>
          <p className="mt-0.5 font-body text-[14px] text-[#5B6270]">
            Milestones unlocked through continuous deliberate practice.
          </p>
        </div>

        {/* 8 Achievement Badges Grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {ACHIEVEMENTS.map((item) => (
            <div
              key={item.id}
              className={`flex flex-col justify-between rounded-lg border border-[#E6E7EA] bg-white p-5 transition-colors hover:border-[#0F1115] ${
                item.unlocked ? '' : 'opacity-90'
              }`}
            >
              <div>
                <div className="mb-3 flex items-start justify-between">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                      item.unlocked
                        ? 'bg-[#E7EEFF] text-[#1E3A8A]'
                        : 'bg-[#F4F4F5] text-[#5B6270]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                  </div>
                  {item.unlocked ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#E8EDF9] px-2 py-0.5 font-body text-[11px] font-medium text-[#1E3A8A]">
                      <span className="material-symbols-outlined text-[12px]">check_circle</span>
                      Unlocked
                    </span>
                  ) : (
                    <span className="rounded-full bg-[#F4F4F5] px-2 py-0.5 font-body text-[11px] font-medium text-[#5B6270]">
                      {item.progressText}
                    </span>
                  )}
                </div>

                <h3 className="mb-1 font-display text-[15px] font-semibold text-[#0F1115]">
                  {item.title}
                </h3>
                <p className="font-body text-[12px] leading-snug text-[#5B6270]">{item.desc}</p>
              </div>

              <div className="mt-4 border-t border-[#E6E7EA] pt-3">
                {!item.unlocked && item.progressPct !== undefined ? (
                  <div>
                    <div className="mb-1 h-1.5 w-full overflow-hidden rounded-full bg-[#E6E7EA]">
                      <div
                        className="h-full rounded-full bg-[#1E3A8A]"
                        style={{ width: `${item.progressPct}%` }}
                      />
                    </div>
                    <div className="flex justify-between font-body text-[10px] text-[#8A8F98]">
                      <span>{item.progressPct}% completed</span>
                      <span>{item.footer}</span>
                    </div>
                  </div>
                ) : (
                  <span className="font-body text-[11px] text-[#8A8F98]">{item.footer}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
