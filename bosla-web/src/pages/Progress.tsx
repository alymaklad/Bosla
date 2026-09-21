import { Flame, Trophy } from 'lucide-react'
import { useEffect, useState } from 'react'
import { api, type LevelInfo, type StreakInfo } from '../api'
import { Card } from '../components/Card'

export function Progress() {
  const [data, setData] = useState<{ level: LevelInfo; streak: StreakInfo; total_xp: number } | null>(null)

  useEffect(() => {
    api.progress().then(setData)
  }, [])

  if (!data) return null
  const pct = Math.round(data.level.progress * 100)

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-6 md:px-6 md:py-8">
      <h1 className="text-[26px] font-semibold">Progress</h1>

      <Card className="mt-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[13px] text-text-3">Level {data.level.level}</div>
            <div className="text-[22px] font-semibold font-display">{data.level.title}</div>
          </div>
          <Trophy size={28} className="text-amber-brand" />
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-amber-tint">
          <div className="h-full rounded-full bg-amber-brand" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-1.5 text-[12px] text-text-3">
          {data.level.current_xp.toLocaleString()} / {data.level.level_ceiling.toLocaleString()} XP · {data.level.xp_to_next} to next level
        </div>
      </Card>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <Card>
          <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.06em] text-text-3">
            <Flame size={14} className="text-amber-brand" /> Current streak
          </div>
          <div className="mt-2 text-[28px] font-semibold font-display">{data.streak.current}</div>
        </Card>
        <Card>
          <div className="text-[12px] font-semibold uppercase tracking-[0.06em] text-text-3">Longest streak</div>
          <div className="mt-2 text-[28px] font-semibold font-display">{data.streak.longest}</div>
        </Card>
      </div>

      <Card className="mt-4">
        <div className="text-[12px] font-semibold uppercase tracking-[0.06em] text-text-3">Total XP earned</div>
        <div className="mt-2 text-[28px] font-semibold font-display">{data.total_xp.toLocaleString()}</div>
      </Card>
    </main>
  )
}
