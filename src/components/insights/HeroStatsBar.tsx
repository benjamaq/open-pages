'use client'

import { useEffect, useMemo, useState } from 'react'

type InsightsSummary = {
  monthlySpend: number
  yearlySpend: number
  activeSuppCount: number
  testedSuppCount: number
}

export function HeroStatsBar() {
  const [data, setData] = useState<InsightsSummary | null>(null)
  const [supps, setSupps] = useState<any[] | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch('/api/insights', { cache: 'no-store', credentials: 'include' })
        const json = await res.json()
        if (mounted) setData(json)
      } catch {
        if (mounted) setData({ monthlySpend: 0, yearlySpend: 0, activeSuppCount: 0, testedSuppCount: 0 })
      }
      try {
        const r2 = await fetch('/api/supplements', { cache: 'no-store', credentials: 'include' })
        const j2 = await r2.json()
        if (mounted) setSupps(Array.isArray(j2) ? j2 : [])
      } catch {
        if (mounted) setSupps([])
      }
    })()
    return () => { mounted = false }
  }, [])

  // Fallback from /api/supplements if /api/insights is empty
  const fallbackMonthly = (supps || []).reduce((sum, s) => {
    const raw = Number(s?.monthly_cost_usd)
    const v = Number.isFinite(raw) ? Math.max(0, Math.min(80, raw)) : 0
    return sum + v
  }, 0)
  const monthly = Number(data?.monthlySpend || 0) || fallbackMonthly
  const active = Number(data?.activeSuppCount || 0) || (supps ? supps.length : 0)
  const yearly = Number(data?.yearlySpend || 0) || Math.round(monthly * 12)
  const tested = Number(data?.testedSuppCount || 0)

  // Basic placeholder Stack Score until full signals + check-in metrics wired
  const stackScore = useMemo(() => {
    const consistency = Math.min(100, active > 0 ? 70 : 30)
    const dataQuality = 70
    const daysTracked = 60
    return Math.round((consistency + dataQuality + daysTracked) / 3)
  }, [active])

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
      <StatCard label="Monthly" value={`$${monthly.toFixed(2)}`} />
      <StatCard label="Yearly" value={`$${yearly.toLocaleString()}`} />
      <StatCard label="Active" value={`${active} supps`} />
      <StatCard label="Tested" value={`${tested} supps`} />
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-slate-600">Stack Score</div>
          <div className="text-sm font-semibold text-slate-900">{stackScore}/100</div>
        </div>
        <div className="mt-2 h-2 rounded-full bg-slate-100 overflow-hidden">
          <div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${stackScore}%` }} />
        </div>
      </div>
    </section>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="text-sm font-medium text-slate-600">{label}</div>
      <div className="mt-1 text-xl font-semibold text-slate-900">{value}</div>
    </div>
  )
}


