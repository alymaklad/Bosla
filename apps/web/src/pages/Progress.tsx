import { useEffect, useState } from 'react'
import { api, type HabitProgress } from '../api'

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

function achievement(id: string, title: string, desc: string, icon: string, value: number, target: number, footer: string): Achievement {
  const current = Math.min(value, target)
  const unlocked = current >= target
  return {
    id, title, desc, icon, unlocked,
    progressText: `${current} / ${target}`,
    progressPct: Math.round((current / target) * 100),
    footer: unlocked ? 'Unlocked from your activity' : footer,
  }
}

function achievementsFor(data: HabitProgress | null): Achievement[] {
  const completed = data?.stats.completed_occurrences ?? 0
  const minutes = data?.stats.logged_minutes ?? 0
  const morning = data?.stats.morning_completed ?? 0
  const streak = data?.streak.longest ?? 0
  const activeHabits = data?.stats.active_habits ?? 0
  return [
    achievement('streak-7', 'First 7-Day Streak', 'Complete habits for 7 days in a row', 'star', streak, 7, `${Math.max(0, 7 - streak)} days to go`),
    achievement('hours-10', '10 Hours Studied', 'Log 10 hours of focused work', 'school', Math.floor(minutes / 60), 10, `${Math.max(0, 10 - Math.floor(minutes / 60))}h remaining`),
    achievement('tasks-50', '50 Sessions Completed', 'Finish 50 planned habit sessions', 'task_alt', completed, 50, `${Math.max(0, 50 - completed)} to go`),
    achievement('morning', 'Morning Practitioner', 'Complete 20 sessions before 9 AM', 'wb_sunny', morning, 20, `${Math.max(0, 20 - morning)} to go`),
    achievement('streak-30', '30-Day Streak', 'Sustain a 30-day habit streak', 'local_fire_department', streak, 30, `${Math.max(0, 30 - streak)} days to go`),
    achievement('hours-50', '50 Hours Studied', 'Log 50 hours of focused work', 'schedule', Math.floor(minutes / 60), 50, `${Math.max(0, 50 - Math.floor(minutes / 60))}h remaining`),
    achievement('tasks-100', '100 Sessions Completed', 'Finish 100 planned habit sessions', 'done_all', completed, 100, `${Math.max(0, 100 - completed)} to go`),
    achievement('pioneer', 'Direction Pioneer', 'Save your first weekly habit plan', 'explore', activeHabits > 0 ? 1 : 0, 1, 'Save a weekly plan to unlock'),
  ]
}

export function Progress() {
  const [data, setData] = useState<HabitProgress | null>(null)

  useEffect(() => {
    api.progress().then(setData).catch(() => {})
  }, [])

  const level = data?.level?.level ?? 1
  const title = data?.level?.title ?? 'Beginner'
  const currentXp = data?.level?.current_xp ?? 0
  const ceilingXp = data?.level?.level_ceiling ?? 400
  const pct = Math.round((data?.level?.progress ?? 0) * 100)
  const streak = data?.streak?.current ?? 0
  const longest = data?.streak?.longest ?? 0
  const totalXp = data?.total_xp ?? 0
  const achievements = achievementsFor(data)

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
          {achievements.map((item) => (
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
