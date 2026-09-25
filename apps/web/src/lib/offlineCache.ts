const PREFIX = 'bosla.read-cache.v1:'
const USER_KEY = 'bosla.cached-user.v1'

type CacheEntry<T> = { savedAt: number; value: T }

function currentUserId(): string | null {
  try {
    const user = JSON.parse(window.localStorage.getItem(USER_KEY) ?? 'null') as { id?: unknown } | null
    return typeof user?.id === 'string' ? user.id : null
  } catch {
    return null
  }
}

function key(path: string): string | null {
  const id = currentUserId()
  return id ? `${PREFIX}${id}:${path}` : null
}

/** Session-scoped, account-isolated cache. Private responses are never stored across browser sessions. */
export function readCached<T>(path: string): CacheEntry<T> | null {
  const cacheKey = key(path)
  if (!cacheKey) return null
  try {
    const entry = JSON.parse(window.sessionStorage.getItem(cacheKey) ?? 'null') as CacheEntry<T> | null
    return entry && typeof entry.savedAt === 'number' && 'value' in entry ? entry : null
  } catch {
    return null
  }
}

export function saveCached<T>(path: string, value: T): void {
  const cacheKey = key(path)
  if (!cacheKey) return
  try {
    window.sessionStorage.setItem(cacheKey, JSON.stringify({ savedAt: Date.now(), value }))
  } catch {
    // Private browsing and full storage must not break a live API response.
  }
}

export function clearCached(): void {
  try {
    for (let index = window.sessionStorage.length - 1; index >= 0; index--) {
      const cacheKey = window.sessionStorage.key(index)
      if (cacheKey?.startsWith(PREFIX)) window.sessionStorage.removeItem(cacheKey)
    }
  } catch {
    // Best effort when storage is unavailable.
  }
}

export const OFFLINE_DATA_EVENT = 'bosla:offline-data'
let connectionInterrupted = false

export function wasConnectionInterrupted(): boolean {
  return connectionInterrupted
}

export function notifyOfflineData(savedAt?: number): void {
  connectionInterrupted = true
  window.dispatchEvent(new CustomEvent(OFFLINE_DATA_EVENT, { detail: { savedAt } }))
}
