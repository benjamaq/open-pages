'use client'

import { useEffect, useMemo, useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

type Supplement = {
  id: string
  name: string
  monthly_cost_usd?: number | null
  primary_goal_tags?: string[] | null
}

const GOAL_COLORS: Record<string, string> = {
  sleep: '#3b82f6',      // blue
  energy: '#f59e0b',     // amber
  stress: '#f97316',     // orange
  immunity: '#ef4444',   // red
  longevity: '#8b5cf6',  // purple
  cognitive: '#ec4899',  // pink
  other: '#64748b',      // slate
}

function normalizeTag(tag: string): string {
  const t = tag.toLowerCase()
  if (t.includes('sleep')) return 'sleep'
  if (t.includes('energy') || t.includes('stamina')) return 'energy'
  if (t.includes('focus') || t.includes('cognitive') || t.includes('memory')) return 'cognitive'
  if (t.includes('longevity') || t.includes('aging')) return 'longevity'
  if (t.includes('stress')) return 'stress'
  if (t.includes('immune') || t.includes('immunity')) return 'immunity'
  return 'other'
}

export function StackCostCard() {
  const [items, setItems] = useState<Supplement[]>([])
  const [effects, setEffects] = useState<Record<string, any>>({})

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const r = await fetch('/api/supplements', { cache: 'no-store' })
        if (!mounted) return
        if (r.ok) {
          const json = await r.json()
          setItems(Array.isArray(json) ? json : [])
        }
      } catch {}
      try {
        const e = await fetch('/api/effect/summary', { cache: 'no-store' })
        if (!mounted) return
        if (e.ok) {
          const j = await e.json()
          setEffects(j?.effects || {})
        }
      } catch {}
    })()
    return () => { mounted = false }
  }, [])

  const { yearlyTotal, counts, donutData, breakdown } = useMemo(() => {
    const byGoal: Record<string, number> = {}
    let monthly = 0
    let count = 0
    for (const s of items) {
      const cost = Math.max(0, Math.min(80, Number(s.monthly_cost_usd ?? 0)))
      if (cost > 0) {
        monthly += cost
      }
      count += 1
      const tags = (s.primary_goal_tags && s.primary_goal_tags.length > 0 ? s.primary_goal_tags : ['other'])
      // Split cost evenly across tags
      const perTag = cost / Math.max(1, tags.length)
      for (const raw of tags) {
        const key = normalizeTag(String(raw))
        byGoal[key] = (byGoal[key] || 0) + perTag
      }
    }
    const donut = Object.entries(byGoal)
      .map(([name, value]) => ({ name, value: Math.round(value), color: GOAL_COLORS[name] || GOAL_COLORS.other }))
      .sort((a, b) => b.value - a.value)
    const breakdownList = donut.map(d => ({
      name: d.name,
      yearly: d.value * 12,
      percent: monthly > 0 ? Math.round(((d.value) / monthly) * 100) : 0
    }))
    return {
      yearlyTotal: Math.round(monthly * 12),
      counts: count,
      donutData: donut,
      breakdown: breakdownList
    }
  }, [items])

  const effectSpend = useMemo(() => {
    let effMonthly = 0
    let wasteMonthly = 0
    let testMonthly = 0
    for (const s of items) {
      const m = Math.max(0, Math.min(80, Number(s?.monthly_cost_usd ?? 0)))
      const eff = (effects as any)[s.id]
      const cat = eff?.effect_category as string | undefined
      if (cat === 'works') {
        effMonthly += m
      } else if (cat === 'no_effect') {
        wasteMonthly += m
      } else {
        // needs_more_data, inconsistent, building, or no record
        testMonthly += m
      }
    }
    return {
      effYear: Math.round(effMonthly * 12),
      wasteYear: Math.round(wasteMonthly * 12),
      testYear: Math.round(testMonthly * 12),
    }
  }, [items, effects])

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        <div className="md:col-span-1 flex items-center justify-center">
          <div className="w-full h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={donutData.length > 0 ? donutData : [{ name: 'other', value: 1, color: '#e5e7eb' }]} dataKey="value" innerRadius={50} outerRadius={70} paddingAngle={2}>
                  {(donutData.length > 0 ? donutData : [{ color: '#e5e7eb' }]).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={(entry as any).color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-[-120px] flex items-center justify-center">
            <div className="text-center">
              <div className="text-xl font-bold text-gray-900">${yearlyTotal}/year</div>
              <div className="text-xs text-gray-500">{counts} supplements</div>
            </div>
          </div>
        </div>
        <div className="md:col-span-2">
          <div className="text-sm text-gray-700 font-medium mb-2">${yearlyTotal}/year • {counts} supplements</div>
          <div className="text-xs text-gray-500 mb-2">Based on your supplement test results</div>
          <div className="flex flex-col gap-2">
            {breakdown.slice(0, 6).map((b) => (
              <div key={b.name} className="text-sm flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: GOAL_COLORS[b.name] || GOAL_COLORS.other }} />
                  <span className="capitalize text-gray-700">{b.name}</span>
                </div>
                <div className="text-gray-900 font-medium">${b.yearly}/year <span className="text-gray-500">({b.percent}%)</span></div>
              </div>
            ))}
          </div>
          <div className="mt-3 text-sm text-gray-700">
            <span className="text-emerald-700 font-medium">${effectSpend.effYear.toLocaleString()}</span> effective
            {' • '}
            <span className="text-gray-700 font-medium">${effectSpend.wasteYear.toLocaleString()}</span> wasted
            {' • '}
            <span className="text-blue-700 font-medium">${effectSpend.testYear.toLocaleString()}</span> still testing
          </div>
          <div className="mt-4">
            <a href="/results" className="text-sm font-medium text-blue-600 hover:text-blue-700">See what&apos;s actually working →</a>
          </div>
        </div>
      </div>
    </section>
  )
}


