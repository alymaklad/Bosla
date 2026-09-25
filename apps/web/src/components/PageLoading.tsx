import { LoadingSpinner } from './LoadingSpinner'

interface PageLoadingProps {
  label?: string
  fullScreen?: boolean
}

/** Stable route gate: data-driven screens do not show placeholder content before their first response. */
export function PageLoading({ label = 'Preparing your workspace…', fullScreen = false }: PageLoadingProps) {
  return (
    <div className={`mx-auto flex w-full max-w-[1280px] items-center justify-center px-6 ${fullScreen ? 'min-h-dvh bg-[#FAFAF8]' : 'min-h-[56vh]'}`} role="status" aria-live="polite">
      <div className="w-full max-w-sm rounded-2xl border border-[#E6E7EA] bg-white px-7 py-8 text-center shadow-sm">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F0F3FF]">
          <LoadingSpinner size={40} />
        </span>
        <p className="mt-5 font-display text-[16px] font-semibold text-[#0F1115]">{label}</p>
        <p className="mt-1 font-body text-[12px] text-[#5B6270]">Finding the next step. This should only take a moment.</p>
        <div className="mt-5 flex items-center justify-center gap-1.5" aria-hidden="true">
          <span className="bosla-loader-dot" />
          <span className="bosla-loader-dot [animation-delay:240ms]" />
          <span className="bosla-loader-dot [animation-delay:480ms]" />
        </div>
      </div>
    </div>
  )
}
