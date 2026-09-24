import { useEffect, useId, useRef } from 'react'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  busy?: boolean
  onCancel: () => void
  onConfirm: () => void
}

/** Accessible destructive-action confirmation that keeps people in Bosla's UI. */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  busy = false,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null)
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    if (!open) return
    cancelRef.current?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) onCancel()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [busy, onCancel, open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-[#0F1115]/45 p-4 backdrop-blur-sm sm:items-center"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onCancel()
      }}
    >
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="w-full max-w-md rounded-2xl border border-[#E6E7EA] bg-white p-6 shadow-2xl"
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#FEF2F2] text-[#B91C1C]">
          <span className="material-symbols-outlined text-[22px]">delete_forever</span>
        </div>
        <h2 id={titleId} className="mt-4 font-display text-[20px] font-semibold tracking-tight text-[#0F1115]">
          {title}
        </h2>
        <p id={descriptionId} className="mt-2 font-body text-[14px] leading-relaxed text-[#5B6270]">
          {description}
        </p>
        <div className="mt-5 rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-3.5 py-3 font-body text-[12px] leading-relaxed text-[#991B1B]">
          Your profile, conversations, documents, habits, and connected integration data will be permanently removed.
        </div>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            ref={cancelRef}
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="h-10 rounded-lg border border-[#D7DAE0] bg-white px-4 font-body text-[13px] font-medium text-[#0F1115] hover:border-[#0F1115] hover:bg-[#FAFAF8]"
          >
            Keep my account
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className="h-10 rounded-lg bg-[#B91C1C] px-4 font-body text-[13px] font-medium text-white hover:bg-[#991B1B] disabled:opacity-60"
          >
            {busy ? 'Deleting…' : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  )
}
