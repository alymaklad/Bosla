import { useEffect } from 'react'
import { api, HABITS_CHANGED_EVENT } from '../api'

const INTERVAL_MS = 3 * 60 * 1000

/** Google Tasks cannot notify us, so pull changes on open, on refocus, and on an interval while visible. */
export function useGoogleAutoSync() {
  useEffect(() => {
    let connected = false
    let running = false
    let cancelled = false

    const pull = async () => {
      if (!connected || running || cancelled || document.visibilityState !== 'visible') return
      running = true
      try {
        const result = await api.pullGoogle()
        if (result.imported_completions > 0) window.dispatchEvent(new Event(HABITS_CHANGED_EVENT))
      } catch {
        // Auto-sync is best effort; Settings still offers a manual sync with a visible error.
      } finally {
        running = false
      }
    }

    api.googleSyncStatus()
      .then((status) => {
        connected = status.connected
        void pull()
      })
      .catch(() => {})

    const interval = window.setInterval(() => void pull(), INTERVAL_MS)
    const onVisible = () => {
      if (document.visibilityState === 'visible') void pull()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      cancelled = true
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])
}

/** Mount only for a signed-in user so the status check never runs anonymously. */
export function GoogleAutoSync() {
  useGoogleAutoSync()
  return null
}
