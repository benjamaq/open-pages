'use client'

import { useEffect, useMemo, useState } from 'react'

type Supp = { name: string; monthly_cost_usd?: number; is_active?: boolean; primary_goal_tags?: string[] }

export function SpendOverview() {
  const [supps, setSupps] = useState<Supp[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch('/api/supplements', { cache: 'no-store' })
        if (!res.ok) throw new Error(await res.text())
        const data = await res.json()
        if (mounted) setSupps(data || [])
      } catch (e: any) {
        if (mounted) setError(e?.message || 'Failed to load')
      }
    })()
    return () => { mounted = false }
  }, [])

  const monthly = useMemo(() => {
    const calcMonthly = (s: any) => {
      const raw = Number(s.monthly_cost_usd)
      if (Number.isFinite(raw) && raw >= 0 && raw <= 80) return raw
      const price = Number(s.price_per_container)
      const servings = Number(s.servings_per_container)
      const dose = Number(s.daily_dose_amount) || 1
      const daysPerWeek = Number(s.days_per_week) || 7
      if (price > 0 && servings > 0) {
        const costPerServing = price / servings
        const dosesPerMonth = Math.round((daysPerWeek / 7) * 30 * Math.max(1, dose))
        const val = costPerServing * dosesPerMonth
        return Math.min(80, Math.max(0, Number.isFinite(val) ? val : 0))
      }
      return 0
    }
    return (supps || []).reduce((sum, s) => sum + calcMonthly(s), 0)
  }, [supps])
  const yearly = useMemo(() => monthly * 12, [monthly])
  const activeCount = useMemo(() => (supps || []).filter(s => s.is_active !== false).length, [supps])

  const spendByGoal = useMemo(() => {
    // Use sanitized monthly per item and split equally across tags
    const calcMonthly = (s: any) => {
      const raw = Number(s.monthly_cost_usd)
      if (Number.isFinite(raw) && raw >= 0 && raw <= 80) return raw
      const price = Number(s.price_per_container)
      const servings = Number(s.servings_per_container)
      const dose = Number(s.daily_dose_amount) || 1
      const daysPerWeek = Number(s.days_per_week) || 7
      if (price > 0 && servings > 0) {
        const costPerServing = price / servings
        const dosesPerMonth = Math.round((daysPerWeek / 7) * 30 * Math.max(1, dose))
        const val = costPerServing * dosesPerMonth
        return Math.min(80, Math.max(0, Number.isFinite(val) ? val : 0))
      }
      return 0
    }
    const acc: Record<string, number> = {}
    for (const s of (supps || [])) {
      const tags = Array.isArray(s.primary_goal_tags) && s.primary_goal_tags.length > 0 ? s.primary_goal_tags : ['other']
      const perItemMonthly = calcMonthly(s)
      const share = tags.length > 0 ? perItemMonthly / tags.length : perItemMonthly
      for (const t of tags) acc[t] = (acc[t] || 0) + share
    }
    return Object.entries(acc).sort((a,b) => b[1] - a[1])
  }, [supps])

  if (error) {
    return <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>
  }
  if (!supps) {
    return <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">Loading…</div>
  }

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="text-sm font-semibold text-slate-900 mb-3">Your Supplement Life</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Stat label="Monthly" value={`$${monthly.toFixed(2)}`} />
          <Stat label="Yearly" value={`$${yearly.toFixed(0)}`} />
          <Stat label="Active" value={String(activeCount)} />
          <Stat label="Total" value={String((supps || []).length)} />
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="text-sm font-semibold text-slate-900 mb-3">Where Your Money Goes</div>
        <div className="space-y-2">
          {spendByGoal.length === 0 ? (
            <div className="text-sm text-slate-600">Add supplements to see category breakdown.</div>
          ) : spendByGoal.map(([goal, amt]) => (
            <div key={goal}>
              <div className="flex items-center justify-between text-sm">
                <span className="capitalize text-slate-700">{goal.replace('_',' ')}</span>
                <span className="font-medium text-slate-900">${amt.toFixed(2)}</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500" style={{ width: `${Math.min(100, (amt / Math.max(1, monthly)) * 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="text-sm font-semibold text-slate-900 mb-3">Most Expensive</div>
        {supps.length === 0 ? (
          <div className="text-sm text-slate-600">No data yet.</div>
        ) : (
          <ul className="text-sm text-slate-800 space-y-1">
            {[...supps].sort((a,b) => {
              const calc = (x: any) => {
                const raw = Number(x.monthly_cost_usd)
                if (Number.isFinite(raw) && raw >= 0 && raw <= 80) return raw
                const price = Number(x.price_per_container)
                const serv = Number(x.servings_per_container)
                const dose = Number(x.daily_dose_amount) || 1
                const d = Number(x.days_per_week) || 7
                if (price > 0 && serv > 0) return Math.min(80, (price / serv) * Math.round((d/7)*30*Math.max(1, dose)))
                return 0
              }
              return calc(b) - calc(a)
            }).slice(0,5).map((s, i) => {
              const calc = (x: any) => {
                const raw = Number(x.monthly_cost_usd)
                if (Number.isFinite(raw) && raw >= 0 && raw <= 80) return raw
                const price = Number(x.price_per_container)
                const serv = Number(x.servings_per_container)
                const dose = Number(x.daily_dose_amount) || 1
                const d = Number(x.days_per_week) || 7
                if (price > 0 && serv > 0) return Math.min(80, (price / serv) * Math.round((d/7)*30*Math.max(1, dose)))
                return 0
              }
              const m = calc(s)
              return (
                <li key={`${s.name}-${i}`} className="flex items-center justify-between">
                  <span className="truncate mr-3">{s.name}</span>
                  <span className="font-medium">${m.toFixed(2)}/mo</span>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div className="text-lg font-semibold text-slate-900">{value}</div>
    </div>
  )
}


