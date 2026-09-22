import type { ReactNode } from 'react'

export function Card({
  title,
  action,
  children,
  className = '',
}: {
  title?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`min-w-0 rounded-card border border-line bg-white p-5 md:p-6 ${className}`}>
      {(title || action) && (
        <header className="mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          {title && <h3 className="text-[18px] font-semibold">{title}</h3>}
          {action}
        </header>
      )}
      {children}
    </section>
  )
}

export function FitRing({ value, size = 44 }: { value: number; size?: number }) {
  const r = size * 0.36
  const c = 2 * Math.PI * r
  const center = size / 2
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      <circle cx={center} cy={center} r={r} fill="none" stroke="#E6E7EA" strokeWidth="4" />
      <circle
        cx={center}
        cy={center}
        r={r}
        fill="none"
        stroke="#1E3A8A"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - value / 100)}
        transform={`rotate(-90 ${center} ${center})`}
      />
      <text x={center} y={center + 4} textAnchor="middle" fontSize={size * 0.25} fontWeight="600" fill="#0F1115" fontFamily="Space Grotesk">
        {value}%
      </text>
    </svg>
  )
}

const CONFIDENCE_COLOR: Record<string, string> = {
  none: '#E6E7EA',
  low: '#F59E0B',
  medium: '#1E3A8A',
  high: '#16A34A',
}

export function ConfidenceDot({ confidence }: { confidence: string }) {
  return (
    <span
      className="inline-block h-2 w-2 shrink-0 rounded-full"
      style={{ background: CONFIDENCE_COLOR[confidence] ?? CONFIDENCE_COLOR.none }}
      title={`${confidence} confidence`}
    />
  )
}

export function Chip({
  tone = 'indigo',
  outline = false,
  children,
}: {
  tone?: 'indigo' | 'amber' | 'neutral'
  outline?: boolean
  children: ReactNode
}) {
  const styles = outline
    ? tone === 'amber'
      ? 'border border-amber-brand text-amber-brand'
      : 'border border-line text-text-2'
    : tone === 'indigo'
      ? 'bg-indigo-tint text-indigo-brand'
      : tone === 'amber'
        ? 'bg-amber-tint text-[#92400e]'
        : 'bg-page text-text-2'
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-chip px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.06em] ${styles}`}>
      {children}
    </span>
  )
}
