'use client'

import { useEffect, useState } from 'react'

type Economics = {
  totalMonthlySpend: number
  verifiedSpend: number
  wastedSpend: number
  potentialAnnualSavings: number
  counts: { working: number; notWorking: number; total: number }
}

function formatCurrency(n: number) {
  const v = Math.round(n)
  return `$${v.toLocaleString()}`
}

export function EconomicsSummary() {
  const [data, setData] = useState<Economics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/insights/economics', { cache: 'no-store' })
        if (!mounted) return
        if (res.ok) {
          const json = await res.json()
          setData(json)
        } else {
          setData(null)
        }
      } catch {
        setData(null)
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  if (loading) return null
  if (!data) return null

  const { totalMonthlySpend, verifiedSpend, wastedSpend, potentialAnnualSavings, counts } = data

  return (
    <section className="space-y-3">
      <div className="text-sm font-semibold text-slate-900">Stack Economics</div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs font-semibold uppercase text-slate-500">Monthly Spend</div>
          <div className="mt-1 text-2xl font-bold text-slate-900">{formatCurrency(totalMonthlySpend)}/month</div>
          <div className="mt-1 text-sm text-slate-600">{counts.total} supplements</div>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="text-xs font-semibold uppercase text-emerald-700">Worth It</div>
          <div className="mt-1 text-2xl font-bold text-emerald-900">{formatCurrency(verifiedSpend)}/month</div>
          <div className="mt-1 text-sm text-emerald-800">{counts.working} supplements with clear benefit</div>
        </div>
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4">
          <div className="text-xs font-semibold uppercase text-amber-700">No Effect Detected</div>
          <div className="mt-1 text-2xl font-bold text-amber-900">{formatCurrency(wastedSpend)}/month</div>
          <div className="mt-1 text-sm text-amber-800">{formatCurrency(potentialAnnualSavings)}/year potential savings</div>
        </div>
      </div>
      {potentialAnnualSavings > 100 && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          💰 You could save {formatCurrency(potentialAnnualSavings)}/year by dropping the {counts.notWorking} supplements showing no detectable effect.
        </div>
      )}
    </section>
  )
}


