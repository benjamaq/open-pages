'use client'

import { useEffect, useState } from 'react'

export default function CommunityModal({ supplementId, name, open, onClose }: { supplementId: string; name: string; open: boolean; onClose: () => void }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    if (!open) return
    let mounted = true
    ;(async () => {
      try {
        setLoading(true); setError(null)
        const res = await fetch(`/api/community/${encodeURIComponent(supplementId)}`, { cache: 'no-store' })
        const json = await res.json()
        if (!mounted) return
        if (!res.ok) throw new Error(json?.error || 'Failed')
        setData(json)
      } catch (e: any) {
        setError(e?.message || 'Failed to load community data')
      } finally {
        setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [open, supplementId])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 bg-black/30">
      <div className="absolute inset-0 grid place-items-center px-4">
        <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-md p-5">
          <div className="flex items-start justify-between mb-2">
            <div className="text-lg font-semibold text-slate-800">{name}</div>
            <button className="text-sm text-slate-500" onClick={onClose}>Close</button>
          </div>
          {loading && <div className="text-sm text-slate-600">Loading…</div>}
          {error && <div className="text-sm text-red-600">{error}</div>}
          {data && (
            <div className="space-y-3">
              <div className="text-sm font-medium text-slate-800">{data.keyInsight}</div>
              <div className="h-16 w-full bg-slate-100 rounded" />
              <div>
                <div className="text-xs text-slate-500 mb-1">Community tags</div>
                <div className="flex flex-wrap gap-2">
                  {(data.topTags || []).map((t: string) => (
                    <span key={t} className="px-2 py-1 rounded-full bg-slate-100 text-xs">{t}</span>
                  ))}
                </div>
              </div>
              <div className="text-sm text-slate-700">
                Elli says: Compare your goals to the community signal — this helps prioritise what to test first.
              </div>
              <div className="flex items-center justify-end">
                <button className="px-3 py-1.5 rounded-md bg-slate-900 text-white text-sm" onClick={onClose}>Got it</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}





