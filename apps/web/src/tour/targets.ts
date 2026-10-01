import type { TourStep } from './steps'

function isVisible(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect()
  return rect.width > 0 && rect.height > 0 && getComputedStyle(element).visibility !== 'hidden'
}

export function targetsFor(name: string): HTMLElement[] {
  return [...document.querySelectorAll<HTMLElement>(`[data-tour="${name}"]`)].filter(isVisible)
}

/** Steps whose target is on screen right now (the sidebar level card, for example, is hidden on phones). */
export function availableSteps(steps: TourStep[]): TourStep[] {
  return steps.filter((step) => targetsFor(step.target).length > 0)
}
