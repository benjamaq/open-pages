'use client'

import { useEffect, useMemo, useState } from 'react'
import { ResponsiveContainer, AreaChart, Area } from 'recharts'

type SeriesPoint = { day: number; value: number }
type TrendsResponse = {
  mood: SeriesPoint[]
  energy: SeriesPoint[]
  focus: SeriesPoint[]
  sleep: SeriesPoint[]
}

function calcChange(values: number[]): { change: number; status: 'improving' | 'stable' | 'declining' } {
  if (!values || values.length < 7) return { change: 0, status: 'stable' }
  const firstWeek = values.slice(0, 7)
  const secondWeek = values.slice(-7)
  const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0)
  const a = avg(firstWeek)
  const b = avg(secondWeek)
  if (a === 0) return { change: 0, status: 'stable' }
  const pct = Math.round(((b - a) / a) * 100)
  let status: 'improving' | 'stable' | 'declining' = 'stable'
  if (pct > 5) status = 'improving'
  if (pct < -5) status = 'declining'
  return { change: pct, status }
}

function TrendRow({ metric, series = [] as SeriesPoint[] }: { metric: string; series?: SeriesPoint[] }) {
  const values = (series ?? []).map(p => p.value)
  const { change, status } = calcChange(values)
  const statusColor: Record<string, string> = {
    improving: 'text-green-600',
    stable: 'text-gray-500',
    declining: 'text-red-600'
  }
  const statusIcon: Record<string, string> = {
    improving: '↑',
    stable: '→',
    declining: '↓'
  }
  return (
    <div className="flex items-center justify-between py-3 border-b last:border-0">
      <span className="font-medium w-20">{metric}</span>
      <div className="flex-1 h-8 mx-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={series ?? []}>
            <Area type="monotone" dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className={`flex items-center gap-2 w-32 justify-end ${statusColor[status]}`}>
        <span className="font-medium">{statusIcon[status]} {Math.abs(change)}%</span>
        <span className="text-sm capitalize">{status}</span>
      </div>
    </div>
  )
}

export function TrendsSection() {
  const [data, setData] = useState<TrendsResponse | null>(null)
  const isEmpty = useMemo(() => {
    if (!data) return true
    return ['mood', 'energy', 'focus', 'sleep'].every(k => (data as any)[k]?.length === 0)
  }, [data])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch('/api/insights/trends', { cache: 'no-store', credentials: 'include' })
        const json = await res.json()
        if (mounted) setData(json)
      } catch {
        if (mounted) setData(null)
      }
    })()
    return () => { mounted = false }
  }, [])

  if (!data || isEmpty) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between mb-2">
          <div className="font-semibold text-slate-900">📈 YOUR TRENDS</div>
          <div className="text-xs text-slate-500">Last 14 days</div>
        </div>
        <div className="text-center py-8 text-gray-500">
          <p>Complete 3+ check-ins to see your trends</p>
        </div>
      </section>
    )
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex items-center justify-between mb-2">
        <div className="font-semibold text-slate-900">📈 YOUR TRENDS</div>
        <div className="text-xs text-slate-500">Last 14 days</div>
      </div>
      <div>
        <TrendRow metric="Mood" series={data.mood} />
        <TrendRow metric="Energy" series={data.energy} />
        <TrendRow metric="Focus" series={data.focus} />
        <TrendRow metric="Sleep" series={data.sleep} />
      </div>
      <div className="text-xs text-slate-500 mt-3">* Sleep data from WHOOP (if connected)</div>
    </section>
  )
}


