'use client'

import { useEffect, useMemo, useState } from 'react'
import PaywallModal from '../../components/billing/PaywallModal'

type EffectRow = {
  user_supplement_id: string
  effect_category: 'works' | 'no_effect' | 'inconsistent' | 'needs_more_data' | string
  effect_direction?: 'positive' | 'negative' | null
  effect_magnitude?: number | null
  effect_confidence?: number | null
  pre_start_average?: number | null
  post_start_average?: number | null
  days_on?: number | null
  days_off?: number | null
  clean_days?: number | null
  noisy_days?: number | null
}

type Supplement = {
  id: string
  name: string
  monthly_cost_usd?: number | null
}

type LoopRow = {
  id: string
  name: string
  progressPercent: number
  daysOfData: number
  requiredDays: number
  status: 'building' | 'ready' | 'no_signal'
  trend?: 'positive' | 'negative' | 'neutral'
  effectPct?: number | null
  confidence?: number | null
  monthlyCost?: number | null
  daysOnClean?: number
  daysOffClean?: number
  requiredOnDays?: number
  requiredOffDays?: number
}

export default function ResultsPage() {
  const [paid, setPaid] = useState<boolean | null>(null)
  const [openPaywall, setOpenPaywall] = useState(false)
  const [supps, setSupps] = useState<Supplement[]>([])
  const [effects, setEffects] = useState<Record<string, EffectRow | undefined>>({})
  const [loopById, setLoopById] = useState<Record<string, LoopRow>>({})
  const [showMethod, setShowMethod] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      // Gate by billing
      try {
        const r = await fetch('/api/billing/info', { cache: 'no-store' })
        const j = r.ok ? await r.json() : {}
        const isPaid = typeof j?.isPaid === 'boolean'
          ? Boolean(j.isPaid)
          : Boolean(j?.subscription && (j.subscription.status === 'active' || j.subscription.status === 'trialing'))
        if (!cancelled) setPaid(isPaid)
      } catch { if (!cancelled) setPaid(false) }
      // Load supplements and effects
      try {
        const r1 = await fetch('/api/supplements', { cache: 'no-store' })
        const items = r1.ok ? await r1.json() : []
        if (!cancelled) setSupps(Array.isArray(items) ? items : [])
      } catch {}
      try {
        const r2 = await fetch('/api/effect/summary', { cache: 'no-store' })
        const j2 = r2.ok ? await r2.json() : {}
        const map: Record<string, EffectRow> = {}
        if (j2?.effects && typeof j2.effects === 'object') {
          Object.entries(j2.effects).forEach(([id, v]: any) => { map[id] = v as EffectRow })
        }
        if (!cancelled) setEffects(map)
      } catch {}
      // Load progress loop for clean-day counts and requirements
      try {
        const r3 = await fetch('/api/progress/loop', { cache: 'no-store' })
        const j3 = r3.ok ? await r3.json() : {}
        const flatten: any[] = []
        if (j3?.sections && typeof j3.sections === 'object') {
          Object.values(j3.sections).forEach((arr: any) => {
            if (Array.isArray(arr)) flatten.push(...arr)
          })
        }
        if (flatten.length === 0 && Array.isArray(j3?.items)) flatten.push(...j3.items)
        const byId: Record<string, LoopRow> = {}
        for (const r of flatten) {
          const row = r as any
          const id = String(row.id)
          byId[id] = {
            id,
            name: String(row.name ?? ''),
            progressPercent: Number(row.progressPercent ?? 0),
            daysOfData: Number(row.daysOfData ?? 0),
            requiredDays: Number(row.requiredDays ?? 14),
            status: (row.status as any) ?? 'building',
            trend: (row.trend as any) ?? undefined,
            effectPct: typeof row.effectPct === 'number' ? row.effectPct : null,
            confidence: typeof row.confidence === 'number' ? row.confidence : null,
            monthlyCost: typeof row.monthlyCost === 'number' ? row.monthlyCost : null,
            daysOnClean: typeof row.daysOnClean === 'number' ? row.daysOnClean : undefined,
            daysOffClean: typeof row.daysOffClean === 'number' ? row.daysOffClean : undefined,
            requiredOnDays: typeof row.requiredOnDays === 'number' ? row.requiredOnDays : undefined,
            requiredOffDays: typeof row.requiredOffDays === 'number' ? row.requiredOffDays : undefined,
          }
        }
        if (!cancelled) setLoopById(byId)
      } catch {}
    })()
    return () => { cancelled = true }
  }, [])

  const rows = useMemo(() => {
    return supps.map(s => {
      const e = effects[s.id]
      const cat = (e?.effect_category || '').toLowerCase()
      // Base verdict from effect summary (legacy), will be overridden by loop verdict when available
      let verdict: 'KEEP' | 'DROP' | 'INCONCLUSIVE' = 'INCONCLUSIVE'
      if (cat === 'works') verdict = 'KEEP'
      else if (cat === 'no_effect') verdict = 'DROP'
      else if (cat === 'inconsistent') verdict = 'INCONCLUSIVE'
      const conf = typeof e?.effect_confidence === 'number' ? Math.round(e!.effect_confidence!) : null
      const magVal = typeof e?.effect_magnitude === 'number' ? Math.round(e!.effect_magnitude!) : null
      const dir = (e?.effect_direction || '').toString().toLowerCase()
      const signedMag = typeof magVal === 'number'
        ? (dir === 'negative' ? -Math.abs(magVal) : Math.abs(magVal))
        : null
      const onAvg = typeof e?.post_start_average === 'number' ? Number(e?.post_start_average) : null
      const offAvg = typeof e?.pre_start_average === 'number' ? Number(e?.pre_start_average) : null
      const daysOn = typeof e?.days_on === 'number' ? e?.days_on : null
      const daysOff = typeof e?.days_off === 'number' ? e?.days_off : null
      const loopData = loopById[s.id]
      const monthly = Math.max(0, Math.min(80, Number(s.monthly_cost_usd ?? 0)))
      const yearly = Math.round(monthly * 12)
      // Cost impact phrasing
      const costText = (() => {
        if (verdict === 'KEEP') return monthly > 0 ? `Worth keeping: $${monthly}/month` : 'Worth keeping'
        if (verdict === 'DROP') return monthly > 0 ? `Consider dropping: Save $${monthly}/month` : 'Consider dropping'
        // If inconclusive, nudge only when effect suggests negative and confidence moderate
        if (typeof signedMag === 'number' && signedMag < 0 && (conf ?? 0) >= 60) {
          return monthly > 0 ? `Consider dropping: Save $${monthly}/month` : 'Consider dropping'
        }
        return ''
      })()
      // Use loop verdict/state to align with dashboard
      // (loop computed above)
      const isReady = Boolean(loopData && (loopData as any).isReady)
      const loopVerdictRaw = String(loopData?.verdict || '').toLowerCase()
      if (isReady) {
        if (loopVerdictRaw === 'keep') verdict = 'KEEP'
        else if (loopVerdictRaw === 'drop') verdict = 'DROP'
        else verdict = 'INCONCLUSIVE'
      }
      // Progressive status badge (prioritize loop readiness)
      const badge = (() => {
        if (isReady) {
          if (verdict === 'KEEP') return { label: 'KEEP', cls: 'bg-emerald-100 text-emerald-800 border border-emerald-200' }
          if (verdict === 'DROP') return { label: 'DROP', cls: 'bg-rose-100 text-rose-800 border border-rose-200' }
          return { label: 'Inconclusive', cls: 'bg-gray-100 text-gray-700 border border-gray-200' }
        }
        // Not ready yet → use magnitude/confidence to show interim state
        const c = conf ?? 0
        if (typeof signedMag === 'number' && Math.abs(signedMag) >= 5) {
          if (c >= 80) return { label: signedMag > 0 ? 'KEEP' : 'DROP', cls: signedMag > 0 ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-rose-100 text-rose-800 border border-rose-200' }
          if (c >= 60) return { label: signedMag > 0 ? 'Likely keep' : 'Likely drop', cls: signedMag > 0 ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200' }
          return { label: 'Early read', cls: 'bg-amber-50 text-amber-800 border border-amber-200' }
        }
        return { label: 'Collecting data', cls: 'bg-stone-100 text-stone-600' }
      })()
      // Distance to verdict and context
      const onClean = loopData?.daysOnClean ?? null
      const offClean = loopData?.daysOffClean ?? null
      const reqOn = loopData?.requiredOnDays ?? loopData?.requiredDays ?? null
      const reqOff = loopData?.requiredOffDays ?? (loopData?.requiredDays ? Math.min(5, Math.max(3, Math.round(loopData.requiredDays / 4))) : null)
      let distance: string | null = null
      if (isReady) {
        distance = 'Verdict ready'
      } else if (typeof onClean === 'number' && typeof offClean === 'number' && typeof reqOn === 'number' && typeof reqOff === 'number') {
        const needOn = Math.max(0, reqOn - onClean)
        const needOff = Math.max(0, reqOff - offClean)
        if (needOn === 0 && needOff === 0) distance = 'Ready for verdict'
        else if (needOn > 0 && needOff > 0) distance = `~${needOn + needOff} clean days for confident verdict`
        else if (needOn > 0) distance = `~${needOn} more clean ON day${needOn === 1 ? '' : 's'}`
        else if (needOff > 0) distance = `~${needOff} more clean OFF day${needOff === 1 ? '' : 's'}`
      }
      let rotationHint: string | null = null
      if ((offClean ?? 0) === 0 && (onClean ?? 0) > 0) rotationHint = 'Needs OFF days — follow your rotation schedule'
      const contextLines: string[] = []
      if (isReady) {
        const effPct = typeof (loopData as any)?.effectPercent === 'number' ? Math.round((loopData as any).effectPercent) : null
        const metric = (loopData as any)?.effectMetric || 'energy'
        if (verdict === 'KEEP' && effPct != null) contextLines.push(`Clear positive effect: +${effPct}% ${metric}`)
        else if (verdict === 'DROP' && effPct != null) contextLines.push(`Clear negative effect: ${effPct}% ${metric}`)
        else {
          const inconc = (loopData as any)?.inconclusiveText || 'Data ready, effect not statistically clear'
          contextLines.push(`Inconclusive — ${inconc}`)
        }
      } else {
        if (typeof signedMag === 'number') {
          if (Math.abs(signedMag) < 5) contextLines.push('No measurable effect (<5% difference)')
          else contextLines.push(`${signedMag >= 0 ? '+' : ''}${signedMag}% on ON days vs OFF days`)
        } else {
          contextLines.push('Collecting data — trend not clear yet')
        }
      }
      if (typeof onAvg === 'number' || typeof offAvg === 'number') {
        contextLines.push(`ON: ${typeof onAvg === 'number' ? onAvg.toFixed(1) : '—'} avg • OFF: ${typeof offAvg === 'number' ? offAvg.toFixed(1) : '—'} avg`)
      }
      if (typeof onClean === 'number' || typeof offClean === 'number') {
        contextLines.push(`${typeof onClean === 'number' ? onClean : 0} clean ON day${(onClean ?? 0) === 1 ? '' : 's'} • ${typeof offClean === 'number' ? offClean : 0} clean OFF day${(offClean ?? 0) === 1 ? '' : 's'}`)
      }
      if (distance) contextLines.push(distance)
      if (rotationHint) contextLines.push(rotationHint)
      const actionText = (() => {
        if (distance === 'Ready for verdict') return 'View your result'
        if (rotationHint) return 'Why OFF days matter →'
        return 'Keep tracking →'
      })()
      return { id: s.id, name: s.name, verdict, badge, conf, mag: signedMag, monthly, yearly, costText, onAvg, offAvg, daysOn, daysOff, onClean, offClean, reqOn, reqOff, distance, rotationHint, contextLines, actionText }
    })
  }, [supps, effects, loopById])

  const summary = useMemo(() => {
    const keep = rows.filter(r => r.verdict === 'KEEP')
    const drop = rows.filter(r => r.verdict === 'DROP')
    const close = rows.filter(r => r.badge.label === 'Likely keep' || r.badge.label === 'Likely drop' || r.badge.label === 'Early read')
    const needOff = rows.filter(r => (r.reqOff ?? 0) > (r.offClean ?? 0))
    const underReviewYear = rows.reduce((sum, r) => sum + (r.verdict === 'INCONCLUSIVE' ? r.yearly : 0), 0)
    const saveYear = drop.reduce((sum, r) => sum + r.yearly, 0)
    const totalYear = rows.reduce((sum, r) => sum + r.yearly, 0)
    return { keep, drop, close, needOffCount: needOff.length, underReviewYear, saveYear, totalYear }
  }, [rows])

  if (paid === null) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-gray-600">Loading…</div>
  }

  if (!paid) {
    return (
      <div className="min-h-screen bg-[#F6F5F3]">
        <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-50">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <a href="/dashboard" className="text-sm text-slate-700 hover:underline">← Back to Dashboard</a>
            <div className="text-sm font-semibold text-slate-900">Results</div>
            <div />
          </div>
        </header>
        <div className="max-w-3xl mx-auto px-6 py-12">
          <h1 className="text-2xl font-semibold text-[#111111]">Your results</h1>
          <p className="mt-2 text-sm text-[#4B5563]">Unlock verdicts based on your real data.</p>
          <div className="mt-6 grid gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-[#E4E1DC] bg-white p-4">
                <div className="h-4 w-48 bg-gray-200 rounded mb-3" />
                <div className="h-3 w-32 bg-gray-200 rounded mb-2" />
                <div className="h-3 w-56 bg-gray-200 rounded" />
                <div className="mt-3 h-6 w-24 bg-gray-200 rounded-full" />
              </div>
            ))}
          </div>
          <button
            onClick={() => setOpenPaywall(true)}
            className="mt-6 w-full h-12 rounded-full bg-[#111111] text-white text-sm font-semibold hover:bg-black"
          >
            Unlock your results
          </button>
          <PaywallModal open={openPaywall} onClose={() => setOpenPaywall(false)} defaultPeriod="yearly" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F6F5F3]">
      <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <a href="/dashboard" className="text-sm text-slate-700 hover:underline">← Back to Dashboard</a>
          <div className="text-sm font-semibold text-slate-900">Results</div>
          <div />
        </div>
      </header>
      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-semibold text-[#111111]">Your verdicts</h1>
        <div className="mt-1 text-sm text-[#4B5563]">
          ${summary.underReviewYear}/year currently under review • {summary.close.length} close to verdict • {summary.needOffCount} need more OFF days
        </div>
        <div className="mt-2 text-xs text-[#6B7280]">
          Most members remove 30–50% of their stack once verdicts land.
        </div>

        <div className="mt-6 grid gap-4">
          {rows.map(r => (
            <div key={r.id} className="rounded-xl border border-[#E4E1DC] bg-white p-5">
              <div className="flex items-center justify-between">
                <div className="text-base font-semibold text-[#111111]">{r.name}</div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${r.badge.cls}`}>
                  {r.badge.label}
                </span>
              </div>
              <div className="mt-2 text-sm text-[#4B5563]">
                {typeof r.mag === 'number'
                  ? (Math.abs(r.mag) < 5
                    ? 'No measurable effect (<5% difference)'
                    : (r.mag >= 0
                      ? `Trending positive: +${r.mag}% energy on ON days`
                      : `Trending negative: ${r.mag}% on ON days`))
                  : 'No measurable effect'}
              </div>
              <div className="mt-1 text-xs text-[#6B7280]">
                {typeof r.conf === 'number'
                  ? `${r.conf >= 80 ? 'High' : r.conf >= 60 ? 'Medium' : 'Low'} confidence (${r.conf}%)`
                  : 'Confidence not available'}
              </div>
              {r.contextLines && r.contextLines.length > 0 && (
                <div className="mt-2 text-xs text-[#4B5563] space-y-0.5">
                  {r.contextLines.map((line: string, i: number) => <div key={i}>{line}</div>)}
                </div>
              )}
              {r.costText && <div className="mt-2 text-sm text-[#111111]">{r.costText}</div>}
              {(typeof r.onAvg === 'number' || typeof r.offAvg === 'number') && (
                <div className="mt-3">
                  <div className="text-xs font-semibold text-[#6B7280] uppercase mb-1">On vs Off comparison</div>
                  <div className="grid grid-cols-2 gap-3 text-sm text-[#111111]">
                    <div className="rounded-lg border border-[#E4E1DC] p-3 bg-[#FAFAF9]">
                      <div className="text-xs text-[#6B7280] mb-0.5">Average ON</div>
                      <div className="font-medium">{typeof r.onAvg === 'number' ? r.onAvg.toFixed(1) : '—'}</div>
                    </div>
                    <div className="rounded-lg border border-[#E4E1DC] p-3 bg-[#FAFAF9]">
                      <div className="text-xs text-[#6B7280] mb-0.5">Average OFF</div>
                      <div className="font-medium">{typeof r.offAvg === 'number' ? r.offAvg.toFixed(1) : '—'}</div>
                    </div>
                  </div>
                  {typeof r.onAvg === 'number' && typeof r.offAvg === 'number' && (
                    <div className="mt-2 text-xs text-[#4B5563]">
                      Difference: {(r.onAvg - r.offAvg >= 0 ? '+' : '') + (r.onAvg - r.offAvg).toFixed(1)}
                      {' '}({Math.round(((r.onAvg - r.offAvg) / Math.max(0.0001, r.offAvg)) * 100)}%)
                      {typeof r.daysOn === 'number' || typeof r.daysOff === 'number'
                        ? ` • Days ON/OFF: ${r.daysOn ?? '—'}/${r.daysOff ?? '—'}`
                        : ''}
                    </div>
                  )}
                </div>
              )}
              <div className="mt-3">
                <button
                  className="inline-flex items-center px-3 py-1.5 rounded-full border border-[#E4E1DC] text-xs font-medium text-[#111111] hover:bg-[#FAFAF9]"
                  onClick={() => { window.location.href = '/dashboard?checkin=open' }}
                >
                  {r.actionText}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-xl border border-[#E4E1DC] bg-white p-5">
          <div className="text-base font-semibold text-[#111111]">Summary</div>
          <div className="mt-2 text-sm text-[#4B5563]">
            Total stack cost: ${summary.totalYear}/year
          </div>
          {summary.saveYear > 0 && (
            <div className="mt-1 text-sm text-[#111111]">
              Recommended savings: ${summary.saveYear}/year by dropping ineffective supplements
            </div>
          )}
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <div className="text-xs font-semibold text-[#6B7280] uppercase mb-1">Keep</div>
              <ul className="list-disc list-inside text-sm text-[#111111]">
                {rows.filter(r => r.verdict === 'KEEP').map(r => <li key={`k-${r.id}`}>{r.name}</li>)}
              </ul>
            </div>
            <div>
              <div className="text-xs font-semibold text-[#6B7280] uppercase mb-1">Drop</div>
              <ul className="list-disc list-inside text-sm text-[#111111]">
                {rows.filter(r => r.verdict === 'DROP').map(r => <li key={`d-${r.id}`}>{r.name}</li>)}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-[#E4E1DC] bg-white p-5">
          <button
            className="text-sm font-semibold text-[#111111] flex items-center"
            onClick={() => setShowMethod(s => !s)}
          >
            How verdicts are determined
            <span className="ml-2 text-xs text-[#6B7280]">{showMethod ? 'Hide' : 'Show'}</span>
          </button>
          {showMethod && (
            <div className="mt-2 text-sm text-[#4B5563] space-y-2">
              <p>
                We compare your energy, focus, and sleep scores on days you take each supplement (ON) versus days you skip it (OFF), against your personal baseline.
              </p>
              <p>
                Confidence increases with more clean days and complete rotation cycles. Disruptions (poor sleep, illness, stress) are excluded so noise doesn&apos;t mislead results.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

