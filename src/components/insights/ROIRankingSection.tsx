'use client'

import { useEffect, useMemo, useState } from 'react'
import { abbreviateSupplementName } from '@/lib/utils/abbreviate'

type SupplementROI = {
  id: string
  name: string
  daysOfData: number
  requiredDays: number
  totalSpent: number
}

export function ROIRankingSection() {
  const [supps, setSupps] = useState<any[]>([])
  const [progress, setProgress] = useState<any | null>(null)

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
      try {
        const pr = await fetch('/api/progress/loop', { cache: 'no-store', credentials: 'include' })
        if (pr.ok) {
          const j = await pr.json()
          if (mounted) setProgress(j)
        }
      } catch {
        if (mounted) setProgress(null)
      }
    })()
    return () => { mounted = false }
  }, [])

  const items: SupplementROI[] = useMemo(() => {
    // Build a map from progress API to get clean days and required days
    const rows = [
      ...((progress?.sections?.clearSignal as any[]) || []),
      ...((progress?.sections?.building as any[]) || []),
      ...((progress?.sections?.noSignal as any[]) || []),
      ...(((progress?.sections as any)?.inconsistent as any[]) || []),
      ...(((progress?.sections as any)?.needsData as any[]) || []),
    ]
    const byId = new Map<string, any>()
    for (const r of rows) byId.set(String(r.id), r)
    return (supps || []).map((s: any) => {
      const pr = byId.get(String(s.id))
      const days = pr ? Number(pr.daysOfData || 0) : 0
      const req = pr ? Number(pr.requiredDays || 14) : 14
      const mc = Number(s?.monthly_cost_usd)
      const monthly = Number.isFinite(mc) ? Math.max(0, Math.min(80, mc)) : 0
      const totalSpent = (monthly / 30) * days
      return { id: s.id, name: s.name || 'Supplement', daysOfData: days, requiredDays: req, totalSpent }
    })
  }, [supps, progress])

  const needsData = items.filter(i => i.daysOfData < (i.requiredDays || 14))
  const noEffect: SupplementROI[] = [] // Placeholder until effect engine wired
  const bestValue: any[] = [] // Placeholder; will compute once effect sizes are available

  return (
    <section className="bg-white rounded-2xl p-6 border border-slate-200">
      <div className="mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">💎 VALUE RANKING</h2>
        <p className="text-sm text-gray-500">Which supplements give you the most bang for your buck?</p>
      </div>

      {bestValue.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3 uppercase tracking-wide">Best Value</h3>
          <div className="space-y-3">
            {bestValue.map((supp, i) => (
              <div key={supp.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">{abbreviateSupplementName(String(supp?.name || ''))}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {needsData.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wide flex items-center gap-2">⏳ Needs More Data</h3>
          <div className="bg-gray-50 rounded-lg divide-y">
            {needsData.map(supp => (
              <div key={supp.id} className="flex justify-between items-center p-3">
                <span className="text-gray-700">{abbreviateSupplementName(String(supp?.name || ''))}</span>
                <span className="text-sm text-gray-500">{supp.daysOfData >= (supp.requiredDays || 14) ? `Day ${supp.requiredDays} of ${supp.requiredDays}` : `${supp.daysOfData} of ${supp.requiredDays} clean days`}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {noEffect.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-amber-600 mb-3 uppercase tracking-wide flex items-center gap-2">⚠️ Consider Dropping</h3>
            {noEffect.map(supp => (
            <div key={supp.id} className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="font-medium mb-1">{abbreviateSupplementName(String(supp?.name || ''))}</div>
              <div className="text-sm text-gray-600 mb-3">
                {supp.daysOfData} days tracked • ${supp.totalSpent.toFixed(2)} spent • No detectable benefit
              </div>
              <div className="flex gap-3">
                <button className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-white transition">Keep Testing</button>
                <button className="px-4 py-2 text-sm bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition">Drop from Stack</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {bestValue.length === 0 && needsData.length === 0 && noEffect.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>Complete 14+ days of tracking to see value rankings</p>
        </div>
      )}
    </section>
  )
}


