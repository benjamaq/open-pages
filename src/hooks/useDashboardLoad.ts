'use client'

import { useEffect, useRef, useState } from 'react'
import { dedupedJson } from '@/lib/utils/dedupedJson'

export type DashboardLoadData = {
  me: any
  billingInfo: any
  paymentsStatus: any
  supplements: any
  progressLoop: any
  hasDaily: any
  dailySkip: any
  effectSummary: any
  wearableStatus: any
  settings: any
  elliContext: any
}

export function useDashboardLoad() {
  const [data, setData] = useState<DashboardLoadData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const hasFetched = useRef(false)
  const inFlight = useRef(false)

  const fetchDashboard = async (opts?: { silent?: boolean; bypassCache?: boolean }) => {
    if (inFlight.current) return
    inFlight.current = true
    const silent = Boolean(opts?.silent)
    const bypassCache = Boolean(opts?.bypassCache)
    try {
      if (!silent) setLoading(true)
      setError(null)
      // Allow production-safe debug by forwarding ONLY known debug params from the current dashboard URL.
      // This keeps logs off by default and avoids accidentally changing semantics via unrelated query params.
      const url = (() => {
        try {
          if (typeof window === 'undefined') return '/api/dashboard/load'
          const sp = new URLSearchParams(window.location.search || '')
          const pass = new URLSearchParams()
          for (const k of ['debugSuppId', 'dbg', 'supp', 'nocache', 'force']) {
            const v = sp.get(k)
            if (v) pass.set(k, v)
          }
          // After actions like retest/stop-testing we must bypass the client TTL cache (Issue 3).
          if (bypassCache) pass.set('__bust', String(Date.now()))
          const qs = pass.toString()
          return qs ? `/api/dashboard/load?${qs}` : '/api/dashboard/load'
        } catch {
          return '/api/dashboard/load'
        }
      })()
      const r = await dedupedJson<DashboardLoadData>(
        url,
        { credentials: 'include', cache: 'no-store' },
        bypassCache ? 0 : 30000
      )
      if (!r.ok) throw new Error('Dashboard load failed')
      const j = (r.data || null) as DashboardLoadData | null
      if (!j) throw new Error('Dashboard load failed')
      setData(j)
      setLoading(false)
    } catch (e: any) {
      // On background refresh, keep existing data and avoid spamming errors.
      if (!silent) setError(e?.message || 'Dashboard load failed')
      setLoading(false)
    } finally {
      inFlight.current = false
    }
  }

  useEffect(() => {
    // Guard against double effects / remount churn. (If the component remounts, dedupedJson also prevents a second network call.)
    if (hasFetched.current) return
    hasFetched.current = true

    ;(async () => {
      await fetchDashboard({ silent: false })
    })()
    return () => {}
  }, [])

  // Allow dashboard to refresh after actions like "Retest" or "Stop testing" without a full reload.
  useEffect(() => {
    const handler = () => {
      try {
        // Background refresh; keep UI stable.
        fetchDashboard({ silent: true, bypassCache: true })
      } catch {}
    }
    try {
      window.addEventListener('progress:refresh', handler as any)
      window.addEventListener('dashboard:refresh', handler as any)
    } catch {}
    return () => {
      try {
        window.removeEventListener('progress:refresh', handler as any)
        window.removeEventListener('dashboard:refresh', handler as any)
      } catch {}
    }
  }, [])

  return { data, loading, error }
}


