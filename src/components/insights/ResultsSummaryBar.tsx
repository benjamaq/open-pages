'use client'

import { useEffect, useMemo, useState } from 'react'

export function ResultsSummaryBar() {
  const [effects, setEffects] = useState<Record<string, any>>({})
  const [supps, setSupps] = useState<Array<{ id: string; monthly_cost_usd?: number | null }>>([])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const e = await fetch('/api/effect/summary', { cache: 'no-store' })
        if (!mounted) return
        if (e.ok) {
          const j = await e.json()
          setEffects(j?.effects || {})
        }
      } catch {}
      try {
        const r = await fetch('/api/supplements', { cache: 'no-store' })
        if (!mounted) return
        if (r.ok) setSupps(await r.json())
      } catch {}
    })()
    return () => { mounted = false }
  }, [])

  const { keepers, drops, monthly, waste } = useMemo(() => {
    let k = 0, d = 0, m = 0, w = 0
    for (const s of supps) {
      const cost = Math.max(0, Math.min(80, Number(s?.monthly_cost_usd ?? 0)))
      m += cost
      const eff = (effects as any)[s.id]
      const cat = eff?.effect_category as string | undefined
      if (cat === 'works') k += 1
      if (cat === 'no_effect') { d += 1; w += cost }
    }
    return { keepers: k, drops: d, monthly: Math.round(m), waste: Math.round(w) }
  }, [effects, supps])

  const Tile = ({ label, value, color }: { label: string; value: string; color?: string }) => (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
      <div className={`mt-1 text-lg font-semibold ${color || 'text-gray-900'}`}>{value}</div>
    </div>
  )

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <Tile label="Keepers" value={`${keepers} supps`} color="text-emerald-700" />
      <Tile label="Drop" value={`${drops} supps`} color="text-red-600" />
      <Tile label="Monthly" value={`$${monthly}/mo`} />
      <Tile label="Potential waste" value={`$${waste}/mo`} />
    </div>
  )
}


