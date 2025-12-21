'use client'

import { useEffect, useMemo, useState } from 'react'
import { mapPurposeTag } from '@/lib/supplements/types'

type Supp = { primary_goal_tags?: string[] }

export function InferredGoals() {
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

  const counts = useMemo(() => {
    const acc: Record<string, number> = {}
    for (const s of (supps || [])) {
      const tags = Array.isArray(s.primary_goal_tags) ? s.primary_goal_tags : []
      for (const t of tags) {
        const label = mapPurposeTag(t) || 'Other'
        acc[label] = (acc[label] || 0) + 1
      }
    }
    return Object.entries(acc).sort((a, b) => b[1] - a[1])
  }, [supps])

  if (error) return null
  if (!supps) return null
  if (counts.length === 0) return null

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="text-sm font-semibold text-slate-900 mb-3">Your Goals (from your stack)</div>
      <ul className="space-y-1 text-sm text-slate-800">
        {counts.map(([goal, count]) => (
          <li key={goal} className="flex items-center justify-between">
            <span className="capitalize">{goal}</span>
            <span className="text-slate-600">{count} {count === 1 ? 'supplement' : 'supplements'}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}




