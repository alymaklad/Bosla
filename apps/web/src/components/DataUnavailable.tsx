export function DataUnavailable({ title }: { title: string }) {
  return (
    <main className="mx-auto flex min-h-[55vh] max-w-[640px] flex-col items-center justify-center px-6 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FFF1D1] text-[#704A0B]" aria-hidden="true">
        <span className="material-symbols-outlined">wifi_off</span>
      </span>
      <h1 className="mt-4 font-display text-[22px] font-semibold text-[#0F1115]">{title}</h1>
      <p className="mt-2 font-body text-[14px] leading-relaxed text-[#5B6270]">Bosla could not load this page, and no saved snapshot is available. Check your connection and retry; no changes were made.</p>
      <button type="button" onClick={() => window.location.reload()} className="mt-5 rounded-lg bg-[#0F1115] px-5 py-2.5 font-body text-[13px] font-medium text-white hover:bg-[#252936]">Retry connection</button>
    </main>
  )
}
