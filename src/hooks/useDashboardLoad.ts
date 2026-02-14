'use client'

import { useEffect, useState } from 'react'

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

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const r = await fetch('/api/dashboard/load', { credentials: 'include', cache: 'no-store' })
        if (!r.ok) throw new Error('Dashboard load failed')
        const j = (await r.json()) as DashboardLoadData
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


