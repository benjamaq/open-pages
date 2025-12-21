'use client'

import { useEffect, useMemo, useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

type ChartDatum = { name: string; value: number; color: string }

const purposeColors: Record<string, string> = {
  Sleep: '#6366f1',        // indigo
  Energy: '#f59e0b',       // amber
  Mood: '#10b981',         // green
  Stress: '#8b5cf6',       // purple
  Immunity: '#3b82f6',     // blue
  Athletic: '#ef4444',     // red
  Cognitive: '#ec4899',    // pink
  Inflammation: '#14b8a6', // teal
  Other: '#9ca3af'         // gray
}

function normalizeTag(tag: string): string {
  const t = (tag || '').toLowerCase()
  if (t.includes('sleep')) return 'Sleep'
  if (t.includes('energy') || t.includes('stamina')) return 'Energy'
  if (t.includes('stress')) return 'Stress'
  if (t.includes('mood')) return 'Mood'
  if (t.includes('immunity')) return 'Immunity'
  if (t.includes('athletic') || t.includes('performance')) return 'Athletic'
  if (t.includes('cognitive') || t.includes('focus')) return 'Cognitive'
  if (t.includes('inflammation')) return 'Inflammation'
  return 'Other'
}

export function SpendByGoalDonut() {
  const [supps, setSupps] = useState<any[]>([])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch('/api/supplements', { cache: 'no-store', credentials: 'include' })
        const json = await res.json()
        if (mounted) setSupps(Array.isArray(json) ? json : [])
      } catch {
        if (mounted) setSupps([])
      }
    })()
    return () => { mounted = false }
  }, [])

  const { chartData, total } = useMemo(() => {
    const spendingByPurpose: Record<string, number> = {}
    for (const s of (supps || [])) {
      const monthlyRaw = Number(s?.monthly_cost_usd)
      const monthly = Number.isFinite(monthlyRaw) ? Math.max(0, Math.min(80, monthlyRaw)) : 0
      const tags: string[] = Array.isArray(s?.primary_goal_tags) && s.primary_goal_tags.length > 0
        ? s.primary_goal_tags
        : ['Other']
      const normalized = Array.from(new Set(tags.map(normalizeTag)))
      const share = normalized.length > 0 ? monthly / normalized.length : monthly
      for (const p of normalized) {
        spendingByPurpose[p] = (spendingByPurpose[p] || 0) + share
      }
    }
    const total = Object.values(spendingByPurpose).reduce((a, b) => a + b, 0)
    const chartData: ChartDatum[] = Object.entries(spendingByPurpose)
      .map(([name, value]) => ({
        name,
        value,
        color: purposeColors[name] || purposeColors.Other
      }))
      .sort((a, b) => b.value - a.value)
    return { chartData, total }
  }, [supps])

  const percent = (v: number) => {
    const t = total || 1
    return Math.round((v / t) * 100)
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="font-semibold text-slate-900 mb-1">💰 WHERE YOUR MONEY GOES</div>
      <div className="text-sm text-slate-600 mb-6">Your monthly spend, grouped by goal</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        <div className="w-full h-56">
          {chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-sm text-slate-500">
              Add supplements to see spending breakdown.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={95}
                  stroke="none"
                >
                  {chartData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
        <div>
          <div className="mb-3">
            <div className="text-lg font-semibold text-slate-900">${total.toFixed(2)}</div>
            <div className="text-xs text-slate-500">/month</div>
          </div>
          <div className="space-y-2">
            {chartData.map((c) => (
              <div key={c.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                  <span>{c.name}</span>
                </div>
                <div className="text-slate-700">
                  ${c.value.toFixed(2)} • {percent(c.value)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}


