import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

export function ErrorToast({ message, onDismiss }: { message: string | null; onDismiss: () => void }) {
  const [leaving, setLeaving] = useState(false)
  const dismissRef = useRef(onDismiss)

  useEffect(() => {
    dismissRef.current = onDismiss
  }, [onDismiss])

  useEffect(() => {
    if (!message) return
    const enter = window.setTimeout(() => setLeaving(false), 0)
    const leave = window.setTimeout(() => setLeaving(true), 4700)
    const remove = window.setTimeout(() => dismissRef.current(), 5100)
    return () => {
      window.clearTimeout(enter)
      window.clearTimeout(leave)
      window.clearTimeout(remove)
    }
  }, [message])

  useEffect(() => {
    if (!leaving) return
    const remove = window.setTimeout(() => dismissRef.current(), 350)
    return () => window.clearTimeout(remove)
  }, [leaving])

  if (!message) return null
  return createPortal(
    <div role="alert" aria-live="assertive" className={`bosla-error-toast fixed right-4 top-20 z-[100] flex w-[min(380px,calc(100vw-2rem))] items-start gap-3 rounded-xl border border-[#F1D2D2] bg-white p-4 text-[#0F1115] shadow-[0_16px_48px_rgba(15,17,21,0.17)] ${leaving ? 'bosla-error-toast-leaving' : ''}`}>
      <span className="material-symbols-outlined mt-0.5 shrink-0 text-[20px] text-[#B42318]">error</span>
      <div className="min-w-0 flex-1">
        <p className="font-body text-[13px] font-semibold">Something needs attention</p>
        <p className="mt-1 font-body text-[13px] leading-relaxed text-[#5B6270]">{message}</p>
      </div>
      <button type="button" onClick={() => setLeaving(true)} aria-label="Dismiss error" className="rounded-md p-1 text-[#5B6270] hover:bg-[#F4F5F7] hover:text-[#0F1115]">
        <span className="material-symbols-outlined text-[18px]">close</span>
      </button>
    </div>,
    document.body,
  )
}
