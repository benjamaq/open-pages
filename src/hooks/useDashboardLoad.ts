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

  useEffect(() => {
    // Guard against double effects / remount churn. (If the component remounts, dedupedJson also prevents a second network call.)
    if (hasFetched.current) return
    hasFetched.current = true

    let cancelled = false
    ;(async () => {
      try {
        const r = await dedupedJson<DashboardLoadData>(
          '/api/dashboard/load',
          { credentials: 'include', cache: 'no-store' },
          30000
        )
        if (!r.ok) throw new Error('Dashboard load failed')
        const j = (r.data || null) as DashboardLoadData | null
        if (!j) throw new Error('Dashboard load failed')
        if (cancelled) return
        setData(j)
        setLoading(false)
      } catch (e: any) {
        if (cancelled) return
        setError(e?.message || 'Dashboard load failed')
        setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  return { data, loading, error }
}


