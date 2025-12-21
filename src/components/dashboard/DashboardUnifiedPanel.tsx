'use client'

import { useEffect, useMemo, useState } from 'react'
import { Progress } from '@/components/ui/progress'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { abbreviateSupplementName } from '@/lib/utils/abbreviate'

type Suggestion = { id: string; name: string }
type Row = { id: string; name: string; daysOfData: number; requiredDays: number }

export function DashboardUnifiedPanel() {
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null)
  const [progress, setProgress] = useState<any | null>(null)
  const [supps, setSupps] = useState<any[]>([])
  const [suppsLoaded, setSuppsLoaded] = useState(false)
  const [effects, setEffects] = useState<Record<string, any>>({})
  const [hasDaily, setHasDaily] = useState<boolean | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch('/api/suggestions/dailySkip', { cache: 'no-store' })
        if (!mounted) return
        if (res.ok) {
          const j = await res.json()
          setSuggestions(Array.isArray(j?.suggestions) ? j.suggestions : [])
        } else setSuggestions([])
      } catch { setSuggestions([]) }
      try {
        const p = await fetch('/api/progress/loop', { cache: 'no-store' })
        if (!mounted) return
        if (p.ok) setProgress(await p.json())
      } catch { setProgress(null) }
      try {
        const r = await fetch('/api/supplements', { cache: 'no-store' })
        if (!mounted) return
        if (r.ok) setSupps(await r.json())
      } catch { setSupps([]) }
      finally {
        if (mounted) setSuppsLoaded(true)
      }
      try {
        const e = await fetch('/api/effect/summary', { cache: 'no-store' })
        if (!mounted) return
        if (e.ok) {
          const j = await e.json()
          setEffects(j?.effects || {})
        }
      } catch {}
      try {
        const d = await fetch('/api/data/has-daily', { cache: 'no-store' })
        if (!mounted) return
        if (d.ok) {
          const j = await d.json()
          setHasDaily(Boolean(j?.hasData))
        } else {
          setHasDaily(false)
        }
      } catch { setHasDaily(false) }
    })()
    return () => { mounted = false }
  }, [])

  // Derive progress stats
  const {
    progressPercent, streak, readyCount, buildingCount, needsDataCount,
    nextResult, disruptions
  } = useMemo(() => {
    const s = progress?.sections || { clearSignal: [], building: [], noSignal: [] }
    const total = (s.clearSignal?.length || 0) + (s.building?.length || 0) + (s.noSignal?.length || 0) + ((progress?.sections as any)?.inconsistent?.length || 0) + ((progress?.sections as any)?.needsData?.length || 0)
    const rows = [
      ...(s.clearSignal || []),
      ...(s.building || []),
      ...(s.noSignal || []),
      ...(((progress?.sections as any)?.inconsistent) || []),
      ...(((progress?.sections as any)?.needsData) || []),
    ]
    let pct = 0
    if (rows.length > 0) {
      const sum = rows.reduce((acc: number, r: any) => acc + Math.max(0, Math.min(100, Number(r?.progressPercent || 0))), 0)
      pct = Math.round(sum / rows.length)
    }
    const building = s.building || []
    const next = building
      .map((r: any) => ({ r, remaining: Math.max(0, (r.requiredDays || 14) - (r.daysOfData || 0)) }))
      .sort((a: any, b: any) => a.remaining - b.remaining)[0]
    const tagCounts = (progress && progress.checkins && progress.checkins.last7 && progress.checkins.last7.tagCounts) ? progress.checkins.last7.tagCounts : null
    const labelMap: Record<string, string> = {
      alcohol: 'alcohol',
      travel: 'travel / timezone change',
      poor_sleep: 'poor sleep',
      high_stress: 'high stress',
      illness: 'feeling unwell',
      intense_exercise: 'intense exercise',
    }
    const disruptionArr: Array<{ label: string; count: number }> = []
    if (tagCounts) {
      for (const [k, v] of Object.entries(tagCounts as Record<string, number>)) {
        const n = Number(v || 0)
        if (n > 0 && labelMap[k]) disruptionArr.push({ label: labelMap[k], count: n })
      }
    }
    return {
      progressPercent: pct,
      streak: (progress?.checkins?.totalDistinctDays || 0),
      readyCount: (s.clearSignal?.length || 0) + (s.noSignal?.length || 0),
      buildingCount: s.building?.length || 0,
      needsDataCount: (progress?.sections as any)?.needsData?.length || 0,
      nextResult: next ? {
        name: next.r.name,
        remaining: next.remaining,
        clean: next.r.daysOfData,
        req: next.r.requiredDays,
        daysOn: Number((next.r as any).daysOn || 0),
        daysOff: Number((next.r as any).daysOff || 0),
        reqOff: Math.min(5, Math.max(3, Math.round(Number(next.r.requiredDays || 14) / 4))),
      } : null,
      disruptions: disruptionArr
    }
  }, [progress, supps])

  // Economics donut + spend
  const { chartData, totalYearly, effYear, wasteYear, testYear } = useMemo(() => {
    // Build goal segments from supplements costs and tags
    type Acc = Record<string, { amount: number; label: string; color: string }>
    const COLORS_HEX: Record<string, string> = {
      cognitive: '#C65A2E', // burnt clay
      sleep: '#6F7F5A',     // muted olive
      immunity: '#B07A2A',  // burnt amber
      other: '#6A3F2B'      // deep umber
    }
    const acc: Acc = {}
    let monthlyTotal = 0
    for (const s of supps) {
      const cost = Math.max(0, Math.min(80, Number(s.monthly_cost_usd ?? 0)))
      monthlyTotal += cost
      const tags: string[] = Array.isArray(s.primary_goal_tags) && s.primary_goal_tags.length > 0 ? s.primary_goal_tags : ['other']
      const perTag = cost / Math.max(1, tags.length)
      for (const raw of tags) {
        const t = String(raw || '').toLowerCase()
        const key =
          t.includes('sleep') ? 'sleep' :
          (t.includes('energy') || t.includes('stamina')) ? 'energy' :
          (t.includes('focus') || t.includes('cognitive') || t.includes('memory')) ? 'cognitive' :
          (t.includes('longevity') || t.includes('aging')) ? 'longevity' :
          t.includes('stress') ? 'stress' :
          (t.includes('immune') || t.includes('immunity')) ? 'immunity' : 'other'
        if (!acc[key]) acc[key] = { amount: 0, label: key.charAt(0).toUpperCase() + key.slice(1), color: COLORS_HEX[key] || '#8b5cf6' }
        acc[key].amount += perTag
      }
    }
    const yearly = Math.round(monthlyTotal * 12)
    const segments = Object.values(acc)
      .map(a => ({ name: a.label, value: Math.round(a.amount * 12), color: a.color }))
      .sort((a, b) => b.value - a.value)
    // Effective/waste/testing
    let effMonthly = 0, wasteMonthly = 0, testMonthly = 0
    for (const s of supps) {
      const m = Math.max(0, Math.min(80, Number(s?.monthly_cost_usd ?? 0)))
      const eff = (effects as any)[s.id]
      const cat = eff?.effect_category as string | undefined
      if (cat === 'works') effMonthly += m
      else if (cat === 'no_effect') wasteMonthly += m
      else testMonthly += m
    }
    return {
      chartData: segments,
      totalYearly: yearly,
      effYear: Math.round(effMonthly * 12),
      wasteYear: Math.round(wasteMonthly * 12),
      testYear: Math.round(testMonthly * 12),
    }
  }, [supps, effects])

  // While loading, avoid flashing the empty-state card
  if (!suppsLoaded) {
    return (
      <section className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-24 bg-gray-100 rounded" />
          <div className="h-8 w-full bg-gray-100 rounded" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-24 bg-gray-100 rounded" />
            <div className="h-24 bg-gray-100 rounded" />
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="bg-white border border-gray-200 rounded-lg">
      <div className="grid grid-cols-1 md:grid-cols-2">
        {/* TL: Today's Action (original location) */}
        <div className="p-5 border-b border-gray-100 md:border-r">
          <div className="border-2 border-gray-900 rounded-lg p-5 bg-white">
            <div className="text-xs uppercase tracking-wide text-gray-600 mb-4">Today’s action</div>
            {/* Checked-in state */}
            {progress?.checkins?.hasCheckedInToday ? (
              <>
                <div className="flex items-center justify-between text-sm text-gray-800">
                  <span className="flex items-center gap-2">
                    <span className="inline-block h-2 w-2 rounded-full bg-green-600" /> Checked in today
                  </span>
                  <a className="hover:underline" href="/dashboard?checkin=1" style={{ color: '#6A3F2B' }}>Edit</a>
                </div>
                {progress?.checkins?.todaySummary && (
                  <div className="mt-3 text-sm text-gray-700">
                    <span className="mr-4">Mood: <span className="font-medium">{progress.checkins.todaySummary.mood ?? '—'}</span></span>
                    <span className="mr-4">Energy: <span className="font-medium">{progress.checkins.todaySummary.energy ?? '—'}</span></span>
                    <span>Focus: <span className="font-medium">{progress.checkins.todaySummary.focus ?? '—'}</span></span>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-stretch">
                <button
                  onClick={() => { window.location.href = '/dashboard?checkin=1' }}
                  className="w-full inline-flex items-center justify-center rounded-full bg-[#111111] px-6 py-3 text-sm font-medium text-white"
                >
                  Complete Today’s Check‑In →
                </button>
              </div>
            )}
            {/* Rotation instructions from /api/progress/loop */}
            {progress?.rotation && (
              <div className="mt-4 text-sm text-gray-800 space-y-2">
                {progress.rotation.phase === 'baseline' ? (
                  <>
                    <div>{progress.rotation.action?.primary || 'Take your supplements as normal.'}</div>
                    {(progress.rotation.action?.secondary || progress.rotation.action?.note) && (
                      <div className="text-xs text-gray-600">{progress.rotation.action?.secondary || progress.rotation.action?.note}</div>
                    )}
                  </>
                ) : (
                  <>
                    {/* Take count */}
                    <div className="font-medium">
                      Take as normal: {Array.isArray(progress.rotation.action?.take) ? progress.rotation.action.take.length : 0} {Array.isArray(progress.rotation.action?.take) && progress.rotation.action.take.length === 1 ? 'supplement' : 'supplements'}
                    </div>
                    {/* Skip list */}
                    {Array.isArray(progress.rotation.action?.skip) && progress.rotation.action.skip.length > 0 && (
                      <div>
                        <div className="font-medium">Skip today ({progress.rotation.action.skip.length}):</div>
                        <ul className="mt-1 list-disc list-inside">
                          {(() => {
                            const dedup = Array.from(new Map((progress.rotation.action?.skip || []).map((s: any) => [String(s?.id || s?.name), s])).values())
                            return dedup.map((s: any) => (
                            <li key={String(s?.id || s?.name)}>{abbreviateSupplementName(String(s?.name || ''))}</li>
                            ))
                          })()}
                        </ul>
                      </div>
                    )}
                    {/* Reason */}
                    {progress.rotation.action?.reason && (
                      <div className="text-xs text-gray-600">{progress.rotation.action.reason}</div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
        {/* TR: Next Result */}
        <div
          className="p-5 border-b rounded-tr-lg"
          style={{ backgroundColor: '#F6F5F3', borderColor: '#E4E1DC', borderStyle: 'solid', borderWidth: '1px 0 1px 0' }}
        >
          <div className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: '#55514A' }}>Next result likely</div>
          {(() => {
            // Derive richer copy
            if (!nextResult && (progress?.sections?.building?.length || 0) === 0) {
              return <div className="text-sm text-gray-700">All supplements analyzed</div>
            }
            if (!nextResult) {
              return <div className="text-sm text-gray-700">—</div>
            }
            const title = <div className="text-base font-semibold text-gray-900">{abbreviateSupplementName(String(nextResult.name || ''))}</div>
            const remaining = Number(nextResult.remaining || 0)
            if (remaining <= 0) {
              return (
                <div>
                  {title}
                  <div className="mt-1">
                    <div className="text-sm font-medium text-gray-900">Expected tomorrow</div>
                  </div>
                  <div className="mt-2 text-xs text-gray-700 space-y-1">
                    <div>ON days: <span className="font-medium">{Number(nextResult.daysOn || 0)}</span>/<span className="font-medium">{Number(nextResult.req || 0)}</span></div>
                    <div>OFF days: <span className="font-medium">{Number(nextResult.daysOff || 0)}</span>/<span className="font-medium">{Number(nextResult.reqOff || 0)}</span></div>
                  </div>
                </div>
              )
            }
            return (
              <div>
                {title}
                <div className="mt-1">
                  <div className="text-2xl font-extrabold text-gray-900">{`~${remaining}`}</div>
                  <div className="text-sm text-gray-700">clean days remaining</div>
                </div>
                <div className="mt-2 text-xs text-gray-700 space-y-1">
                  <div>ON days: <span className="font-medium">{Number(nextResult.daysOn || 0)}</span>/<span className="font-medium">{Number(nextResult.req || 0)}</span></div>
                  <div>OFF days: <span className="font-medium">{Number(nextResult.daysOff || 0)}</span>/<span className="font-medium">{Number(nextResult.reqOff || 0)}</span></div>
                </div>
                {Array.isArray(disruptions) && disruptions.length > 0 && (
                  <div className="mt-3">
                    <div className="text-[12px] font-medium uppercase tracking-wide" style={{ color: '#6A3F2B' }}>Disruptions</div>
                    <ul className="mt-1 text-xs grid grid-cols-2 gap-x-4 gap-y-0.5" style={{ color: '#6A3F2B' }}>
                      {disruptions.slice(0, 4).map((d, i) => <li key={i} className="truncate">{d.count}× {d.label}</li>)}
                      {disruptions.length > 4 && <li>+{disruptions.length - 4} more</li>}
                    </ul>
                    <p className="mt-2 text-[11px]" style={{ color: '#6A3F2B' }}>A few clean days will speed things up.</p>
                  </div>
                )}
              </div>
            )
          })()}
        </div>
        {/* BL: Progress */}
        <div className="p-6 md:border-r border-gray-100">
          <div className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-4">Overall progress</div>
          <div className="flex items-center justify-between text-sm text-gray-700 mb-2">
            <span className="text-gray-600">Stack progress</span>
            <span className="font-medium">{progressPercent}%</span>
          </div>
          <div className="w-full">
            <Progress value={progressPercent} className="h-2 w-full" />
          </div>
          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Days tracked</span>
              <span className="font-medium">{streak}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Ready</span>
              <span className="font-medium">{readyCount}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Building</span>
              <span className="font-medium">{buildingCount}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Needs data</span>
              <span className="font-medium">{needsDataCount}</span>
            </div>
          </div>
        </div>
        {/* BR: Stack Economics */}
        <div className="p-6">
          <div className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-1">Stack economics</div>
          <div className="text-sm text-gray-800 mb-4">
            <span className="font-medium">${(totalYearly || 0).toLocaleString()}/yr</span> • {supps.length} supplements
          </div>
          {/* Chart + Legend Row */}
          <div className="flex items-start gap-8 mb-5">
            {/* Donut Chart */}
            <div className="w-24 h-24 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData} dataKey="value" innerRadius={28} outerRadius={40} paddingAngle={2}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={(entry as any).color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Legend - Vertical Stack */}
            <div className="space-y-2 text-sm w-full">
              {chartData.slice(0, 8).map((seg, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: (seg as any).color || '#94a3b8' }} />
                    <span className="text-gray-600">{(seg as any).name}</span>
                  </div>
                  <span className="font-medium">${Number((seg as any).value || 0).toLocaleString()}/yr</span>
                </div>
              ))}
            </div>
          </div>
          {/* Summary */}
          <div className="pt-4 border-t border-gray-100">
            {(() => {
              // Recompute economics from sections to ensure verdict categories are used
              const sec = progress?.sections || { clearSignal: [], noSignal: [], building: [], needsData: [] }
              const sumYear = (arr: any[]) => arr.reduce((acc: number, s: any) => acc + (Math.max(0, Number(s?.monthlyCost || 0)) * 12), 0)
              const effY = sumYear((sec.clearSignal || []).filter((s: any) => (s as any).effectCategory === 'works'))
              const wasteY = sumYear(sec.noSignal || [])
              const testY = sumYear([...(sec.building || []), ...((sec.needsData || []))])
              return (
                <div className="text-sm text-gray-700 mb-2">
                  <span className="font-medium" style={{ color: '#6F7F5A' }}>${effY.toLocaleString()}</span> effective
                  {' • '}
                  <span className="text-gray-700 font-medium">${wasteY.toLocaleString()}</span> wasted
                  {' • '}
                  <span className="font-medium" style={{ color: '#B07A2A' }}>${testY.toLocaleString()}</span> still testing
                </div>
              )
            })()}
            <a href="/results" className="text-sm hover:underline" style={{ color: '#6A3F2B' }}>
              See what’s actually working →
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}


