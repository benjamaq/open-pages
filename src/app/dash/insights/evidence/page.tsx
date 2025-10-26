'use client'

import { useEffect, useState } from 'react'

export default function EvidencePage() {
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const insightKey = params.get('insightKey')
    if (!insightKey) {
      setError('Missing insightKey')
      return
    }
    ;(async () => {
      try {
        const res = await fetch(`/api/insights/evidence?insightKey=${encodeURIComponent(insightKey)}`, { cache: 'no-store' })
        const json = await res.json()
        if (!res.ok) throw new Error(json?.error || 'Failed to load evidence')
        setData(json)
      } catch (e: any) {
        setError(e?.message || 'Error')
      }
    })()
  }, [])

  if (error) return <div className="p-6">Error: {error}</div>
  if (!data) return <div className="p-6">Loading…</div>

  const ctx = data?.context || {}
  const metrics = ctx?.result || ctx?.metrics || {}

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-xl font-semibold">Evidence</h1>
      <div className="text-sm text-gray-600">Insight: {data.insightKey}</div>
      <div className="border rounded-lg p-4">
        <div className="text-sm">Cohen's d: {Number(metrics?.cohensD || metrics?.effectSize || 0).toFixed?.(2) || '-'}</div>
        <div className="text-sm">Delta: {Number(metrics?.delta || metrics?.sameDayDelta || metrics?.nextDayDelta || 0).toFixed?.(2) || '-'}</div>
        {metrics?.ciLow != null && metrics?.ciHigh != null ? (
          <div className="text-sm">95% CI: {Number(metrics.ciLow).toFixed?.(2)} to {Number(metrics.ciHigh).toFixed?.(2)}</div>
        ) : null}
      </div>
    </div>
  )
}


