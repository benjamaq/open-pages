'use client'

import { useEffect, useMemo, useState } from 'react'

type Row = { id: string; name: string; daysOfData: number; requiredDays: number }

export function NextResultCard() {
  const [building, setBuilding] = useState<Row[]>([])
  const [checkins, setCheckins] = useState<any | null>(null)
  const [nextLikely, setNextLikely] = useState<{ name: string; estimate: string } | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const r = await fetch('/api/progress/loop', { cache: 'no-store' })
        if (!mounted) return
        if (r.ok) {
          const j = await r.json()
          const b = (j?.sections?.building || []).map((r: any) => ({
            id: r.id, name: r.name, daysOfData: r.daysOfData, requiredDays: r.requiredDays
          }))
          setBuilding(b)
          setCheckins(j?.checkins || null)
          if (j?.todaysProgress?.nextLikely) setNextLikely(j.todaysProgress.nextLikely)
        }
      } catch {}
    })()
    return () => { mounted = false }
  }, [])

  const data = useMemo(() => {
    if (!Array.isArray(building) || building.length === 0) return null
    const next = building
      .map(r => ({ r, remaining: Math.max(0, (r.requiredDays || 14) - (r.daysOfData || 0)) }))
      .sort((a, b) => a.remaining - b.remaining)[0]
    const tagCounts = (checkins && checkins.last7 && checkins.last7.tagCounts) ? checkins.last7.tagCounts : null
    const labelMap: Record<string, string> = {
      alcohol: 'alcohol',
      travel: 'travel / timezone change',
      poor_sleep: 'poor sleep',
      high_stress: 'high stress',
      illness: 'feeling unwell',
      intense_exercise: 'intense exercise',
    }
    const disruptions: Array<{ label: string; count: number }> = []
    if (tagCounts) {
      for (const [k, v] of Object.entries(tagCounts as Record<string, number>)) {
        const n = Number(v || 0)
        if (n > 0 && labelMap[k]) disruptions.push({ label: labelMap[k], count: n })
      }
    }
    const shown = disruptions.slice(0, 4)
    const extra = disruptions.length > 4 ? disruptions.length - 4 : 0
    return {
      name: next?.r?.name || null,
      cleanDays: next?.r?.daysOfData || 0,
      requiredDays: next?.r?.requiredDays || 14,
      remainingDays: next?.remaining || 0,
      disruptions: shown,
      extra
    }
  }, [building, checkins])

  return (
    <section className="rounded-lg border border-gray-200 bg-gray-50 p-5">
      <div className="text-[12px] font-semibold uppercase tracking-wide text-emerald-700 mb-2">Next result</div>
      <div className="text-base font-semibold text-gray-900">{nextLikely?.name || data?.name || '—'}</div>
      {data && (
        <>
          {nextLikely?.estimate ? (
            <div className="mt-1">
              <div className="text-2xl font-extrabold text-gray-900">{nextLikely.estimate.replace('days','')}</div>
              <div className="text-sm text-gray-700">estimated days</div>
            </div>
          ) : data.remainingDays > 0 && (
            <div className="mt-1">
              <div className="text-2xl font-extrabold text-gray-900">{`~${data.remainingDays}`}</div>
              <div className="text-sm text-gray-700">clean days remaining</div>
            </div>
          )}
          <div className="mt-2 text-xs text-gray-700">
            <div>
              Clean:{' '}
              <span className="font-medium">
                {data.cleanDays >= data.requiredDays
                  ? `${data.cleanDays} ✓`
                  : `${data.cleanDays} of ${data.requiredDays}`}
              </span>
              {data.cleanDays < data.requiredDays ? ' days' : ''}
            </div>
          </div>
          {data.disruptions.length > 0 && (
            <div className="mt-3">
              <div className="text-[12px] font-semibold uppercase tracking-wide text-emerald-700">Disruptions</div>
              <ul className="mt-1 text-xs text-emerald-900 grid grid-cols-2 gap-x-4 gap-y-0.5">
                {data.disruptions.map((d, i) => <li key={i} className="truncate">{d.count}× {d.label}</li>)}
                {data.extra > 0 && <li className="text-emerald-800">+{data.extra} more</li>}
              </ul>
              <p className="mt-2 text-[11px] text-emerald-800">A few clean days will speed things up.</p>
            </div>
          )}
        </>
      )}
    </section>
  )
}


