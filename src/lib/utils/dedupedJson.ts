type CacheEntry<T> = { ts: number; value: { ok: boolean; status: number; data: T | null } }

const inFlight = new Map<string, Promise<{ ok: boolean; status: number; data: any | null }>>()
const cache = new Map<string, CacheEntry<any>>()

function makeKey(url: string, init?: RequestInit) {
  const method = String(init?.method || 'GET').toUpperCase()
  const creds = init?.credentials ? String(init.credentials) : 'default'
  const cacheMode = init?.cache ? String(init.cache) : 'default'
  const headersKey = (() => {
    try {
      const h = init?.headers as any
      if (!h) return 'none'
      if (typeof Headers !== 'undefined' && h instanceof Headers) {
        return Array.from(h.entries()).sort(([a],[b]) => a.localeCompare(b)).map(([k,v]) => `${k}:${v}`).join('|')
      }
      if (Array.isArray(h)) {
        return h.slice().sort(([a],[b]) => String(a).localeCompare(String(b))).map(([k,v]) => `${k}:${v}`).join('|')
      }
      if (typeof h === 'object') {
        return Object.entries(h).sort(([a],[b]) => a.localeCompare(b)).map(([k,v]) => `${k}:${String(v)}`).join('|')
      }
      return String(h)
    } catch {
      return 'unknown'
    }
  })()
  return `${method} ${url} :: credentials=${creds} :: cache=${cacheMode} :: headers=${headersKey}`
}

/**
 * Client-side fetch dedupe helper.
 * - Dedupes in-flight requests across components.
 * - Short TTL cache (default 5s) to avoid back-to-back duplicate loads during mount/re-render.
 *
 * NOTE: This intentionally returns parsed JSON (not Response) so multiple consumers can share one request.
 */
export async function dedupedJson<T = any>(
  url: string,
  init?: RequestInit,
  ttlMs: number = 5000
): Promise<{ ok: boolean; status: number; data: T | null }> {
  const key = makeKey(url, init)
  const now = Date.now()

  const cached = cache.get(key)
  if (cached && now - cached.ts < ttlMs) return cached.value as any

  const existing = inFlight.get(key)
  if (existing) return existing as any

  const p = (async () => {
    try {
      const res = await fetch(url, init)
      const data = await res.json().catch(() => null)
      const value = { ok: res.ok, status: res.status, data }
      cache.set(key, { ts: Date.now(), value })
      return value
    } catch {
      const value = { ok: false, status: 0, data: null }
      cache.set(key, { ts: Date.now(), value })
      return value
    } finally {
      inFlight.delete(key)
    }
  })()

  inFlight.set(key, p)
  return p as any
}
