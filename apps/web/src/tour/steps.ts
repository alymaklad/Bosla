export type Placement = 'top' | 'bottom' | 'left' | 'right'

export interface TourStep {
  /** Matches `data-tour="…"` on the element(s) to spotlight; several matches are outlined together. */
  target: string
  placement: Placement
  title: string
  body: string
  note?: string
}

export const TOUR_STEPS: TourStep[] = [
  {
    target: 'direction',
    placement: 'bottom',
    title: 'Your current direction',
    body: 'This is the career direction you chose from your matches, based on your discovery conversation and career context. You can change it anytime from Discover.',
  },
  {
    target: 'nav',
    placement: 'right',
    title: 'Where everything lives',
    body: 'Discover careers, build habits, learn on your roadmap, and review your progress. Profile holds your settings, and Home brings it all together.',
  },
  {
    target: 'today-habits',
    placement: 'right',
    title: 'Small steps, done daily',
    body: 'Each habit comes from a step in your roadmap. Tick it off here, or start a timer on the Habits page to log real minutes.',
    note: 'Assumed = ticked without a timer, so Bosla credits the planned time instead of measured time.',
  },
  {
    target: 'streaks',
    placement: 'bottom',
    title: 'Consistency, measured',
    body: 'A streak counts the days in a row where everything due was done. The weekly count resets every Monday.',
  },
  {
    target: 'level',
    placement: 'right',
    title: 'Levels reflect effort',
    body: 'Completed habits earn XP, and longer or harder sessions earn more. XP builds your level, shown here and on the Progress page.',
  },
  {
    target: 'ask-bosla',
    placement: 'top',
    title: 'Ask Bosla anything',
    body: 'Questions about a career, a skill, or what to do next. Bosla answers with your profile in mind.',
  },
]
