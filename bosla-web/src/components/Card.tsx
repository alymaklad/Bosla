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
        <header className="mb-4 flex items-center justify-between">
          {title && <h3 className="text-[18px] font-semibold">{title}</h3>}
          {action}
        </header>
      )}
      {children}
    </section>
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
    <span className={`inline-flex items-center rounded-chip px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.06em] ${styles}`}>
      {children}
    </span>
  )
}
