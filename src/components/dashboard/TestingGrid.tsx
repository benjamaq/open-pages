'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { SupplementCard } from '@/components/dashboard/SupplementCard'
import { SupplementCardData, mapPurposeTag } from '@/lib/supplements/types'

export function TestingGrid({
  supplements,
  daysCompleted
}: {
  supplements: any[]
  daysCompleted: number
}) {
  const router = useRouter()
  type PatternRow = { id: string; name: string; effect_size: number; confidence_score: number; sample_size?: number | null; status: string; direction: 'positive'|'negative'|'neutral'; monthly_cost?: number | null }
  const [patterns, setPatterns] = useState<Array<PatternRow>>([])
  const [loadingPatterns, setLoadingPatterns] = useState<boolean>(true)
  const [expandInconclusive, setExpandInconclusive] = useState<boolean>(false)
  const [showCostModal, setShowCostModal] = useState<boolean>(false)
  const [costInput, setCostInput] = useState<string>('')
  const [selectedItem, setSelectedItem] = useState<PatternRow | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoadingPatterns(true)
        const res = await fetch('/api/insights/patterns', { cache: 'no-store' })
        if (!mounted) return
        if (res.ok) {
          const data = await res.json()
          setPatterns(Array.isArray(data) ? data : [])
        } else {
          setPatterns([])
        }
      } catch {
        setPatterns([])
      } finally {
        if (mounted) setLoadingPatterns(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  async function refreshPatterns() {
    try {
      setLoadingPatterns(true)
      const res = await fetch('/api/insights/patterns', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        setPatterns(Array.isArray(data) ? data : [])
      }
    } finally {
      setLoadingPatterns(false)
    }
  }

  function openCostModal(item: PatternRow) {
    setSelectedItem(item)
    setCostInput(item.monthly_cost && item.monthly_cost > 0 ? String(item.monthly_cost) : '')
    setShowCostModal(true)
  }

  async function saveCost() {
    if (!selectedItem) return
    const value = parseFloat(costInput)
    if (isNaN(value)) {
      setShowCostModal(false)
      return
    }
    const body = { monthly_cost: Math.max(0, Math.min(80, value)) }
    const res = await fetch(`/api/supplements/${encodeURIComponent(selectedItem.id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    setShowCostModal(false)
    if (res.ok) {
      await refreshPatterns()
    }
  }

  const toCardData = (s: any): SupplementCardData => {
    const rawTagsSource: string[] = Array.isArray(s.primary_goal_tags)
      ? s.primary_goal_tags
      : (Array.isArray(s.tags) ? s.tags : [])
    // Heuristic fallback: infer goals from common supplement names when tags missing
    const name = String(s.name || '').toLowerCase()
    const inferredFromName: string[] =
      rawTagsSource.length > 0 ? [] :
      name.includes('creatine') ? ['energy', 'athletic'] :
      name.includes('magnesium') ? ['sleep', 'stress'] :
      name.includes('omega') ? ['mood', 'inflammation'] :
      name.includes('vitamin d') ? ['immunity'] :
      []
    const rawTags: string[] = rawTagsSource.length > 0 ? rawTagsSource : inferredFromName
    let purposes = rawTags.slice(0, 3).map((t) => mapPurposeTag(t)).filter(Boolean)
    if (purposes.length === 0 && typeof s.primary_metric === 'string') {
      // Fallback to primary_metric if tags missing
      purposes = [mapPurposeTag(String(s.primary_metric))]
    }
    const freq = s.days_per_week && s.days_per_week !== 7 ? `${s.days_per_week}d/wk` : 'Daily'
    const tod = Array.isArray(s.time_of_day) && s.time_of_day.length > 0 ? (s.time_of_day[0] as string) : undefined
    const doseDisplay = [s.daily_dose_amount, s.daily_dose_unit].filter(Boolean).join(' ').trim()

    // Basic insight state from daysCompleted
    let insightState: SupplementCardData['insightState'] = 'too_early'
    if (daysCompleted >= 1 && daysCompleted < 3) insightState = 'collecting_baseline'
    else if (daysCompleted >= 3 && daysCompleted < 5) insightState = 'collecting_baseline'
    else if (daysCompleted >= 5 && daysCompleted < 7) insightState = 'early_signal'
    else if (daysCompleted >= 7) insightState = 'insights_ready'

    const effectMap: Record<string, string> = { mood: 'Mood', energy: 'Energy levels', focus: 'Mental clarity', sleep: 'Sleep quality' }
    const effectDimension = effectMap[(s.primary_metric as string) || '']

    return {
      id: String(s.id),
      name: String(s.name || 'Supplement'),
      doseDisplay,
      purposes,
      timeOfDayLabel: tod ? tod.toUpperCase() : undefined,
      frequencyLabel: freq,
      contextLabel: s.with_food ? 'With food' : undefined,
      daysTrackedLastWindow: Math.min(7, Math.max(0, Number(daysCompleted) || 0)),
      daysRequiredForInsight: 7,
      lastCheckInDate: undefined,
      insightState,
      effectDirection: 'unknown',
      effectDimension,
      memberHasDeeperAnalysis: false,
      hasTruthReport: false,
      isMember: false,
    }
  }

  const cards: SupplementCardData[] = Array.isArray(supplements) ? supplements.map(toCardData) : []

  return (
    <section className="space-y-3">
      <div className="text-sm font-semibold text-slate-900">What You’re Testing</div>
      {/* Pattern-driven view */}
      {!loadingPatterns && patterns.length > 0 ? (() => {
        // 1) remove duplicates (keep highest confidence, then highest |effect|)
        const byName = new Map<string, PatternRow>()
        for (const p of patterns) {
          const key = (p.name || '').trim().toLowerCase()
          if (!key || key.length < 2) continue
          if (key === 'fff') continue // drop test entries
          const prev = byName.get(key)
          if (!prev) { byName.set(key, p); continue }
          const prevScore = (Number(prev.confidence_score) || 0) * 1000 + Math.abs(Number(prev.effect_size) || 0)
          const curScore = (Number(p.confidence_score) || 0) * 1000 + Math.abs(Number(p.effect_size) || 0)
          if (curScore > prevScore) byName.set(key, p)
        }
        const deduped = Array.from(byName.values())
        // Debug specific items (e.g., NAD+)
        try {
          const nad = deduped.find(d => String(d.name || '').toLowerCase().includes('nad'))
          if (nad) {
            // eslint-disable-next-line no-console
            console.log('[TestingGrid] NAD+ debug', {
              name: nad.name,
              effect_size: nad.effect_size,
              confidence_score: nad.confidence_score,
              sample_size: (nad as any).sample_size
            })
          }
        } catch {}
        // 2) grouping thresholds (confidence, effect window, sample size)
        const isSignificant = (r: PatternRow) => String(r.status).toLowerCase() === 'significant'
        const conf = (r: PatternRow) => Number(r.confidence_score || 0)
        const effAbs = (r: PatternRow) => Math.abs(Number(r.effect_size || 0))
        const n = (r: PatternRow) => Number(r.sample_size || 0)
        const workingSorted = deduped
          .filter(r => isSignificant(r) && r.direction === 'positive')
          .sort((a,b) => (Math.abs(b.effect_size)-Math.abs(a.effect_size)) || ((b.confidence_score||0)-(a.confidence_score||0)))
        const hurtingSorted = deduped
          .filter(r => isSignificant(r) && r.direction === 'negative')
          .sort((a,b) => (Math.abs(b.effect_size)-Math.abs(a.effect_size)) || ((b.confidence_score||0)-(a.confidence_score||0)))
        const noEffectSorted = deduped
          .filter(r => conf(r) >= 0.65 && effAbs(r) <= 0.03 && n(r) >= 14)
          .sort((a,b) => (b.confidence_score||0) - (a.confidence_score||0))
        const included = new Set<string>([...workingSorted, ...hurtingSorted, ...noEffectSorted].map(r => r.id))
        const collectingSorted = deduped
          .filter(r => !included.has(r.id))
          .sort((a,b) => (b.confidence_score||0) - (a.confidence_score||0))

        const Row = ({ row, extra }: { row: PatternRow; extra?: 'no_effect' | 'collecting' }) => {
          const sKey = (s: string) => String(s || '').toLowerCase()
          const isSig = sKey(row.status) === 'significant'
          const positive = isSig && row.direction === 'positive'
          const negative = isSig && row.direction === 'negative'
          const isConfounded = sKey(row.status) === 'confounded'
          const leftBorder =
            isConfounded ? 'border-l-4 border-l-amber-500' :
            extra === 'no_effect' ? 'border-l-4 border-l-amber-500' :
            positive ? 'border-l-4 border-l-emerald-500' :
            negative ? 'border-l-4 border-l-rose-500' :
            'border-l-4 border-l-slate-300'
          const badgeClass =
            isConfounded ? 'bg-amber-50 text-amber-800 border-amber-300' :
            extra === 'no_effect' ? 'bg-amber-50 text-amber-800 border-amber-300' :
            positive ? 'bg-emerald-50 text-emerald-700 border-emerald-300' :
            negative ? 'bg-rose-50 text-rose-700 border-rose-300' :
            'bg-slate-50 text-slate-600 border-slate-200'
          const badgeLabel =
            isConfounded ? 'Too much noise' :
            extra === 'no_effect' ? 'No signal found' :
            positive ? 'Strong signal' :
            negative ? 'Strong negative signal' :
            'Building signal'
          return (
            <a
              href={`/supplements/${encodeURIComponent(row.id)}`}
              onClick={(e) => {
                e.preventDefault()
                if (row.id) {
                  router.push(`/supplements/${encodeURIComponent(row.id)}`)
                }
              }}
              className={`block rounded-lg border border-slate-200 ${leftBorder} bg-white p-3 shadow-sm hover:shadow-md transition`}
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-900 truncate">{row.name}</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Signal: {row.effect_size >= 0 ? '+' : ''}{Math.round((row.effect_size || 0) * 100)}% · Signal strength: {Math.round((row.confidence_score||0)*100)}%
                  </div>
                  <div className="text-xs mt-0.5">
                    {row.monthly_cost && row.monthly_cost > 0 ? (
                      <span className="text-slate-600">${Number(row.monthly_cost).toFixed(0)}/month</span>
                    ) : (
                      <span className="text-slate-400">
                        Cost not set · <button
                          className="underline"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); openCostModal(row) }}
                        >
                          Add cost
                        </button>
                      </span>
                    )}
                  </div>
                  {isConfounded && (
                    <div className="mt-1 text-xs text-amber-700">
                      Started within 7 days of other supplements. To isolate the signal, try pausing one for 2–3 weeks while keeping the others consistent.
                    </div>
                  )}
                  {extra === 'no_effect' && (
                    <>
                      <div className="mt-1 text-xs text-amber-700">
                        Tested with {Math.round((row.confidence_score || 0) * 100)}% confidence — no measurable impact
                      </div>
                      {row.monthly_cost && row.monthly_cost > 0 && (
                        <div className="mt-0.5 text-xs text-amber-700">
                          💸 At ${Number(row.monthly_cost).toFixed(0)}/month, that's ${Number((row.monthly_cost || 0) * 12).toFixed(0)}/year with no measurable benefit.
                        </div>
                      )}
                      <div className="mt-0.5 text-xs text-slate-500">
                        Consider dropping for 6 weeks to see if you notice any difference.
                      </div>
                    </>
                  )}
                  {extra === 'collecting' && (
                    <div className="mt-1 text-xs text-slate-500">
                      Need more data to draw conclusions
                    </div>
                  )}
                </div>
                <div className={`ml-3 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${typeof badgeClass === 'string' ? badgeClass : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                  {badgeLabel}
                </div>
              </div>
            </a>
          )
        }

        return (
          <div className="space-y-5">
            {workingSorted.length > 0 && (
              <div className="rounded-xl border-l-4 border-l-emerald-500 bg-emerald-50/40 p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-emerald-700 font-semibold text-sm">
                    <span>✅ Working for you</span>
                    <span className="text-emerald-800 text-xs">({workingSorted.length})</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {workingSorted.map((p, i) => <Row key={`sp-${i}-${p.name}`} row={p} />)}
                </div>
              </div>
            )}
            {hurtingSorted.length > 0 && (
              <div className="rounded-xl border-l-4 border-l-rose-500 bg-rose-50/40 p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-rose-700 font-semibold text-sm">
                    <span>⚠️ May be hurting</span>
                    <span className="text-rose-800 text-xs">({hurtingSorted.length})</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {hurtingSorted.map((p, i) => <Row key={`sn-${i}-${p.name}`} row={p} />)}
                </div>
              </div>
            )}
            {noEffectSorted.length > 0 && (
              <div className="rounded-xl border-l-4 border-l-amber-500 bg-amber-50/40 p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-amber-700 font-semibold text-sm">
                    <span>😐 No signal found</span>
                    <span className="text-amber-800 text-xs">({noEffectSorted.length})</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {noEffectSorted.map((p, i) => <Row key={`ne-${i}-${p.name}`} row={p} extra="no_effect" />)}
                </div>
              </div>
            )}
            {collectingSorted.length > 0 && (
              <div className="rounded-xl border-l-4 border-l-slate-400 bg-slate-50 p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
                    <span>⏳ Building signal</span>
                    <span className="text-slate-600 text-xs">({collectingSorted.length})</span>
                  </div>
                  {collectingSorted.length > 10 && (
                    <button
                      type="button"
                      className="text-xs text-slate-600 hover:text-slate-800 underline"
                      onClick={() => setExpandInconclusive(v => !v)}
                    >
                      {expandInconclusive ? 'Collapse' : 'Show all'}
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(expandInconclusive ? collectingSorted : collectingSorted.slice(0, 10)).map((p, i) => (
                    <Row key={`in-${i}-${p.name}`} row={p} extra="collecting" />
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      })() : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {cards.map((c) => (
            <SupplementCard
              key={c.id}
              data={c}
              href={`/supplements/${encodeURIComponent(c.id)}`}
              onClick={() => router.push(`/supplements/${encodeURIComponent(c.id)}`)}
            />
          ))}
        </div>
      )}
      <div>
        <a href="/dashboard?add=1" className="inline-flex items-center justify-center h-8 px-3 text-xs sm:h-9 sm:px-4 sm:text-sm rounded-full bg-slate-900 text-white font-semibold hover:bg-slate-800">+ Add supplement</a>
      </div>
      {showCostModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowCostModal(false)} />
          <div className="relative z-10 w-full max-w-sm rounded-lg border border-slate-200 bg-white p-4 shadow-xl">
            <div className="mb-3">
              <div className="text-sm text-slate-500">Set monthly cost</div>
              <div className="text-base font-semibold text-slate-900 truncate">{selectedItem.name}</div>
            </div>
            <div className="mb-4">
              <label className="block text-xs text-slate-600 mb-1">Monthly cost (USD)</label>
              <div className="flex items-center gap-2">
                <span className="text-slate-500">$</span>
                <input
                  type="number"
                  min={0}
                  max={80}
                  step="1"
                  value={costInput}
                  onChange={(e) => setCostInput(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-slate-200"
                  placeholder="e.g. 25"
                />
              </div>
              <div className="mt-1 text-[11px] text-slate-500">Clamped between $0–$80</div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                onClick={() => setShowCostModal(false)}
              >
                Cancel
              </button>
              <button
                className="rounded-md bg-slate-900 px-3 py-1.5 text-sm text-white hover:bg-slate-800"
                onClick={saveCost}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}


