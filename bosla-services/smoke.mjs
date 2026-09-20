import { habitEngine, goalPlanner, careerDiscovery, DEFAULT_SCORING } from './dist/index.js'

// Habit engine: recompute-honest scoring + level curve + streaks
const cfg = DEFAULT_SCORING
const facts = { targetMinutes: 30, loggedMinutes: 30, completed: true, justifiedSkip: false, elapsed: true, origin: 'timer' }
const status = habitEngine.statusOf(facts, cfg)
const points = habitEngine.pointsFor(status, cfg)
console.log('status:', status, 'points:', points)

const level = habitEngine.levelInfo(1000)
console.log('level for 1000xp:', level.level, level.title)

const streak = habitEngine.computeStreaks([
  { date: '2026-01-01', status: 'complete' },
  { date: '2026-01-02', status: 'complete' },
  { date: '2026-01-03', status: 'missed' },
  { date: '2026-01-04', status: 'complete' }
])
console.log('streak:', streak)

// Goal planner: pure schedule-conflict check (no API key needed)
const conflicts = goalPlanner.findScheduleConflicts(
  [{ name: 'Learn Spanish', days: [1, 3], scheduledTime: '18:00', targetMinutes: 30, rationale: null }],
  [{ name: 'Gym', days: [1], start: 17 * 60 + 45, end: 19 * 60 }]
)
console.log('conflicts:', conflicts.length, conflicts[0]?.session)

// Career discovery: pure marker filtering, no API key needed
async function* fakeStream() {
  yield 'Hello, '
  yield 'Human: this should be cut'
}
const filtered = []
for await (const chunk of careerDiscovery.filterOnMarkers(fakeStream(), ['Human:'])) filtered.push(chunk)
console.log('filtered stream output:', JSON.stringify(filtered))

console.log('SMOKE TEST PASSED')
