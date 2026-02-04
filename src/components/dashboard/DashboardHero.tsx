'use client'

import { useEffect, useMemo, useState } from 'react'
import { Progress } from '@/components/ui/progress'

type Row = {
  id: string
  name: string
  progressPercent: number
  daysOfData: number
  requiredDays: number
  status: 'building'|'ready'|'no_signal'|'too_much_noise'
}

export function DashboardHero() {
  const [sections, setSections] = useState<{ clearSignal: Row[]; building: Row[]; noSignal: Row[]; inconsistent?: Row[]; needsData?: Row[] } | null>(null)
  const [streak, setStreak] = useState<number>(0)
  const [supps, setSupps] = useState<any[]>([])
  const [checkins, setCheckins] = useState<any | null>(null)
  const [stackProgress, setStackProgress] = useState<number>(0)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const r = await fetch('/api/progress/loop', { cache: 'no-store' })
        if (!mounted) return
        if (r.ok) {
          const j = await r.json()
          setSections(j?.sections || null)
          setStreak(j?.checkins?.totalDistinctDays || j?.todaysProgress?.streakDays || 0)
          setCheckins(j?.checkins || null)
          if (typeof j?.stackProgress === 'number') setStackProgress(Math.max(0, Math.min(100, Math.round(j.stackProgress))))
        }
      } catch {}
      try {
        const s = await fetch('/api/supplements', { cache: 'no-store' })
        if (!mounted) return
        if (s.ok) setSupps(await s.json())
      } catch {}
    })()
    return () => { mounted = false }
  }, [])

  const {
    analyzedCount,
    totalSupps,
    readyCount,
    buildingCount,
    needsDataCount,
    overallProgress,
    nextResultName,
    nextResultDetails,
    disruptions
  } = useMemo(() => {
    const total = (sections?.clearSignal?.length || 0) + (sections?.building?.length || 0) + (sections?.noSignal?.length || 0) + ((sections as any)?.inconsistent?.length || 0) + ((sections as any)?.needsData?.length || 0)
    // Progress bar uses definitive results (works + no_effect) over total supplements
    const readyOnly = (sections?.clearSignal?.length || 0) + (sections?.noSignal?.length || 0)
    const denom = Array.isArray(supps) && supps.length > 0 ? supps.length : total
    const pct = denom > 0 ? Math.round((readyOnly / denom) * 100) : 0
    const building = (sections?.building || []).filter((r: any) => {
      const on = Number((r as any)?.daysOnClean ?? (r as any)?.daysOn ?? 0)
      const off = Number((r as any)?.daysOffClean ?? (r as any)?.daysOff ?? 0)
      return (on + off) > 0
    })
    const next = building
      .map(r => ({ r, remaining: Math.max(0, (r.requiredDays || 14) - (r.daysOfData || 0)) }))
      .sort((a, b) => a.remaining - b.remaining)[0]
    const etaBase = next ? Math.max(0, (next.r.requiredDays || 14) - (next.r.daysOfData || 0)) : 0
    const last7Noise = (checkins && checkins.last7 && typeof checkins.last7.noise === 'number') ? checkins.last7.noise : 0
    const penalty = last7Noise >= 4 ? 2 : 0
    const adjusted = Math.max(0, etaBase + penalty)
    const detail = next ? { cleanDays: next.r.daysOfData, requiredDays: next.r.requiredDays, remainingDays: adjusted, id: next.r.id, name: next.r.name } : undefined
    // Personalized disruptions list
    const tagCounts = (checkins && checkins.last7 && checkins.last7.tagCounts) ? checkins.last7.tagCounts : null
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
      analyzedCount: (sections?.clearSignal?.length || 0) + (sections?.noSignal?.length || 0) + (((sections as any)?.inconsistent?.length) || 0),
      totalSupps: Array.isArray(supps) && supps.length > 0 ? supps.length : total,
      readyCount: (sections?.clearSignal?.length || 0) + (sections?.noSignal?.length || 0),
      buildingCount: sections?.building?.length || 0,
      needsDataCount: (sections as any)?.needsData?.length || 0,
      overallProgress: (stackProgress || stackProgress === 0) ? stackProgress : pct,
      nextResultName: detail?.name || null,
      nextResultDetails: detail,
      disruptions: disruptionArr
    }
  }, [sections, supps, checkins, stackProgress])

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-5">
      <div className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-3">Overall progress</div>
      <div className="flex items-center justify-between text-sm text-gray-700">
        <span>Stack progress</span>
        <span>{overallProgress}%</span>
      </div>
      <div className="mt-2">
        <Progress value={overallProgress} className="h-[6px] w-full" />
      </div>
      <div className="mt-2 text-sm text-gray-800">
        <span>Days tracked: {streak}</span>
        <span className="mx-2">•</span>
        <span>Ready: {readyCount}</span>
        <span className="mx-2">•</span>
        <span>Building: {buildingCount}</span>
        <span className="mx-2">•</span>
        <span>Needs data: {needsDataCount}</span>
      </div>
    </section>
  )
}

