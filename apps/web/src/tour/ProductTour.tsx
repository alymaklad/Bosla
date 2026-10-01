import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { api } from '../api'
import type { Placement, TourStep } from './steps'
import { targetsFor } from './targets'

const PAD = 6
const GAP = 14
const MARGIN = 16
const CARD_WIDTH = 340
const SHEET_BREAKPOINT = 640

interface Box {
  top: number
  left: number
  width: number
  height: number
}

function unionBox(elements: HTMLElement[]): Box {
  const rects = elements.map((element) => element.getBoundingClientRect())
  const top = Math.min(...rects.map((r) => r.top))
  const left = Math.min(...rects.map((r) => r.left))
  const bottom = Math.max(...rects.map((r) => r.bottom))
  const right = Math.max(...rects.map((r) => r.right))
  return { top, left, width: right - left, height: bottom - top }
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), Math.max(min, max))
const OPPOSITE: Record<Placement, Placement> = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' }

interface CardPosition {
  top: number
  left: number
  side: Placement
  caret: number
}

function placeCard(target: Box, preferred: Placement, size: { width: number; height: number }): CardPosition {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const box = { top: target.top - PAD, left: target.left - PAD, right: target.left + target.width + PAD, bottom: target.top + target.height + PAD }
  const fits: Record<Placement, boolean> = {
    right: box.right + GAP + size.width <= vw - MARGIN,
    left: box.left - GAP - size.width >= MARGIN,
    bottom: box.bottom + GAP + size.height <= vh - MARGIN,
    top: box.top - GAP - size.height >= MARGIN,
  }
  const order: Placement[] = [preferred, OPPOSITE[preferred], 'bottom', 'top', 'right', 'left']
  const side = order.find((candidate) => fits[candidate]) ?? 'bottom'
  const centreX = (box.left + box.right) / 2
  const centreY = (box.top + box.bottom) / 2

  if (side === 'left' || side === 'right') {
    const top = clamp(box.top, MARGIN, vh - size.height - MARGIN)
    const left = side === 'right' ? box.right + GAP : box.left - GAP - size.width
    return { top, left, side, caret: clamp(centreY - top, 22, size.height - 22) }
  }
  const left = clamp(centreX - size.width / 2, MARGIN, vw - size.width - MARGIN)
  const top = side === 'bottom' ? Math.min(box.bottom + GAP, vh - size.height - MARGIN) : Math.max(box.top - GAP - size.height, MARGIN)
  return { top, left, side, caret: clamp(centreX - left, 22, size.width - 22) }
}

function trapFocus(event: ReactKeyboardEvent<HTMLElement>) {
  if (event.key !== 'Tab') return
  const focusable = [...event.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled]), a[href]')]
  if (!focusable.length) return
  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

interface WelcomeProps {
  firstName: string
  starting: boolean
  onStart: () => void
  onExplore: () => void
}

export function WelcomeDialog({ firstName, starting, onStart, onExplore }: WelcomeProps) {
  const [direction, setDirection] = useState<string | null>(null)
  const startRef = useRef<HTMLButtonElement>(null)
  const titleId = useId()
  const bodyId = useId()

  useEffect(() => {
    let active = true
    api.dashboard().then((data) => { if (active) setDirection(data.chosen_direction) }).catch(() => {})
    startRef.current?.focus()
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onExplore() }
    window.addEventListener('keydown', onKey)
    return () => {
      active = false
      window.removeEventListener('keydown', onKey)
    }
  }, [onExplore])

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#0F1115]/45 p-4 backdrop-blur-[2px]">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        onKeyDown={trapFocus}
        className="w-full max-w-[560px] rounded-2xl border border-[#E6E7EA] bg-white px-6 py-9 text-center shadow-2xl sm:px-10"
      >
        <img src="/brand/bosla-mark.png" alt="" className="mx-auto h-14 w-14 object-contain" />
        <h2 id={titleId} className="mt-5 font-display text-[26px] font-semibold tracking-tight text-[#0F1115] sm:text-[30px]">
          Welcome to Bosla, {firstName}
        </h2>
        <p id={bodyId} className="mx-auto mt-3 max-w-[440px] font-body text-[15px] leading-relaxed text-[#45474B]">
          {direction
            ? <>Your compass is set to {direction}. This 60-second tour shows how to turn that direction into daily progress.</>
            : <>This 60-second tour shows how Bosla turns your career direction into daily progress.</>}
        </p>
        <button
          ref={startRef}
          type="button"
          disabled={starting}
          onClick={onStart}
          className="mt-8 h-12 w-full rounded-lg bg-[#0F1115] font-body text-[15px] font-medium text-white transition-colors hover:bg-[#252936] disabled:opacity-60"
        >
          {starting ? 'Getting your home page ready…' : 'Start tour'}
        </button>
        <button
          type="button"
          onClick={onExplore}
          className="mt-4 rounded-md px-3 py-1.5 font-body text-[15px] text-[#45474B] hover:text-[#0F1115]"
        >
          I&apos;ll explore on my own
        </button>
        <p className="mt-4 font-body text-[12px] text-[#5B6270]">You can replay this anytime from Profile → Help.</p>
      </section>
    </div>
  )
}

interface SpotlightProps {
  step: TourStep
  index: number
  total: number
  onBack: () => void
  onNext: () => void
  onSkip: () => void
}

export function SpotlightStep({ step, index, total, onBack, onNext, onSkip }: SpotlightProps) {
  const [target, setTarget] = useState<Box | null>(null)
  const [size, setSize] = useState({ width: CARD_WIDTH, height: 240 })
  const [viewport, setViewport] = useState(() => ({ width: window.innerWidth, height: window.innerHeight }))
  const cardRef = useRef<HTMLElement>(null)
  const primaryRef = useRef<HTMLButtonElement>(null)
  const titleId = useId()
  const bodyId = useId()
  const isLast = index === total - 1

  useLayoutEffect(() => {
    // Phones show the card as a bottom sheet, so lift the target to the top of the page instead of the centre.
    const block = window.innerWidth < SHEET_BREAKPOINT ? 'start' : 'center'
    targetsFor(step.target)[0]?.scrollIntoView({ block, inline: 'nearest', behavior: 'smooth' })
    let frame = 0
    const measure = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const elements = targetsFor(step.target)
        setTarget(elements.length ? unionBox(elements) : null)
        setViewport({ width: window.innerWidth, height: window.innerHeight })
      })
    }
    measure()
    // Smooth scrolling moves the target after the first measurement.
    const settle = window.setTimeout(measure, 450)
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    return () => {
      cancelAnimationFrame(frame)
      window.clearTimeout(settle)
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
    }
  }, [step.target])

  useEffect(() => {
    const card = cardRef.current
    if (!card) return
    const observer = new ResizeObserver(() => setSize({ width: card.offsetWidth, height: card.offsetHeight }))
    observer.observe(card)
    return () => observer.disconnect()
  }, [])


  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onSkip()
      else if (event.key === 'ArrowRight') onNext()
      else if (event.key === 'ArrowLeft' && index > 0) onBack()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [index, onBack, onNext, onSkip])

  const sheet = viewport.width < SHEET_BREAKPOINT
  // On phones the card is a sheet; keep it on the side away from the target (the tab bar sits at the bottom).
  const sheetOnTop = sheet && target !== null && target.top > viewport.height - (target.top + target.height)
  const position = target && !sheet ? placeCard(target, step.placement, size) : null
  const cardStyle = sheet || !position
    ? undefined
    : { top: position.top, left: position.left, width: Math.min(CARD_WIDTH, viewport.width - MARGIN * 2) }

  const placed = sheet || Boolean(position)
  useEffect(() => {
    // The desktop card stays invisible (and unfocusable) until it is measured.
    if (placed) primaryRef.current?.focus()
  }, [index, placed])

  const caretStyle = position
    ? position.side === 'left' || position.side === 'right'
      ? { top: position.caret - 7, [position.side === 'right' ? 'left' : 'right']: -7 }
      : { left: position.caret - 7, [position.side === 'bottom' ? 'top' : 'bottom']: -7 }
    : undefined
  const caretBorders = position
    ? { right: 'border-l border-b', left: 'border-r border-t', bottom: 'border-l border-t', top: 'border-r border-b' }[position.side]
    : ''

  return (
    <>
      {/* Blocks clicks on the page while a step is shown; the highlight casts the dim backdrop. */}
      <div className={`fixed inset-0 z-[90] ${target ? '' : 'bg-[#0F1115]/45'}`} aria-hidden="true" />
      {target && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed z-[91] rounded-xl ring-2 ring-[#1E3A8A] ring-offset-2 ring-offset-white transition-all duration-300"
          style={{
            top: target.top - PAD,
            left: target.left - PAD,
            width: target.width + PAD * 2,
            height: target.height + PAD * 2,
            boxShadow: '0 0 0 9999px rgba(15, 17, 21, 0.45)',
          }}
        />
      )}
      <section
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        onKeyDown={trapFocus}
        className={`fixed z-[92] rounded-xl border border-[#E6E7EA] bg-white p-6 text-left shadow-2xl transition-[top,left] duration-300 ${
          sheet || !position ? `inset-x-4 ${sheetOnTop ? 'top-4' : 'bottom-4'}` : ''
        } ${!sheet && !position ? 'invisible' : ''}`}
        style={cardStyle}
      >
        {position && <span aria-hidden="true" className={`absolute h-3.5 w-3.5 rotate-45 border-[#E6E7EA] bg-white ${caretBorders}`} style={caretStyle} />}
        <div className="mb-3 flex items-center justify-between">
          <span className="font-body text-[11px] font-semibold uppercase tracking-[0.08em] text-[#5B6270]">
            Step {index + 1} of {total}
          </span>
          <button type="button" onClick={onSkip} className="rounded px-1 font-body text-[12px] text-[#5B6270] hover:text-[#0F1115]">
            Skip tour
          </button>
        </div>
        <h2 id={titleId} className="font-display text-[19px] font-semibold leading-snug text-[#0F1115]">{step.title}</h2>
        <p id={bodyId} className="mt-2 font-body text-[14px] leading-relaxed text-[#45474B]">{step.body}</p>
        {step.note && (
          <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-[#DCE4FA] bg-[#F4F7FF] p-3 font-body text-[12px] leading-relaxed text-[#1D2430]">
            <span className="material-symbols-outlined mt-0.5 text-[16px] text-[#1E3A8A]" aria-hidden="true">help</span>
            <span>{step.note}</span>
          </div>
        )}
        <div className="mt-5 flex items-center justify-between border-t border-[#E6E7EA] pt-4">
          <div className="flex items-center gap-1.5" aria-hidden="true">
            {Array.from({ length: total }, (_, dot) => (
              <span key={dot} className={`h-1.5 rounded-full transition-all ${dot === index ? 'w-4 bg-[#0F1115]' : 'w-1.5 bg-[#D8DCE3]'}`} />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={index === 0}
              onClick={onBack}
              className="h-9 rounded-lg border border-[#E6E7EA] px-3.5 font-body text-[13px] font-medium text-[#0F1115] hover:border-[#0F1115] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Back
            </button>
            <button
              ref={primaryRef}
              type="button"
              onClick={onNext}
              className="h-9 rounded-lg bg-[#0F1115] px-4 font-body text-[13px] font-semibold text-white hover:bg-[#252936]"
            >
              {isLast ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
      </section>
    </>
  )
}
