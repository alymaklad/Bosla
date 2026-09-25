import { useEffect, useRef, useState } from 'react'
import { OFFLINE_DATA_EVENT, wasConnectionInterrupted } from '../lib/offlineCache'

export function OfflineBanner({ inline = false }: { inline?: boolean }) {
  const [offline, setOffline] = useState(() => !navigator.onLine || wasConnectionInterrupted())
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const wasOffline = useRef(!navigator.onLine || wasConnectionInterrupted())

  useEffect(() => {
    const disconnected = () => {
      wasOffline.current = true
      setOffline(true)
    }
    const cachedResponse = (event: Event) => {
      const at = (event as CustomEvent<{ savedAt?: number }>).detail?.savedAt
      if (at) setSavedAt(at)
      disconnected()
    }
    const reconnected = () => {
      if (wasOffline.current) window.location.reload()
    }
    window.addEventListener('offline', disconnected)
    window.addEventListener('online', reconnected)
    window.addEventListener(OFFLINE_DATA_EVENT, cachedResponse)
    return () => {
      window.removeEventListener('offline', disconnected)
      window.removeEventListener('online', reconnected)
      window.removeEventListener(OFFLINE_DATA_EVENT, cachedResponse)
    }
  }, [])

  if (!offline) return null
  const snapshot = savedAt ? ` Last saved ${new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(savedAt)}.` : ''

  return (
    <aside role="status" aria-live="polite" className={`${inline ? 'sticky top-0 z-20' : 'fixed inset-x-0 top-16 z-50'} border-b border-[#F4D69B] bg-[#FFF8E8] px-4 py-2.5 shadow-sm`}>
      <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-2">
        <p className="font-body text-[12px] leading-relaxed text-[#704A0B]"><span className="font-semibold">{navigator.onLine ? 'Connection interrupted.' : 'You’re offline.'}</span> Showing your last saved data where available; changes are paused.{snapshot}</p>
        <button type="button" onClick={() => window.location.reload()} className="shrink-0 rounded-lg border border-[#D9B36B] bg-white px-3 py-1 font-body text-[12px] font-semibold text-[#704A0B] hover:bg-[#FFF1D1]">Retry connection</button>
      </div>
    </aside>
  )
}
