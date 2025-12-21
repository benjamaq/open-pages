'use client'

import { useEffect, useMemo, useState } from 'react'
import { interpretEffect } from '@/lib/analysis/interpret'
import { ConfidenceMeter } from './ConfidenceMeter'

export function EffectsResultsSection() {
  const [effects, setEffects] = useState<Record<string, any> | null>(null)
  const [supps, setSupps] = useState<any[]>([])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch('/api/effect/summary', { cache: 'no-store' })
        if (!mounted) return
        if (res.ok) {
          const j = await res.json()
          setEffects(j?.effects || {})
        } else {
          setEffects({})
        }
      } catch {
        if (mounted) setEffects({})
      }
      try {
        const s = await fetch('/api/supplements', { cache: 'no-store' })
        if (!mounted) return
        if (s.ok) setSupps(await s.json())
      } catch {
        if (mounted) setSupps([])
      }
    })()
    return () => { mounted = false }
  }, [])

  const rows = useMemo(() => {
    if (!effects) return []
    return (supps || []).map(s => {
      const eff = effects[s.id]
      return {
        id: s.id,
        name: s.name,
        monthly: Number(s.monthly_cost_usd || 0),
        effect_category: eff?.effect_category || null,
        effect_direction: eff?.effect_direction || null,
        effect_magnitude: eff?.effect_magnitude ?? null,
        effect_confidence: eff?.effect_confidence ?? null,
        pre_start_average: eff?.pre_start_average ?? null,
        post_start_average: eff?.post_start_average ?? null,
        days_on: eff?.days_on ?? null,
        days_off: eff?.days_off ?? null,
        clean_days: eff?.clean_days ?? null,
        noisy_days: eff?.noisy_days ?? null
      }
    }).filter(r => r.effect_category) // only show those with results
  }, [effects, supps])

  if (effects == null) return null

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Effect Results</h2>
        <p className="text-sm text-slate-600">These results update nightly after your check-ins.</p>
      </div>
      {rows.length === 0 ? (
        <div className="text-sm text-slate-600">Your supplements are building signal. Keep checking in!</div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {rows.map(r => (
            <div key={r.id} className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`font-semibold ${
                    r.effect_category === 'works' ? 'text-emerald-700' :
                    r.effect_category === 'no_effect' ? 'text-gray-700' :
                    r.effect_category === 'inconsistent' ? 'text-amber-700' :
                    'text-blue-700'
                  }`}>{r.name}</div>
                  <div className={`text-[11px] px-2 py-0.5 rounded-full ${
                  r.effect_category === 'works' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                  r.effect_category === 'no_effect' ? 'bg-gray-100 text-gray-700 border border-gray-200' :
                  r.effect_category === 'inconsistent' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                  'bg-blue-100 text-blue-700 border border-blue-200'
                }`}>{r.effect_category}</div>
                </div>
                {['works','no_effect','inconsistent'].includes(String(r.effect_category)) && typeof r.effect_confidence === 'number' ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-600">Confidence</span>
                    <ConfidenceMeter value={Math.round(r.effect_confidence * 100)} />
                  </div>
                ) : null}
              </div>
              <div className="mt-1 text-sm text-slate-700">
                <EffectSummaryLine name={r.name} data={r} />
              </div>
              <div className="mt-2 text-sm text-slate-700">
                <div className="flex flex-wrap gap-4">
                  <div>Direction: <span className="font-medium">{r.effect_direction ?? '—'}</span></div>
                  <div>Effect size: <span className="font-medium">{typeof r.effect_magnitude === 'number' ? r.effect_magnitude.toFixed(2) : '—'}</span></div>
                  <div>Confidence: <span className="font-medium">{typeof r.effect_confidence === 'number' ? Math.round(r.effect_confidence * 100) + '%' : '—'}</span></div>
                </div>
                {['works','no_effect','inconsistent'].includes(String(r.effect_category)) && (
                  <div className="mt-3">
                    <div className="text-xs text-slate-600 mb-1">ON vs OFF average (composite)</div>
                    <OnOffBars onAvg={r.post_start_average} offAvg={r.pre_start_average} />
                  </div>
                )}
                {String(r.effect_category) === 'needs_more_data' ? (
                  <div className="mt-2 text-xs text-slate-500 italic">
                    Comparison data not yet available
                  </div>
                ) : (
                  <div className="mt-2 text-xs text-slate-600">
                    Pre vs Post: <span className="font-medium">{r.pre_start_average ?? '—'}</span> → <span className="font-medium">{r.post_start_average ?? '—'}</span>
                    <span className="mx-2">•</span>
                    Days on/off: <span className="font-medium">{r.days_on ?? 0}</span>/<span className="font-medium">{r.days_off ?? 0}</span>
                    <span className="mx-2">•</span>
                    Clean/noisy: <span className="font-medium">{r.clean_days ?? 0}</span>/<span className="font-medium">{r.noisy_days ?? 0}</span>
                  </div>
                )}
                <div className="mt-2">
                  <NextSteps name={r.name} data={r} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function EffectSummaryLine({ name, data }: { name: string; data: any }) {
  const interp = interpretEffect({ name, ...data })
  return <div className="text-slate-700">{interp.summarySentence}</div>
}

function NextSteps({ name, data }: { name: string; data: any }) {
  const interp = interpretEffect({ name, ...data })
  if (!interp.nextSteps?.length) return null
  return (
    <div>
      <div className="text-xs font-semibold text-slate-700 mb-1">Next steps</div>
      <ul className="list-disc pl-5 text-xs text-slate-600 space-y-0.5">
        {interp.nextSteps.map((s: string, i: number) => <li key={i}>{s}</li>)}
      </ul>
    </div>
  )
}

function OnOffBars({ onAvg, offAvg }: { onAvg: number | null; offAvg: number | null }) {
  const onV = typeof onAvg === 'number' ? onAvg : 0
  const offV = typeof offAvg === 'number' ? offAvg : 0
  const max = Math.max(1, onV, offV)
  const onPct = Math.max(0, Math.min(100, Math.round((onV / max) * 100)))
  const offPct = Math.max(0, Math.min(100, Math.round((offV / max) * 100)))
  return (
    <div className="flex items-center gap-4">
      <div className="flex-1">
        <div className="text-[11px] text-slate-600 mb-1">ON: <span className="font-medium">{typeof onAvg === 'number' ? onAvg.toFixed(2) : '—'}</span></div>
        <div className="w-full h-2 bg-slate-100 rounded">
          <div className="h-2 rounded bg-emerald-500" style={{ width: `${onPct}%` }} />
        </div>
      </div>
      <div className="flex-1">
        <div className="text-[11px] text-slate-600 mb-1">OFF: <span className="font-medium">{typeof offAvg === 'number' ? offAvg.toFixed(2) : '—'}</span></div>
        <div className="w-full h-2 bg-slate-100 rounded">
          <div className="h-2 rounded bg-gray-400" style={{ width: `${offPct}%` }} />
        </div>
      </div>
    </div>
  )
}


