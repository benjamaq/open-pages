'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import PaywallModal from '../../components/billing/PaywallModal'
import StackPillGrid from '../../components/stack/StackPillGrid'

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
  primary_goal_tags?: string[] | null
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

type UiRow = {
  id: string
  name: string
  monthly: number | null
  yearly: number | null
  lifecycle: 'Active' | 'Working' | 'Not working' | 'No clear effect' | 'Archived'
  effectText?: string | null
  confidenceText?: string | null
  periodText?: string | null
  onAvg?: number | null
  offAvg?: number | null
  reqOn?: number | null
  reqOff?: number | null
  daysOn?: number | null
  daysOff?: number | null
}

export default function ResultsPage() {
  const [paid, setPaid] = useState<boolean | null>(null)
  const [openPaywall, setOpenPaywall] = useState(false)
  const [supps, setSupps] = useState<Supplement[]>([])
  const [effects, setEffects] = useState<Record<string, EffectRow | undefined>>({})
  const [loopById, setLoopById] = useState<Record<string, LoopRow>>({})
  const [showMethod, setShowMethod] = useState(false)
  const [filters, setFilters] = useState<Record<string, boolean>>({
    Active: true,
    Working: true,
    'Not working': false,
    'No clear effect': true,
    Archived: false
  })
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [showArchived, setShowArchived] = useState<boolean>(false)
  // UI-only pause/resume map for Cabinet view (id -> pausedAt ISO)
  const [paused, setPaused] = useState<Record<string, string>>({})
  // Edit modal state for dose/timing/brand
  const [editOpen, setEditOpen] = useState(false)
  const [editDraft, setEditDraft] = useState<{ id: string; dose: string; timing: string; brand: string; frequency: string }>({ id: '', dose: '', timing: '', brand: '', frequency: '' })
  const [savingEdit, setSavingEdit] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

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
        const r1 = await fetch('/api/supplements/current', { cache: 'no-store' })
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

  // Derive UI rows with lifecycle and summary fields
  const uiRows = useMemo<UiRow[]>(() => {
    return supps.map(s => {
      const e = effects[s.id]
      const l = loopById[s.id]
      const monthly = getMonthlyFromSupplement(s)
      const yearly = (monthly != null) ? Math.round(monthly * 12) : null
      const reqOn = l?.requiredOnDays ?? l?.requiredDays ?? null
      const reqOff = l?.requiredOffDays ?? (l?.requiredDays ? Math.min(5, Math.max(3, Math.round(l.requiredDays / 4))) : null)
      const daysOn = l?.daysOnClean ?? null
      const daysOff = l?.daysOffClean ?? null
      const isReady = Boolean(daysOn != null && daysOff != null && reqOn != null && reqOff != null && (daysOn as number) >= (reqOn as number) && (daysOff as number) >= (reqOff as number))
      const effCat = String(e?.effect_category || '').toLowerCase()
      const dir = String(e?.effect_direction || '').toLowerCase()
      const mag = typeof e?.effect_magnitude === 'number' ? e!.effect_magnitude! : null
      const signedMag = typeof mag === 'number' ? (dir === 'negative' ? -Math.abs(mag) : Math.abs(mag)) : null
      let lifecycle: UiRow['lifecycle'] = 'Active'
      if (isReady) {
        if (effCat === 'works' || (typeof signedMag === 'number' && signedMag > 0)) lifecycle = 'Working'
        else if (effCat === 'no_effect') lifecycle = 'No clear effect'
        else if (typeof signedMag === 'number' && signedMag < 0) lifecycle = 'Not working'
        else lifecycle = 'No clear effect'
      }
      const effectText = (() => {
        if (!isReady) return null
        if (typeof signedMag === 'number') {
          const pct = Math.round(signedMag)
          if (pct > 0) return `Clear positive effect: +${pct}%`
          if (pct < 0) return `Clear negative effect: ${pct}%`
        }
        if (effCat === 'no_effect') return 'No clear effect'
        return 'No clear effect'
      })()
      const confidenceText = (typeof e?.effect_confidence === 'number') ? `${Math.round(e!.effect_confidence!)}% confidence` : null
      const periodText = (() => {
        const onNum = typeof daysOn === 'number' ? daysOn as number : undefined
        const offNum = typeof daysOff === 'number' ? daysOff as number : undefined
        const roNum = typeof reqOn === 'number' ? reqOn as number : undefined
        const rfNum = typeof reqOff === 'number' ? reqOff as number : undefined
        const onStr = onNum != null ? (roNum != null ? (onNum >= roNum ? `Clean ON: ${onNum} ✓` : `Clean ON: ${onNum} of ${roNum}`) : `Clean ON: ${onNum}`) : null
        const offStr = offNum != null ? (rfNum != null ? (offNum >= rfNum ? `Clean OFF: ${offNum} ✓` : `Clean OFF: ${offNum} of ${rfNum}`) : `Clean OFF: ${offNum}`) : null
        if (!onStr && !offStr) return null
        return `${onStr || ''}${onStr && offStr ? ' • ' : ''}${offStr || ''}`
      })()
      return {
        id: s.id,
        name: s.name,
        monthly,
        yearly,
        lifecycle,
        effectText,
        confidenceText,
        periodText,
        onAvg: typeof e?.post_start_average === 'number' ? e!.post_start_average! : null,
        offAvg: typeof e?.pre_start_average === 'number' ? e!.pre_start_average! : null,
        reqOn, reqOff, daysOn, daysOff
      }
    })
  }, [supps, effects, loopById])

  const categories = useMemo<string[]>(() => {
    const set = new Set<string>()
    for (const s of supps) {
      const tags: any = (s as any).primary_goal_tags
      if (Array.isArray(tags)) {
        for (const t of tags) {
          const key = String(t || '').trim()
          if (key) set.add(key)
        }
      }
    }
    return Array.from(set).sort()
  }, [supps])

  const filtered = useMemo(() => {
    // For My Stack, we separate current (non-archived) and history (archived)
    return uiRows
  }, [uiRows])

  const ledgerSummary = useMemo(() => {
    const current = uiRows.filter(r => r.lifecycle !== 'Archived')
    const totalSupps = current.length
    const totalMonthly = current.reduce((sum, r) => sum + (typeof r.monthly === 'number' ? r.monthly : 0), 0)
    const by = (life: UiRow['lifecycle']) => uiRows.filter(r => r.lifecycle === life)
    const sumMonthly = (rs: UiRow[]) => rs.reduce((s, r) => s + (typeof r.monthly === 'number' ? r.monthly : 0), 0)
    const activeM = sumMonthly(by('Active'))
    const workingM = sumMonthly(by('Working'))
    const notM = sumMonthly(by('Not working'))
    const noEffM = sumMonthly(by('No clear effect'))
    const archivedCt = by('Archived').length
    // Potential savings rule: STRICT - Not working only
    const potentialSavings = Math.max(0, notM)
    return { totalSupps, totalMonthly, activeCt: by('Active').length, activeM, workingCt: by('Working').length, workingM, notCt: by('Not working').length, notM, noEffCt: by('No clear effect').length, noEffM, archivedCt, potentialSavings }
  }, [uiRows])

  const toggleFilter = (k: keyof typeof filters) => setFilters(prev => ({ ...prev, [k]: !prev[k] }))
  const toggleExpand = (id: string) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }))
  const fmtMoney = (n?: number | null) => {
    if (n == null || Number.isNaN(n)) return '—'
    const hasCents = Math.round((n % 1) * 100) !== 0
    const formatted = n.toLocaleString(undefined, { minimumFractionDigits: hasCents ? 2 : 0, maximumFractionDigits: 2 })
    return `$${formatted}/month`
  }
  const fmtYear = (n?: number | null) => {
    if (n == null || Number.isNaN(n)) return '—'
    const annual = Math.round(n * 12)
    return `$${annual.toLocaleString()}/yr`
  }
  const fmtCurrency = (n?: number | null) => {
    if (n == null || Number.isNaN(n)) return '—'
    const v = Number(n)
    const str = v < 10 ? v.toFixed(2) : Math.round(v).toString()
    return `$${str}`
  }
  // Field normalization helpers (dose/timing/price/branding)
  function getMonthlyFromSupplement(s: any): number | null {
    const cands = [
      s?.monthly_cost_usd,
      s?.monthly_cost,
      s?.price,
      s?.cost,
      s?.monthlyPrice,
      s?.monthly_cents ? Number(s.monthly_cents) / 100 : undefined,
    ]
    for (const v of cands) {
      const n = Number(v)
      if (Number.isFinite(n) && n > 0) return Math.max(0, Math.min(1000, n))
    }
    return null
  }
  function getDose(s: any): string | null {
    const v = s?.dose ?? s?.dosage ?? s?.serving_size ?? s?.serving ?? null
    if (v == null) return null
    const t = String(v).trim()
    return t.length ? t : null
  }
  function getFrequency(s: any): string | null {
    const v = s?.frequency ?? s?.freq ?? s?.interval ?? null
    if (v == null) return null
    const t = String(v).trim()
    const lc = t.toLowerCase()
    if (lc === 'qd' || lc === 'daily') return 'Daily'
    if (lc === 'bid' || lc === 'twice daily' || lc === '2x daily') return 'Twice daily'
    if (lc === 'tid' || lc === '3x daily') return 'Three times daily'
    return t[0]?.toUpperCase() ? t[0].toUpperCase() + t.slice(1) : t
  }
  function getTiming(s: any): string | null {
    const v = s?.timing ?? s?.time_of_day ?? s?.schedule ?? s?.when ?? null
    if (v == null) return null
    const t = String(v).trim()
    if (!t) return null
    const map: Record<string, string> = {
      morning: 'Morning', am: 'Morning',
      afternoon: 'Afternoon',
      evening: 'Evening', pm: 'Evening', night: 'Evening',
      'with food': 'With food', fed: 'With food',
      bedtime: 'Before bed',
      anytime: 'Any time', 'any time': 'Any time'
    }
    const lc = t.toLowerCase()
    return map[lc] ?? (t[0]?.toUpperCase() ? t[0].toUpperCase() + t.slice(1) : t)
  }
  function parseBrandAndShortName(s: any): { brand: string; shortName: string } {
    const raw = String(s?.name || '').trim()
    const explicitBrand = (s?.brand ? String(s.brand) : '').trim()
    const parts = raw.split(',').map((p: string) => p.trim()).filter(Boolean)
    // Prefer short name from part[1] if available
    let shortName = parts.length >= 2 ? parts[1] : raw
    // Brand: explicit field, else part[0]
    const brand = explicitBrand || (parts.length >= 2 ? parts[0] : '')
    // Remove brand prefix from shortName if it leaked in
    if (brand && shortName.toLowerCase().startsWith(brand.toLowerCase() + ' ')) {
      shortName = shortName.slice(brand.length).trim()
    }
    shortName = shortName
      .replace(/\b\d+\s?(mcg|mg|g|iu|ml|tbsp|caps?|capsules?|tabs?|tablets?|gummies|softgels?|pack(et)?|packet|count)\b/gi, '')
      .replace(/\b\d+\s?(servings?|ct)\b/gi, '')
      .replace(/\s{2,}/g, ' ')
      .trim()
    if (!shortName) shortName = raw.slice(0, 28)
    return { brand, shortName }
  }

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
          return { label: 'No clear effect', cls: 'bg-gray-100 text-gray-700 border border-gray-200' }
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
          contextLines.push(`No clear effect — ${inconc}`)
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
        if (distance === 'Ready for verdict') return 'View verdict'
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

  function abbrev(name: string): string {
    const n = String(name || '').trim()
    if (n.length <= 22) return n
    return n.slice(0, 20).trim() + '…'
  }

  function getCategoryFor(id: string): string {
    const sup = supps.find(s => s.id === id)
    const tags = Array.isArray((sup as any)?.primary_goal_tags) ? ((sup as any).primary_goal_tags as string[]) : []
    if (tags.length > 0) return String(tags[0] || '').trim() || 'General Wellness'
    return 'General Wellness'
  }

  function buildConstellationItems(ui: UiRow[], sups: Supplement[]): StackConstellationItem[] {
    return ui.map(r => {
      const status: StackConstellationItem['status'] =
        r.lifecycle === 'Active' ? 'Testing' :
        r.lifecycle === 'Working' ? 'Working' :
        r.lifecycle === 'Not working' ? 'Not working' :
        r.lifecycle === 'No clear effect' ? 'No clear effect' : 'Archived'
      return {
        id: r.id,
        name: r.name,
        shortName: abbrev(r.name),
        category: getCategoryFor(r.id),
        status,
        monthly: (typeof r.monthly === 'number' ? r.monthly : null),
        details: {
          onAvg: r.onAvg,
          offAvg: r.offAvg,
          daysOn: r.daysOn,
          daysOff: r.daysOff,
          reqOn: r.reqOn,
          reqOff: r.reqOff,
          confidenceText: r.confidenceText,
          effectText: r.effectText
        }
      }
    })
  }

  if (paid === null) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-gray-600">Loading…</div>
  }

  // Free access: Do not gate My Stack. Paid controls verdict visibility below.

  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-50">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
          <a href="/dashboard" className="text-sm text-slate-700 hover:underline">← Back to Dashboard</a>
          <div className="text-sm font-semibold text-slate-900">My Stack</div>
          <div />
        </div>
      </header>
      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-semibold text-[#111111]">My Stack</h1>

        {/* Today's Protocol */}
        <div className="mt-6 section-todays-protocol">
          {(() => {
            const active = uiRows.filter(r => {
              const s = supps.find(x => x.id === r.id) as any
              const isActive = (s as any)?.is_active !== false
              return r.lifecycle !== 'Archived' && isActive && !paused[r.id]
            })
            // Debug monthly inputs
            try {
              console.log('[results] Active monthly inputs:', active.map(r => ({ id: r.id, name: r.name, monthly: r.monthly })))
            } catch {}
            const monthly = active.reduce((s, r) => s + (typeof r.monthly === 'number' ? r.monthly : 0), 0)
            const daily = monthly / 30
            const includedIds = active.map(r => r.id)
            try {
              console.log('[results] Totals: daily=', daily, 'monthly=', monthly, 'included=', includedIds)
            } catch {}
            const potentialSavingsYear = Math.round(uiRows.filter(r => {
              const s = supps.find(x => x.id === r.id) as any
              const isActive = (s as any)?.is_active !== false
              return r.lifecycle === 'Not working' && isActive && !paused[r.id]
            }).reduce((s, r) => s + (typeof r.monthly === 'number' ? r.monthly : 0), 0) * 12)
            return (
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <div className="section-header">Today&apos;s Protocol</div>
                  <div className="section-subtitle">
                    {active.length} {active.length === 1 ? 'supplement' : 'supplements'} to take today
                  </div>
                </div>
                <div className="text-right">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <div className="text-xs text-[#6B7280] uppercase">Today</div>
                      <div className="text-xl font-semibold text-[#111111]">{fmtCurrency(daily)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-[#6B7280] uppercase">This Month</div>
                      <div className="text-xl font-semibold text-[#111111]">{fmtMoney(monthly)}</div>
                    </div>
                  </div>
                  {potentialSavingsYear > 0 && (
                    <div className="mt-1 text-xs text-[#6B7280]">Potential savings: ${potentialSavingsYear.toLocaleString()}/year</div>
                  )}
                </div>
              </div>
            )
          })()}
          <div className="rounded-lg bg-white border border-[#E4E1DC]">
            {/* Protocol column headers for clarity */}
            <div className="protocol-row" style={{ fontSize: 12, color: '#6B7280' }}>
              <div className="supplement-name uppercase tracking-wide">Supplement</div>
              <div className="brand-name uppercase tracking-wide">Brand</div>
              <div className="dosewhen uppercase tracking-wide text-right">Dose • When</div>
            </div>
            {uiRows.filter(u => {
              const s = supps.find(x => x.id === u.id) as any
              const isActive = (s as any)?.is_active !== false
              return u.lifecycle !== 'Archived' && isActive && !paused[u.id]
            }).map(r => {
              const s = supps.find(x => x.id === r.id) as any
              const { brand, shortName } = parseBrandAndShortName(s)
              let dose = getDose(s)
              // If dose is purely numeric (legacy), add 'x' to improve clarity
              if (dose && /^\d+(\.\d+)?$/.test(dose)) dose = `${dose}x`
              const freq = getFrequency(s)
              const timingRaw = getTiming(s)
              const parts: string[] = []
              if (dose) parts.push(dose)
              if (freq) parts.push(freq)
              if (timingRaw) parts.push(timingRaw)
              const doseWhen = parts.length ? parts.join(' • ') : '—'
                return (
                <div key={r.id} className="protocol-row">
                  <div className="supplement-name truncate">{shortName || r.name}</div>
                  <div className="brand-name truncate">{brand || '—'}</div>
                  <div className="dosewhen">{doseWhen}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Testing Pipeline (one line if close to verdict) */}
        {(() => {
          const close = uiRows
            .filter(r => r.lifecycle === 'Active' && !paused[r.id])
            .filter(r => {
              const l = loopById[r.id]
              const done = (l?.daysOnClean ?? 0) + (l?.daysOffClean ?? 0)
              const need = (l?.requiredOnDays ?? l?.requiredDays ?? 0) + (l?.requiredOffDays ?? 0)
              return need > 0 && (done / need) >= 0.8
            })
          if (close.length === 0) return null
          if (close.length === 1) {
            const r = close[0]; const l = loopById[r.id]
            const needOff = Math.max(0, (l?.requiredOffDays ?? 0) - (l?.daysOffClean ?? 0))
            return <div className="mt-3 text-sm text-[#C65A2E]">Next up: {r.name} needs {needOff} more OFF day{needOff === 1 ? '' : 's'}</div>
          }
          return <div className="mt-3 text-sm text-[#C65A2E]">Next up: {close.length} supplements close to verdict</div>
        })()}

        {/* Your Active Stack — Tile Grid (gold borders) */}
        <div className="mt-6 section-active-stack">
          <div className="mb-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="section-header">Your Active Stack</div>
                <div className="section-subtitle">
                  {uiRows.filter(u => {
                    const s = supps.find(x => x.id === u.id) as any
                    const isActive = (s as any)?.is_active !== false
                    return u.lifecycle !== 'Archived' && isActive && !paused[u.id]
                  }).length} supplements you&apos;re currently testing
                </div>
              </div>
              {(() => {
                const active = uiRows.filter(r => {
                  const s = supps.find(x => x.id === r.id) as any
                  const isActive = (s as any)?.is_active !== false
                  return r.lifecycle !== 'Archived' && isActive && !paused[r.id]
                })
                const monthly = active.reduce((s, r) => s + (typeof r.monthly === 'number' ? r.monthly : 0), 0)
                const yearly = Math.round(monthly * 12)
                return (
                  <div className="text-right">
                    <div className="text-xs text-[#6B7280] uppercase">This Year</div>
                    <div className="text-xl font-semibold text-[#111111]">${yearly.toLocaleString()}</div>
                  </div>
                )
              })()}
            </div>
          </div>
          {categories.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {['All', ...categories].map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat === 'All' ? null : cat)}
                  className={`text-xs px-3 py-1.5 rounded-full border ${(!categoryFilter && cat==='All') || categoryFilter===cat ? 'bg-[#111111] text-white border-[#111111]' : 'bg-white text-[#111111] border-[#E4E1DC]'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {uiRows
              .filter(r => {
                const s = supps.find(x => x.id === r.id) as any
                const isActive = (s as any)?.is_active !== false
                return r.lifecycle !== 'Archived' && isActive && !paused[r.id]
              })
              .filter(r => !categoryFilter || getCategoryFor(r.id) === categoryFilter)
              .map(r => {
                const s = supps.find(x => x.id === r.id) as any
                const cat = getCategoryFor(r.id) || 'General'
                const brand = s?.brand ? String(s.brand) : parseBrandAndShortName(s).brand
                const dose = getDose(s)
                const freq = getFrequency(s)
                const timing = getTiming(s)
                // Start date: prefer started_at, else created_at, else fallback to 0 days
                const startIso = (s?.started_at as string) || (s?.created_at as string) || ''
                const startDate = startIso ? new Date(startIso) : null
                const daysOnStack = startDate ? Math.max(0, Math.round((Date.now()- +startDate)/86400000)) : ((loopById[r.id]?.daysOnClean ?? 0) + (loopById[r.id]?.daysOffClean ?? 0))
                // Mask verdicts for free users
                const showVerdict = paid === true
                const statusLabel = showVerdict ? (r.lifecycle === 'Active' ? 'Testing' : r.lifecycle) : 'Testing'
                const statusIcon = showVerdict
                  ? (r.lifecycle === 'Active' ? '●' : r.lifecycle === 'Working' ? '✓' : r.lifecycle === 'Not working' ? '✗' : '○')
                  : '●'
                const monthlyCost = typeof r.monthly === 'number' ? r.monthly : 0
                return (
                  <div key={r.id} className="current-tile">
                    <div className="tile-body flex-1 flex flex-col">
                      <div className="flex items-start justify-between">
                        <div className="text-[11px] uppercase tracking-wide text-[#6B7280]">{cat}</div>
                        <div className="text-[12px]">
                          <span className="mr-1" style={{ color: (r.lifecycle==='Active' ? '#C65A2E' : r.lifecycle==='Working' ? '#22C55E' : r.lifecycle==='Not working' ? '#EF4444' : '#6B7280') }}>
                            {statusIcon}
                          </span>
                          <span className="text-[#4B5563]">{statusLabel}</span>
                        </div>
                      </div>
                      <div className="mt-2">
                        <div className="text-[16px] font-semibold text-[#111] line-clamp-2">{r.name}</div>
                        {brand ? <div className="text-[13px] text-[#6B7280]">{brand}</div> : null}
                      </div>
                      <div className="mt-2 text-[13px] text-[#4B5563]">
                        {(() => {
                          const parts: string[] = []
                          if (dose) parts.push(String(dose))
                          if (freq) parts.push(String(freq))
                          if (timing) parts.push(String(timing))
                          if (parts.length) return parts.join(' • ')
                          return (
                            <button
                              className="text-[#6B7280] underline"
                              onClick={() => {
                                // Debug logging to trace id resolution
                                try {
                                  // eslint-disable-next-line no-console
                                  console.log('Add dose info clicked - r:', r)
                                  // eslint-disable-next-line no-console
                                  console.log('Add dose info clicked - r.id:', (r as any)?.id)
                                } catch {}
                                const s0 = supps.find(x => x.id === (r as any)?.id)
                                try {
                                  // eslint-disable-next-line no-console
                                  console.log('Add dose info clicked - s0:', s0)
                                  // eslint-disable-next-line no-console
                                  console.log('Add dose info clicked - s0?.id:', (s0 as any)?.id)
                                } catch {}
                                const supplementId = (r as any)?.id || (s0 as any)?.id
                                try {
                                  // eslint-disable-next-line no-console
                                  console.log('Final supplementId (add dose):', supplementId)
                                } catch {}
                                if (!supplementId) {
                                  alert('Error: Could not find supplement ID')
                                  return
                                }
                                const base = s0 as any
                                setEditDraft({
                                  id: String(supplementId),
                                  dose: getDose(base) || '',
                                  timing: getTiming(base) || '',
                                  brand: base?.brand || parseBrandAndShortName(base).brand || '',
                                  frequency: getFrequency(base) || ''
                                })
                                setEditOpen(true)
                              }}
                            >
                              Add dose info →
                            </button>
                          )
                        })()}
                      </div>
                      <div className="mt-2 text-[13px] text-[#4B5563]">
                        {(() => {
                          if (daysOnStack === 0) {
                            return 'Started today'
                          }
                          const since = startDate
                            ? `Since ${startDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
                            : 'Since today'
                          const daysText = `Taking for ${daysOnStack} day${daysOnStack===1?'':'s'}`
                          return `${since} • ${daysText}`
                        })()}
                      </div>
                      <div className="mt-2 text-[13px]">
                        {showVerdict ? (
                          r.lifecycle === 'Active'
                            ? <span className="text-[#6B7280]">Testing in progress</span>
                            : (
                              <>
                                <div className={r.effectText?.includes('-') ? 'text-[#991B1B]' : (r.effectText ? 'text-[#166534]' : 'text-[#6B7280]')}>{r.effectText || 'No measurable change'}</div>
                                {r.confidenceText && <div className="text-[#6B7280]">{r.confidenceText}</div>}
                              </>
                            )
                        ) : (
                          <span className="text-[#6B7280]">Testing in progress</span>
                        )}
                      </div>
                    </div>
                    <div className="mt-auto pt-3 tile-footer flex flex-col items-start gap-2">
                      <div className="text-[13px] text-[#111111]">{`$${(monthlyCost || 0).toLocaleString()}/month`}</div>
                      <div className="flex items-center gap-3">
                        <button
                          className="text-xs underline text-[#111111] hover:text-[#000000]"
                          onClick={() => {
                            try {
                              // eslint-disable-next-line no-console
                              console.log('Edit clicked - r:', r)
                              // eslint-disable-next-line no-console
                              console.log('Edit clicked - r.id:', (r as any)?.id)
                            } catch {}
                            const s0 = supps.find(x => x.id === (r as any)?.id) as any
                            try {
                              // eslint-disable-next-line no-console
                              console.log('Edit clicked - s0:', s0)
                              // eslint-disable-next-line no-console
                              console.log('Edit clicked - s0?.id:', s0?.id)
                            } catch {}
                            const supplementId = (r as any)?.id || s0?.id
                            try {
                              // eslint-disable-next-line no-console
                              console.log('Final supplementId (edit):', supplementId)
                            } catch {}
                            if (!supplementId) {
                              alert('Error: Could not find supplement ID')
                              return
                            }
                            setEditDraft({
                              id: String(supplementId),
                              dose: getDose(s0) || '',
                              timing: getTiming(s0) || '',
                              brand: s0?.brand || parseBrandAndShortName(s0).brand || '',
                              frequency: getFrequency(s0) || ''
                            })
                            setEditOpen(true)
                          }}
                        >
                          Edit
                        </button>
                        <button
                          className="text-xs underline text-[#111111] hover:text-[#000000]"
                          onClick={async () => {
                            try {
                              await fetch(`/api/supplements/${encodeURIComponent(r.id)}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ is_active: false })
                              })
                              setSupps(prev => prev.map(su => su.id === r.id ? { ...su, is_active: false } as any : su))
                            } catch {}
                          }}
                        >
                          Pause
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
          </div>
        </div>

        {/* On the Bench — Tile Grid (muted) */}
        <div className="mt-8 section-on-bench">
          <div className="mb-3">
            <div className="section-header">On the Bench</div>
            <div className="section-subtitle">
              {uiRows.filter(r => r.lifecycle === 'Archived').length + Object.keys(paused).length} supplements paused or stopped
            </div>
          </div>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {uiRows
              .filter(r => {
                const s = supps.find(x => x.id === r.id) as any
                const isInactive = (s as any)?.is_active === false
                return r.lifecycle === 'Archived' || paused[r.id] || isInactive
              })
              .map(r => {
                const s = supps.find(x => x.id === r.id) as any
                const cat = getCategoryFor(r.id) || 'General'
                const brand = s?.brand ? String(s.brand) : parseBrandAndShortName(s).brand
                const dose = getDose(s)
                const freq = getFrequency(s)
                const timing = getTiming(s)
                const yearly = (r.monthly ?? 0) * 12
                return (
                  <div key={r.id} className="inactive-tile">
                    <div className="tile-body flex-1 flex flex-col">
                      <div className="flex items-start justify-between">
                        <div className="text-[11px] uppercase tracking-wide text-[#6B7280]">{cat}</div>
                        <div className="text-[12px] text-[#6B7280]">{paused[r.id] ? 'Paused' : 'Archived'}</div>
                      </div>
                      <div className="mt-2">
                        <div className="text-[16px] font-semibold text-[#111] line-clamp-2">{r.name}</div>
                        {brand ? <div className="text-[13px] text-[#6B7280]">{brand}</div> : null}
                      </div>
                      <div className="mt-2 text-[13px] text-[#6B7280]">
                        {(() => {
                          const parts: string[] = []
                          let prettyDose = dose
                          if (prettyDose && /^\d+(\.\d+)?$/.test(prettyDose)) prettyDose = `${prettyDose}x`
                          if (prettyDose) parts.push(String(prettyDose))
                          if (freq) parts.push(String(freq))
                          if (timing) parts.push(String(timing))
                          if (parts.length) return parts.join(' • ')
                          return (
                            <button
                              className="text-[#6B7280] underline"
                              onClick={() => {
                                try {
                                  // eslint-disable-next-line no-console
                                  console.log('Add dose info (inactive) clicked - r:', r)
                                  // eslint-disable-next-line no-console
                                  console.log('Add dose info (inactive) clicked - r.id:', (r as any)?.id)
                                } catch {}
                                const s0 = supps.find(x => x.id === (r as any)?.id) as any
                                try {
                                  // eslint-disable-next-line no-console
                                  console.log('Add dose info (inactive) clicked - s0:', s0)
                                  // eslint-disable-next-line no-console
                                  console.log('Add dose info (inactive) clicked - s0?.id:', s0?.id)
                                } catch {}
                                const supplementId = (r as any)?.id || s0?.id
                                try {
                                  // eslint-disable-next-line no-console
                                  console.log('Final supplementId (inactive add dose):', supplementId)
                                } catch {}
                                if (!supplementId) {
                                  alert('Error: Could not find supplement ID')
                                  return
                                }
                                setEditDraft({
                                  id: String(supplementId),
                                  dose: getDose(s0) || '',
                                  timing: getTiming(s0) || '',
                                  brand: s0?.brand || parseBrandAndShortName(s0).brand || '',
                                  frequency: getFrequency(s0) || ''
                                })
                                setEditOpen(true)
                              }}
                            >
                              Add dose info →
                            </button>
                          )
                        })()}
                      </div>
                    </div>
                    <div className="mt-auto pt-3 flex items-center justify-between tile-footer">
                      <div className="text-[13px] text-[#6B7280]">{`Was $${(typeof r.monthly === 'number' ? r.monthly : 0).toLocaleString()}/month`}</div>
                      { (paused[r.id] || (s as any)?.is_active === false) && (
                        <button
                          className="text-xs underline text-[#111111] hover:text-[#000000]"
                          onClick={async () => {
                            try {
                              await fetch(`/api/supplements/${encodeURIComponent(r.id)}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ is_active: true })
                              })
                              setSupps(prev => prev.map(su => su.id === r.id ? { ...su, is_active: true } as any : su))
                              setPaused(p => { const next = { ...p }; delete next[r.id]; return next })
                            } catch {}
                          }}
                        >
                          Resume
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
          </div>
        </div>

        <style jsx>{`
          .section-todays-protocol {
            background: #FFFFFF;
            border-left: 4px solid #C65A2E;
            border-radius: 12px;
            padding: 24px;
            margin-bottom: 24px;
          }
          .section-active-stack {
            background: #FFFFFF;
            border-left: 4px solid #C9A227;
            border-radius: 12px;
            padding: 24px;
            margin-bottom: 24px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.04);
          }
          .section-on-bench {
            background: #FFFFFF;
            border-left: 4px solid #9CA3AF;
            border-radius: 12px;
            padding: 24px;
          }
          .section-header {
            font-size: 24px;
            font-weight: 700;
            color: #1F2937;
            margin-bottom: 4px;
            border-left: 4px solid #C9A227; /* default; overridden per section below */
            padding-left: 16px;
          }
          .section-subtitle {
            font-size: 14px;
            color: #6B7280;
            margin-bottom: 16px;
          }
          .protocol-row {
            display: grid;
            grid-template-columns: 1fr 150px 180px;
            gap: 16px;
            padding: 12px 16px;
            border-bottom: 1px solid #E5E1DC;
            align-items: center;
          }
          .protocol-row:last-child { border-bottom: 0; }
          .supplement-name { font-weight: 500; color: #1F2937; }
          .brand-name { color: #9CA3AF; }
          .dosewhen { color: #1F2937; text-align: right; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          .current-tile {
            border: 1.5px solid #C9A227;
            border-radius: 10px;
            background: #FFFFFF;
            padding: 16px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.06);
            display: flex;
            flex-direction: column;
            min-height: 300px;
            overflow: hidden;
          }
          .inactive-tile {
            border: 1.5px solid #D1D5DB;
            border-radius: 10px;
            background: #FFFFFF;
            padding: 16px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.04);
            opacity: 0.92;
            display: flex;
            flex-direction: column;
            min-height: 260px;
            overflow: hidden;
          }
          .tile-footer button { white-space: nowrap; }
          /* Header accent line colors per section */
          .section-todays-protocol .section-header { border-left-color: #C65A2E; }
          .section-active-stack .section-header { border-left-color: #C9A227; }
          .section-on-bench .section-header { border-left-color: #9CA3AF; }
        `}</style>

        

        {/* HERO: Pill Grid */}
        {false && (
          <div className="mt-4">
            <StackPillGrid
              items={uiRows.filter(u => u.lifecycle !== 'Archived').map(u => ({
                id: u.id,
                name: u.name,
                category: getCategoryFor(u.id),
                status: (u.lifecycle === 'Active' ? 'Testing' : (u.lifecycle as any)),
                monthly: (typeof u.monthly === 'number' ? u.monthly : null),
                details: { onAvg: u.onAvg, offAvg: u.offAvg, daysOn: u.daysOn, daysOff: u.daysOff, reqOn: u.reqOn, reqOff: u.reqOff, confidenceText: u.confidenceText, effectText: u.effectText }
              })) as any}
              fmtMoney={fmtMoney}
              title={`${uiRows.filter(u => u.lifecycle !== 'Archived').length} supplements in your active stack`}
              enableFilters
            />
          </div>
        )}

        {/* Current Stack — Category Shelves with label tiles, contained background (Ledger view) */}
        {false && (
        <div className="mt-8 rounded-xl bg-[#F9F8F6] p-4 sm:p-5">
        {(() => {
          const getCategory = (id: string): string => {
            const sup = supps.find(s => s.id === id)
            const tags = Array.isArray((sup as any)?.primary_goal_tags) ? ((sup as any).primary_goal_tags as string[]) : []
            if (tags.length > 0) return String(tags[0] || '').trim() || 'General Wellness'
            return 'General Wellness'
          }
          const byCat: Record<string, (UiRow & { brand?: string | null })[]> = {}
          for (const r of uiRows.filter(x => x.lifecycle !== 'Archived')) {
            const cat = getCategory(r.id)
            if (!byCat[cat]) byCat[cat] = []
            const sup = supps.find(s => s.id === r.id)
            const brand = (sup && typeof (sup as any).brand === 'string') ? (sup as any).brand as string : null
            byCat[cat].push({ ...r, brand })
          }
          const catEntriesAll = Object.entries(byCat)
            .filter(([_, rows]) => rows.length > 0)
            .sort((a, b) => a[0].localeCompare(b[0]))
          const bigCats = catEntriesAll.filter(([_, rows]) => rows.length >= 3)
          const smallCats = catEntriesAll.filter(([_, rows]) => rows.length <= 2)

          if (catEntriesAll.length === 0) {
            return (
              <div className="mt-6 text-sm text-[#6B7280]">
                Add supplements to start building your protocol.
              </div>
            )
          }
          return (
            <div className="mt-2">
              <div className="text-xs font-semibold text-[#6B7280] uppercase mb-2">Current Stack</div>
              {bigCats.map(([cat, rows]) => {
                const count = rows.length
                return (
                  <div key={cat} className="mb-8">
                    <div className="shelf-header inline-block bg-[#F0EDE8] px-3 py-2 rounded-md text-[12px] font-bold tracking-wide uppercase mb-3 text-[#4B5563]">
                      {cat} <span className="text-[#6B7280] font-normal">• {count} {count === 1 ? 'supplement' : 'supplements'}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {(['Working','Not working','No clear effect','Active'] as const).flatMap(group => (
                        rows
                          .filter(r => r.lifecycle === group)
                          .map(r => {
                            const openItem = expanded[`item:${r.id}`]
                            const status = group === 'Active' ? 'Testing' : group
                            const statusColor = group === 'Working' ? '#22C55E' : group === 'Not working' ? '#EF4444' : group === 'No clear effect' ? '#6B7280' : '#C65A2E'
                            const on = r.daysOn ?? 0
                            const off = r.daysOff ?? 0
                            const ro = r.reqOn ?? 0
                            const rf = r.reqOff ?? 0
                            const needOff = Math.max(0, rf - off)
                            const micro = (() => {
                              if (group === 'Active') {
                                const onPart = ro ? (on >= ro ? `ON ${on} ✓` : `ON ${on} of ${ro}`) : `ON ${on}`
                                const offPart = rf ? (off >= rf ? `OFF ${off} ✓` : `OFF ${off} of ${rf}`) : `OFF ${off}`
                                const needPart = rf ? ` • Need ${needOff} OFF` : ''
                                return `${onPart} • ${offPart}${needPart}`
                              }
                              if (group === 'Working') return `${r.effectText ? r.effectText.replace('Clear positive effect: ', '+') : 'Positive signal'}${r.confidenceText ? ` • ${r.confidenceText.replace(' confidence',' conf')}` : ''}`
                              if (group === 'Not working') return `Negative signal${r.confidenceText ? ` • ${r.confidenceText.replace(' confidence',' conf')}` : ''}`
                              if (group === 'No clear effect') return `No measurable change${r.confidenceText ? ` • ${r.confidenceText.replace(' confidence',' conf')}` : ''}`
                              return ''
                            })()
                            const brandText = (r as any).brand ? String((r as any).brand) : null
                            return (
                              <div key={r.id} className="relative">
                                <div
                                  className={`relative rounded-[12px] overflow-hidden transition-all duration-200 hover:-translate-y-[3px] shadow-[0_2px_4px_rgba(0,0,0,0.06),0_4px_12px_rgba(0,0,0,0.10)] hover:shadow-[0_6px_12px_rgba(0,0,0,0.10),0_12px_24px_rgba(0,0,0,0.12)] border`}
                                  style={{ borderColor: 'rgba(0,0,0,0.06)' }}
                                >
                                  {/* Header band with status */}
                                  <div className="px-[14px] py-[10px] text-[11px] font-bold tracking-wide uppercase" style={{ backgroundColor: statusColor, color: '#FFFFFF' }}>
                                    <div className="flex items-center justify-between">
                                      <div className="opacity-0 select-none">_</div>
                                      <div>{status}</div>
                                    </div>
                                  </div>
                                  <div className="bg-white px-4 py-3">
                                  {/* Name block */}
                                    <div className="text-[16px] font-semibold text-[#111111] line-clamp-2">{r.name}</div>
                                    {brandText && <div className="text-[13px] text-[#6B7280] mt-0.5">{brandText}</div>}
                                    <div className="border-t border-dashed mt-3 mb-3" style={{ borderColor: '#E5E1DC' }} />
                                  {/* Micro-metrics */}
                                    <div>
                                    <div className="flex items-center justify-between text-[13px] text-[#6B7280]">
                                      <div className="truncate">{micro}</div>
                                      <div className="text-[#111111] ml-2 shrink-0">{fmtMoney(r.monthly)}</div>
                                    </div>
                                    </div>
                                  {/* Footer action */}
                                    <div className="pt-3">
                                    <div className="flex items-center justify-end">
                                      <button onClick={() => toggleExpand(`item:${r.id}`)} className="text-xs text-[#111111] underline">
                                        {openItem ? 'Hide ›' : 'View ›'}
                                      </button>
                                    </div>
                                    </div>
                                  {/* Expanded content */}
                                  {openItem && (
                                      <div className="pt-3">
                                      {group === 'Active' ? (
                                        <>
                                          <div className="text-xs font-semibold text-[#6B7280] uppercase mb-2">Progress Evidence</div>
                                          {(typeof r.daysOn === 'number' || typeof r.daysOff === 'number') && (
                                            <div className="text-xs text-[#4B5563]">
                                              {(() => {
                                                const onTxt = (r.reqOn != null && r.daysOn != null)
                                                  ? (r.daysOn >= (r.reqOn as number) ? `Clean ON: ${r.daysOn} ✓` : `Clean ON: ${r.daysOn} of ${r.reqOn}`)
                                                  : (r.daysOn != null ? `Clean ON: ${r.daysOn}` : null)
                                                const offTxt = (r.reqOff != null && r.daysOff != null)
                                                  ? (r.daysOff >= (r.reqOff as number) ? `Clean OFF: ${r.daysOff} ✓` : `Clean OFF: ${r.daysOff} of ${r.reqOff}`)
                                                  : (r.daysOff != null ? `Clean OFF: ${r.daysOff}` : null)
                                                const need = (typeof r.reqOff === 'number' && typeof r.daysOff === 'number') ? Math.max(0, (r.reqOff as number) - (r.daysOff as number)) : null
                                                return `${onTxt ?? ''}${onTxt && offTxt ? ' • ' : ''}${offTxt ?? ''}${need != null ? ` • Verdict after: ${need} more OFF day${need === 1 ? '' : 's'}` : ''}`
                                              })()}
                                            </div>
                                          )}
                                          {(typeof r.onAvg === 'number' || typeof r.offAvg === 'number') ? (
                                            <div className="mt-2 grid grid-cols-2 gap-3">
                                              <div className="rounded-lg border border-[#E4E1DC] p-3 bg-white">
                                                <div className="text-xs text-[#6B7280] mb-0.5">Average ON</div>
                                                <div className="font-medium">{typeof r.onAvg === 'number' ? r.onAvg.toFixed(1) : '—'}</div>
                                              </div>
                                              <div className="rounded-lg border border-[#E4E1DC] p-3 bg-white">
                                                <div className="text-xs text-[#6B7280] mb-0.5">Average OFF</div>
                                                <div className="font-medium">{typeof r.offAvg === 'number' ? r.offAvg.toFixed(1) : '—'}</div>
                                              </div>
                                            </div>
                                          ) : (
                                            <div className="mt-2 text-xs text-[#4B5563]">Not enough clean days yet to compare ON vs OFF.</div>
                                          )}
                                          <div className="mt-3">
                                            <button className="px-3 py-1.5 rounded border border-[#E4E1DC] text-xs hover:bg-white" onClick={() => alert('Stop testing (stub)')}>Stop Testing</button>
                                          </div>
                                        </>
                                      ) : (
                                        <>
                                          <div className="text-xs font-semibold text-[#6B7280] uppercase mb-2">Evidence Summary</div>
                                          {(typeof r.onAvg === 'number' || typeof r.offAvg === 'number') ? (
                                            <div className="grid grid-cols-2 gap-3">
                                              <div className="rounded-lg border border-[#E4E1DC] p-3 bg-white">
                                                <div className="text-xs text-[#6B7280] mb-0.5">Average ON</div>
                                                <div className="font-medium">{typeof r.onAvg === 'number' ? r.onAvg.toFixed(1) : '—'}</div>
                                              </div>
                                              <div className="rounded-lg border border-[#E4E1DC] p-3 bg-white">
                                                <div className="text-xs text-[#6B7280] mb-0.5">Average OFF</div>
                                                <div className="font-medium">{typeof r.offAvg === 'number' ? r.offAvg.toFixed(1) : '—'}</div>
                                              </div>
                                            </div>
                                          ) : (
                                            <div className="text-xs text-[#4B5563]">ON/OFF averages not available yet.</div>
                                          )}
                                          {(typeof r.daysOn === 'number' || typeof r.daysOff === 'number') && (
                                            <div className="mt-2 text-xs text-[#4B5563]">
                                              {(() => {
                                                const onTxt = (r.reqOn != null && r.daysOn != null)
                                                  ? (r.daysOn >= (r.reqOn as number) ? `Clean ON: ${r.daysOn} ✓` : `Clean ON: ${r.daysOn} of ${r.reqOn}`)
                                                  : (r.daysOn != null ? `Clean ON: ${r.daysOn}` : null)
                                                const offTxt = (r.reqOff != null && r.daysOff != null)
                                                  ? (r.daysOff >= (r.reqOff as number) ? `Clean OFF: ${r.daysOff} ✓` : `Clean OFF: ${r.daysOff} of ${r.reqOff}`)
                                                  : (r.daysOff != null ? `Clean OFF: ${r.daysOff}` : null)
                                                return `${onTxt ?? ''}${onTxt && offTxt ? ' • ' : ''}${offTxt ?? ''}`
                                              })()}
                                            </div>
                                          )}
                                          <div className="mt-2 text-xs text-[#4B5563]">
                                            {(group === 'Working' && 'Recommendation: Keep taking.') ||
                                             (group === 'Not working' && `Recommendation: Consider stopping${(typeof r.monthly === 'number' && r.monthly > 0) ? ` to save ${fmtMoney(r.monthly)}` : ''}.`) ||
                                             (group === 'No clear effect' && 'Recommendation: Optional — stop if simplifying your stack.')}
                                          </div>
                                          <div className="mt-3 flex flex-wrap gap-2 text-xs">
                                            {group === 'Working' && <button className="px-3 py-1.5 rounded border border-[#E4E1DC] hover:bg-white" onClick={() => alert('Archive (stub)')}>Archive</button>}
                                            {group === 'Not working' && (
                                              <>
                                                <button className="px-3 py-1.5 rounded border border-[#E4E1DC] hover:bg-white" onClick={() => alert('Stop taking (stub)')}>Stop Taking</button>
                                                <button className="px-3 py-1.5 rounded border border-[#E4E1DC] hover:bg-white" onClick={() => alert('Retest (stub)')}>Retest</button>
                                              </>
                                            )}
                                            {group === 'No clear effect' && (
                                              <>
                                                <button className="px-3 py-1.5 rounded border border-[#E4E1DC] hover:bg-white" onClick={() => alert('Keep anyway (stub)')}>Keep Anyway</button>
                                                <button className="px-3 py-1.5 rounded border border-[#E4E1DC] hover:bg-white" onClick={() => alert('Stop (stub)')}>Stop</button>
                                              </>
                                            )}
                                          </div>
                                        </>
                                      )}
                                      </div>
                                  )}
                                  </div>
                                </div>
                              </div>
                            )
                          })
                      ))}
                    </div>
                  </div>
                )
              })}
              {/* Other Supplements section (small categories combined) */}
              {smallCats.length > 0 && (
                <div className="mb-2">
                  <div className="shelf-header inline-block bg-[#F0EDE8] px-3 py-2 rounded-md text-[12px] font-bold tracking-wide uppercase mb-3 text-[#4B5563]">
                    Other Supplements
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {(['Working','Not working','No clear effect','Active'] as const).flatMap(group => {
                      const rows = smallCats.flatMap(([cat, list]) => list.filter(r => r.lifecycle === group).map(r => ({ r, cat })))
                      return rows.map(({ r, cat }) => {
                        const openItem = expanded[`item:${r.id}`]
                        const groupText = group === 'Active' ? 'Testing' : group
                        const statusColor = group === 'Working' ? '#22C55E' : group === 'Not working' ? '#EF4444' : group === 'No clear effect' ? '#6B7280' : '#C65A2E'
                        const on = r.daysOn ?? 0, off = r.daysOff ?? 0, ro = r.reqOn ?? 0, rf = r.reqOff ?? 0
                        const needOff = Math.max(0, rf - off)
                        const micro = (() => {
                          if (group === 'Active') {
                            const onPart = ro ? (on >= ro ? `ON ${on} ✓` : `ON ${on} of ${ro}`) : `ON ${on}`
                            const offPart = rf ? (off >= rf ? `OFF ${off} ✓` : `OFF ${off} of ${rf}`) : `OFF ${off}`
                            const needPart = rf ? ` • Need ${needOff} OFF` : ''
                            return `${onPart} • ${offPart}${needPart}`
                          }
                          if (group === 'Working') return `${r.effectText ? r.effectText.replace('Clear positive effect: ', '+') : 'Positive signal'}${r.confidenceText ? ` • ${r.confidenceText.replace(' confidence',' conf')}` : ''}`
                          if (group === 'Not working') return `Negative signal${r.confidenceText ? ` • ${r.confidenceText.replace(' confidence',' conf')}` : ''}`
                          if (group === 'No clear effect') return `No measurable change${r.confidenceText ? ` • ${r.confidenceText.replace(' confidence',' conf')}` : ''}`
                          return ''
                        })()
                        const brandText = (r as any).brand ? String((r as any).brand) : null
                        return (
                          <div key={`${cat}:${r.id}`} className="relative">
                            <div
                              className={`relative rounded-[12px] overflow-hidden transition-all duration-200 hover:-translate-y-[3px] shadow-[0_2px_4px_rgba(0,0,0,0.06),0_4px_12px_rgba(0,0,0,0.10)] hover:shadow-[0_6px_12px_rgba(0,0,0,0.10),0_12px_24px_rgba(0,0,0,0.12)] border`}
                              style={{ borderColor: 'rgba(0,0,0,0.06)' }}
                            >
                              <div className="px-[14px] py-[10px] text-[11px] font-bold tracking-wide uppercase" style={{ backgroundColor: statusColor, color: '#FFFFFF' }}>
                                <div className="flex items-center justify-between">
                                  <div className="opacity-80">{cat}</div>
                                  <div>{groupText}</div>
                                </div>
                              </div>
                              <div className="bg-white px-4 py-3">
                                <div className="text-[16px] font-semibold text-[#111111] line-clamp-2">{r.name}</div>
                                {brandText && <div className="text-[13px] text-[#6B7280] mt-0.5">{brandText}</div>}
                                <div className="border-t border-dashed mt-3 mb-3" style={{ borderColor: '#E5E1DC' }} />
                                <div className="flex items-center justify-between text-[13px] text-[#6B7280]">
                                  <div className="truncate">{micro}</div>
                                  <div className="text-[#111111] ml-2 shrink-0">{fmtMoney(r.monthly)}</div>
                                </div>
                                <div className="pt-3 flex items-center justify-end">
                                  <button onClick={() => toggleExpand(`item:${r.id}`)} className="text-xs text-[#111111] underline">
                                    {openItem ? 'Hide ›' : 'View ›'}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        })()}
        </div>
        )}

        
      </div>
      {/* Edit Modal */}
      {editOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <div className="text-lg font-semibold text-[#111111]">Edit supplement</div>
              <button onClick={() => setEditOpen(false)} className="text-[#6B7280] text-xl leading-none">×</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#111111] mb-1">Dose</label>
                <input
                  value={editDraft.dose}
                  onChange={e => setEditDraft(d => ({ ...d, dose: e.target.value }))}
                  placeholder="e.g., 400mg, 2 caps"
                  className="w-full px-3 py-2 border border-[#E4E1DC] rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#111111] mb-1">Timing</label>
                <select
                  value={editDraft.timing}
                  onChange={e => setEditDraft(d => ({ ...d, timing: e.target.value }))}
                  className="w-full px-3 py-2 border border-[#E4E1DC] rounded-lg"
                >
                  <option value="">Select</option>
                  <option value="Morning">Morning</option>
                  <option value="Afternoon">Afternoon</option>
                  <option value="Evening">Evening</option>
                  <option value="With food">With food</option>
                  <option value="Before bed">Before bed</option>
                  <option value="Any time">Any time</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#111111] mb-1">Frequency</label>
                <select
                  value={editDraft.frequency}
                  onChange={e => setEditDraft(d => ({ ...d, frequency: e.target.value }))}
                  className="w-full px-3 py-2 border border-[#E4E1DC] rounded-lg"
                >
                  <option value="">Select</option>
                  <option value="Daily">Daily</option>
                  <option value="Twice daily">Twice daily</option>
                  <option value="Every other day">Every other day</option>
                  <option value="Weekly">Weekly</option>
                  <option value="As needed">As needed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#111111] mb-1">Brand</label>
                <input
                  value={editDraft.brand}
                  onChange={e => setEditDraft(d => ({ ...d, brand: e.target.value }))}
                  placeholder="Brand"
                  className="w-full px-3 py-2 border border-[#E4E1DC] rounded-lg"
                />
              </div>
              <div className="text-xs text-[#6B7280]">
                Changing dose, timing, or brand will restart testing from today and preserve your history.
              </div>
            </div>
            <div className="px-6 py-4 border-t flex items-center justify-end gap-2">
              <button onClick={() => setEditOpen(false)} className="px-4 py-2 border border-[#E4E1DC] rounded-lg text-sm">Cancel</button>
              <button
                disabled={savingEdit}
                onClick={async () => {
                  const s0 = supps.find(x => x.id === editDraft.id) as any
                  const before = {
                    dose: getDose(s0) || '',
                    timing: getTiming(s0) || '',
                    brand: s0?.brand || parseBrandAndShortName(s0).brand || '',
                    frequency: getFrequency(s0) || ''
                  }
                  const meaningful = (
                    before.dose !== (editDraft.dose || '') ||
                    before.timing !== (editDraft.timing || '') ||
                    before.brand !== (editDraft.brand || '') ||
                    before.frequency !== (editDraft.frequency || '')
                  )
                  if (meaningful) {
                    setConfirmOpen(true)
                    return
                  }
                  // Non-meaningful change (e.g., no-op) just close
                  setEditOpen(false)
                }}
                className="px-5 py-2 bg-[#111111] text-white rounded-lg text-sm"
              >
                {savingEdit ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Confirmation Modal */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl">
            <div className="px-6 py-5">
              <div className="text-lg font-semibold text-[#111111] mb-2">You’re changing how you take this supplement.</div>
              <div className="text-sm text-[#4B5563]">
                To keep your results accurate, we’ll restart testing and save your previous data.
              </div>
              <div className="mt-6 flex items-center justify-end gap-2">
                <button onClick={() => setConfirmOpen(false)} className="px-4 py-2 border border-[#E4E1DC] rounded-lg text-sm">Cancel</button>
                <button
                  className="px-5 py-2 bg-[#111111] text-white rounded-lg text-sm"
                  onClick={async () => {
                    try {
                      setSavingEdit(true)
                      if (!editDraft.id || editDraft.id === 'undefined' || editDraft.id === 'null') {
                        setSavingEdit(false)
                        setConfirmOpen(false)
                        alert('Missing supplement id; please refresh and try again.')
                        return
                      }
                      const res = await fetch(`/api/supplements/${encodeURIComponent(editDraft.id)}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          dose: editDraft.dose || '',
                          timing: editDraft.timing || '',
                          brand: editDraft.brand || '',
                          frequency: editDraft.frequency || '',
                          restartTesting: true
                        })
                      })
                      const j = await res.json().catch(() => ({}))
                      if (!res.ok) throw new Error(j?.error || 'Failed to save')
                      // Update local state
                      setSupps(prev => prev.map(s => {
                        if (s.id !== editDraft.id) return s
                        return {
                          ...s,
                          dose: editDraft.dose || null,
                          timing: editDraft.timing || null,
                          brand: editDraft.brand || null,
                          frequency: editDraft.frequency || null,
                          started_at: new Date().toISOString().slice(0,10)
                        } as any
                      }))
                      setConfirmOpen(false)
                      setEditOpen(false)
                    } catch (e) {
                      alert((e as any)?.message || 'Failed to save')
                    } finally {
                      setSavingEdit(false)
                    }
                  }}
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

