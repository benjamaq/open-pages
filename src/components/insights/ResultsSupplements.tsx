'use client'

import { useEffect, useMemo, useState } from 'react'

type Supp = {
  id: string
  name: string
  monthly_cost_usd?: number | null
  created_at?: string | null
}

export function ResultsSupplements() {
  const [supps, setSupps] = useState<Supp[]>([])
  const [effects, setEffects] = useState<Record<string, any>>({})
  const [progress, setProgress] = useState<any | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const s = await fetch('/api/supplements', { cache: 'no-store' })
        if (!mounted) return
        if (s.ok) setSupps(await s.json())
      } catch {}
      try {
        const e = await fetch('/api/effect/summary', { cache: 'no-store' })
        if (!mounted) return
        if (e.ok) {
          const j = await e.json()
          setEffects(j?.effects || {})
        }
      } catch {}
      try {
        const p = await fetch('/api/progress/loop', { cache: 'no-store' })
        if (!mounted) return
        if (p.ok) setProgress(await p.json())
      } catch {}
    })()
    return () => { mounted = false }
  }, [])

  const remainingById: Record<string, number> = useMemo(() => {
    const map: Record<string, number> = {}
    const s = progress?.sections || {}
    const rows = [...(s.building || []), ...(((s as any).needsData) || [])]
    for (const r of rows) {
      const rem = Math.max(0, (r.requiredDays || 14) - (r.daysOfData || 0))
      map[r.id] = rem
    }
    return map
  }, [progress])

  const cards = useMemo(() => {
    return supps.map(s => {
      const eff = (effects as any)[s.id]
      const cat = eff?.effect_category as string | undefined
      const status = cat === 'works' ? 'KEEP' : cat === 'no_effect' ? 'DROP' : 'TESTING'
      const conf = typeof eff?.effect_confidence === 'number' ? Math.round(eff.effect_confidence * 100) : null
      const compatibility = status === 'TESTING' ? '???' : (conf != null ? `${conf}%` : '???')
      const months = (() => {
        try {
          if (!s.created_at) return null
          const start = new Date(s.created_at as any)
          const now = new Date()
          const diff = (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30)
          return Math.max(1, Math.round(diff))
        } catch { return null }
      })()
      const cost = Math.max(0, Math.min(80, Number(s.monthly_cost_usd ?? 0)))
      const spent = months ? Math.round(cost * months) : null
      const remaining = remainingById[s.id]
      return { ...s, status, compatibility, months, spent, remaining }
    })
  }, [supps, effects, remainingById])

  const Badge = ({ text }: { text: string }) => {
    const cls = text === 'KEEP' ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
      : text === 'DROP' ? 'bg-red-100 text-red-700 border-red-200'
      : 'bg-amber-100 text-amber-700 border-amber-200'
    return <span className={`text-[10px] px-2 py-0.5 rounded-full border ${cls}`}>{text}</span>
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {cards.map(c => (
        <div key={c.id} className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div className="font-semibold text-gray-900">{c.name}</div>
            <Badge text={c.status} />
          </div>
          <div className="mt-1 text-sm text-gray-700">Compatibility: <span className="font-medium">{c.compatibility}</span></div>
          <div className="mt-1 text-sm text-gray-700">
            {c.months ? `${c.months} months` : '—'} • {c.spent != null ? `$${c.spent} spent` : (c.monthly_cost_usd ? `$${Math.round(Number(c.monthly_cost_usd))}/mo` : '$0/mo')}
          </div>
          <div className="mt-3 text-sm text-gray-700">
            {c.status === 'TESTING' ? (
              <span>{typeof c.remaining === 'number' ? `Need ~${c.remaining} more clean days for result.` : 'Signal building...'}</span>
            ) : (
              <span>{c.status === 'KEEP' ? 'Solid signal. Worth keeping.' : 'No benefit detected. Safe to drop.'}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}


