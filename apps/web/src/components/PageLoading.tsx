interface PageLoadingProps {
  label?: string
}

/** Stable route gate: data-driven screens do not show placeholder content before their first response. */
export function PageLoading({ label = 'Preparing your workspace…' }: PageLoadingProps) {
  return (
    <div className="mx-auto flex min-h-[56vh] w-full max-w-[1280px] items-center justify-center px-6" role="status" aria-live="polite">
      <div className="flex items-center gap-3 rounded-2xl border border-[#E6E7EA] bg-white px-4 py-3 shadow-sm">
        <span className="material-symbols-outlined animate-spin text-[20px] text-[#1E3A8A]">progress_activity</span>
        <span className="font-body text-[13px] text-[#5B6270]">{label}</span>
      </div>
    </div>
  )
}
