'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowRight } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

type Segment = { label: string; colorHex?: string; amount: number; percent: number }

export function StackEconomicsCard({
  totalYearly = 623,
  totalSupps = 6,
  segments = [
    { label: "Sleep", colorHex: "#3b82f6", amount: 48, percent: 8 },
    { label: "Stress", colorHex: "#f59e0b", amount: 48, percent: 8 },
    { label: "Immunity", colorHex: "#10b981", amount: 0, percent: 0 },
    { label: "Other", colorHex: "#8b5cf6", amount: 528, percent: 85 },
  ],
}: {
  totalYearly?: number;
  totalSupps?: number;
  segments?: Array<Segment>;
}) {
  const chartData = segments.map(s => ({ name: s.label, value: Math.max(0, s.amount), color: s.colorHex || '#94a3b8' }))
  const [supps, setSupps] = useState<Array<{ id: string, monthly_cost_usd?: number | null }>>([])
  const [effects, setEffects] = useState<Record<string, any>>({})

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const r = await fetch('/api/supplements', { cache: 'no-store' })
        if (!mounted) return
        if (r.ok) {
          const j = await r.json()
          setSupps(Array.isArray(j) ? j : [])
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

  const effectSpend = useMemo(() => {
    let effMonthly = 0
    let wasteMonthly = 0
    let testMonthly = 0
    for (const s of supps) {
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
  }, [supps, effects])
  return (
    <div className="w-full rounded-xl border bg-white p-6 shadow-sm">
      {/* HEADER */}
      <div className="mb-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Stack economics</div>
        <p className="mt-1 text-sm text-gray-600">
          ${totalYearly}/year • {totalSupps} supplements
        </p>
        <p className="text-xs text-gray-500">Based on your supplement test results</p>
      </div>

      <div className="border-t mt-4 pt-4" />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* DONUT CHART */}
        <div className="relative flex items-center justify-center">
          <div className="h-44 w-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData} dataKey="value" innerRadius={48} outerRadius={76} paddingAngle={2}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={(entry as any).color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="absolute text-center">
            <p className="text-lg font-semibold">${totalYearly}/yr</p>
            <p className="text-xs text-gray-600">{totalSupps} supplements</p>
          </div>
        </div>

        {/* LEGEND + BREAKDOWN */}
        <div className="flex flex-col justify-center">
          <div className="grid grid-cols-2 gap-x-6 gap-y-2">
            {segments.map((s) => (
              <div key={s.label} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: s.colorHex || '#94a3b8' }} />
                  <span className="font-medium text-gray-800">{s.label}</span>
                </div>
                <span className="text-gray-600">
                  ${s.amount}/yr ({s.percent}%)
                </span>
              </div>
            ))}
          </div>

          <div className="mt-3 text-sm text-gray-700">
            <span className="text-emerald-700 font-medium">${effectSpend.effYear.toLocaleString()}</span> effective
            {' • '}
            <span className="text-gray-700 font-medium">${effectSpend.wasteYear.toLocaleString()}</span> wasted
            {' • '
            }<span className="text-blue-700 font-medium">${effectSpend.testYear.toLocaleString()}</span> still testing
          </div>

          <a
            href="/results"
            className="mt-4 inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            See what’s actually working
            <ArrowRight className="ml-1 h-4 w-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
 

