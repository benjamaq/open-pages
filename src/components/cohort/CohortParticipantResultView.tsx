'use client'

import Link from 'next/link'
import { useRef, useState } from 'react'
import { cohortProProductEntryPath } from '@/lib/cohortDashboardDeepLink'
import { COHORT_RESULT_PARTNER_MARK_CLASS } from '@/lib/cohortDashboardPartnerLogo'

export type CohortParticipantResultPayload = {
  result_json: Record<string, unknown> | null
  result_version: number
  published_at: string
  product_name: string | null
  brand_name: string | null
}

export type CohortParticipantResultRewards = {
  pro_claimed: boolean
  pro_claim_token: string | null
  pro_has_claim_row: boolean
}

function stringField(j: Record<string, unknown>, key: string): string | null {
  const v = j[key]
  if (typeof v !== 'string') return null
  const t = v.trim()
  return t !== '' ? t : null
}

function stringListField(j: Record<string, unknown>, key: string): string[] {
  const v = j[key]
  if (!Array.isArray(v)) return []
  return v.filter((x): x is string => typeof x === 'string' && x.trim() !== '').map((s) => s.trim())
}

function numLike(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v)
    return Number.isFinite(n) ? n : null
  }
  return null
}

function recordField(obj: unknown): Record<string, unknown> | null {
  if (obj && typeof obj === 'object' && !Array.isArray(obj)) return obj as Record<string, unknown>
  return null
}

/** baseline_avg / final_avg (and a few legacy key variants). */
function readBaselineFinal(entry: Record<string, unknown>): { baseline: number | null; final: number | null } {
  const baseline =
    numLike(entry.baseline_avg) ??
    numLike(entry.baseline) ??
    numLike(entry.baselineAvg) ??
    numLike(entry.baseline_mean)
  const final =
    numLike(entry.final_avg) ??
    numLike(entry.final) ??
    numLike(entry.finalAvg) ??
    numLike(entry.final_mean)
  return { baseline, final }
}

type ParsedMetricRow = {
  id: string
  label: string
  baseline: number | null
  final: number | null
  /** When true, a decrease counts as improvement (e.g. night wakings). */
  lowerIsBetter: boolean
}

type ParsedResultMetrics = {
  primaryMetric: string | null
  /** Normalized effect size for thresholds; not shown in UI. */
  effectSizeNormalized: number | null
  effectStrengthLabel: string | null
  confidenceLabel: string | null
  rows: ParsedMetricRow[]
}

function humanizeMetricKey(key: string): string {
  const k = key.replace(/_/g, ' ').trim()
  if (!k) return key
  return k.replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatMetricValue(n: number | null): string {
  if (n == null || !Number.isFinite(n)) return '—'
  if (Math.abs(n - Math.round(n)) < 1e-6) return String(Math.round(n))
  return n.toFixed(1).replace(/\.0$/, '')
}

function formatConfidenceDisplay(raw: unknown): string | null {
  if (raw == null) return null
  if (typeof raw === 'string') {
    const t = raw.trim()
    if (!t) return null
    return t
  }
  const n = numLike(raw)
  if (n == null) return null
  if (n >= 0 && n <= 1 && n !== Math.round(n)) return `${Math.round(n * 100)}% confidence`
  if (n > 1 && n <= 100) return `${Math.round(n)}% confidence`
  return String(n)
}

/** Cohen-style effect_size in result_json; 2–100 sometimes stored as a percent scale. */
function normalizeEffectSizeForBands(raw: unknown): number | null {
  const n = numLike(raw)
  if (n == null) return null
  if (n > 1 && n <= 100) return n / 100
  return n
}

/** User-facing strength only (no raw decimals). */
function effectStrengthLabel(normalized: number | null): string | null {
  if (normalized == null || !Number.isFinite(normalized)) return null
  if (normalized >= 0.4) return 'Effect: strong'
  if (normalized >= 0.2) return 'Effect: moderate'
  return 'Effect: weak'
}

const POSITIVE_OUTCOME_RECOMMENDATION =
  'Based on your results, continuing this supplement is likely beneficial.'

function cohortUsageRecommendation(effectNormalized: number | null, productLabel: string): string {
  if (effectNormalized == null || !Number.isFinite(effectNormalized)) {
    return "We don't yet have enough data to make a clear recommendation."
  }
  if (effectNormalized >= 0.4) {
    return `Keep using ${productLabel} — it's working well for you.`
  }
  if (effectNormalized >= 0.2) {
    return `Continue using ${productLabel} — you're seeing a positive effect.`
  }
  return `No clear benefit detected — you may want to stop using ${productLabel}.`
}

/** Cohort `result_json.verdict` — positive / improved outcomes (rendering only; not the stats engine). */
function verdictIsPositive(j: Record<string, unknown>): boolean {
  const v = stringField(j, 'verdict')
  if (!v) return false
  const s = v.trim().toLowerCase()
  return s === 'positive' || s === 'improved'
}

function rowShowsMeaningfulImprovement(row: ParsedMetricRow): boolean {
  const { baseline, final, lowerIsBetter } = row
  if (baseline == null || final == null) return false
  const delta = final - baseline
  return lowerIsBetter ? delta < -0.2 : delta > 0.2
}

function metricsShowImprovement(parsed: ParsedResultMetrics): boolean {
  return parsed.rows.some(rowShowsMeaningfulImprovement)
}

function firstImprovedMetricRow(parsed: ParsedResultMetrics): ParsedMetricRow | null {
  for (const row of parsed.rows) {
    if (rowShowsMeaningfulImprovement(row)) return row
  }
  return null
}

/** When metrics are sparse but narrative still describes improvement (aligns verdict + summary). */
function narrativeSuggestsImprovement(j: Record<string, unknown>): boolean {
  const chunks: string[] = []
  const summary = stringField(j, 'summary')
  const expl = stringField(j, 'explanation')
  if (summary) chunks.push(summary)
  if (expl) chunks.push(expl)
  for (const line of stringListField(j, 'bullet_points')) chunks.push(line)
  const text = chunks.join(' ').toLowerCase()
  if (!text) return false
  return /\b(improved|improvement|better|increased|positive trend|fewer|reduced)\b/.test(text)
}

function proofLineFromMetricRow(row: ParsedMetricRow): string | null {
  const { baseline, final, lowerIsBetter, label } = row
  if (baseline == null || final == null) return null
  const delta = final - baseline
  if (Math.abs(delta) < 1e-9) return null
  const improved = lowerIsBetter ? delta < -0.2 : delta > 0.2
  const b = formatMetricValue(baseline)
  const f = formatMetricValue(final)
  if (improved) {
    return lowerIsBetter ? `${label} decreased from ${b} → ${f}` : `${label} increased from ${b} → ${f}`
  }
  return `${label} changed from ${b} → ${f}`
}

function primaryMetricRow(j: Record<string, unknown>, parsed: ParsedResultMetrics): ParsedMetricRow | null {
  const key =
    stringField(j, 'primary_metric') || stringField(j, 'primaryMetric') || stringField(j, 'primary_outcome')
  if (key) {
    const row = parsed.rows.find((r) => r.id === key)
    if (row) return row
  }
  return null
}

const OUTCOME_SUBTEXT = 'Based on your real-world data over the study period'

/** Strong outcome-led headline when we cannot name a specific metric. */
const POSITIVE_VERDICT_CLEAR_EFFECT_HEADLINE = 'This supplement showed a clear positive effect'

function outcomeHeadlineAndSubtext(
  j: Record<string, unknown>,
  parsed: ParsedResultMetrics,
  fallbackHeadline: string,
): { headline: string; subtext: string | null } {
  if (!verdictIsPositive(j)) {
    return { headline: fallbackHeadline, subtext: null }
  }

  const primary = primaryMetricRow(j, parsed)
  const rowForHeadline =
    primary && rowShowsMeaningfulImprovement(primary)
      ? primary
      : firstImprovedMetricRow(parsed) ?? primary
  if (rowForHeadline && metricsShowImprovement(parsed)) {
    let headlineMetric: string
    if (rowForHeadline.id === 'night_wakes' || rowForHeadline.id === 'night_wake') {
      headlineMetric = 'sleep'
    } else {
      const words = rowForHeadline.label.trim().split(/\s+/)
      headlineMetric =
        words.length <= 2
          ? words.join(' ').toLowerCase()
          : words.slice(0, 2).join(' ').toLowerCase()
    }
    return {
      headline: `Your ${headlineMetric} improved`,
      subtext: OUTCOME_SUBTEXT,
    }
  }

  if (narrativeSuggestsImprovement(j) || metricsShowImprovement(parsed)) {
    return { headline: POSITIVE_VERDICT_CLEAR_EFFECT_HEADLINE, subtext: OUTCOME_SUBTEXT }
  }

  const rawV = stringField(j, 'verdict')
  if (rawV && ['positive', 'improved'].includes(rawV.trim().toLowerCase())) {
    return { headline: POSITIVE_VERDICT_CLEAR_EFFECT_HEADLINE, subtext: OUTCOME_SUBTEXT }
  }

  return { headline: fallbackHeadline, subtext: null }
}

/**
 * Evidence lines for the Key finding block — only existing baseline/final and labels (no new math).
 */
function buildKeyFindingLines(
  j: Record<string, unknown>,
  parsed: ParsedResultMetrics,
): string[] {
  const lines: string[] = []
  const seen = new Set<string>()
  const primary = primaryMetricRow(j, parsed)

  const pushUnique = (s: string) => {
    const t = s.trim()
    if (!t || seen.has(t)) return
    seen.add(t)
    lines.push(t)
  }

  const improvedRows = parsed.rows.filter(rowShowsMeaningfulImprovement)
  const order: ParsedMetricRow[] = []
  if (primary && improvedRows.some((r) => r.id === primary.id)) {
    order.push(primary)
  }
  for (const r of improvedRows) {
    if (r.id !== primary?.id) order.push(r)
  }
  const rowsToFeature = order.length > 0 ? order : improvedRows

  for (const row of rowsToFeature.slice(0, 3)) {
    pushUnique(`${row.label} improved over the study period.`)
    const pl = proofLineFromMetricRow(row)
    if (pl) pushUnique(pl)
  }

  if (lines.length === 0 && narrativeSuggestsImprovement(j)) {
    pushUnique('Your check-ins showed a clear upward shift during the study.')
  }

  if (lines.length === 0 && parsed.rows.length > 0) {
    for (const row of parsed.rows.slice(0, 3)) {
      const pl = proofLineFromMetricRow(row)
      if (pl) pushUnique(pl)
    }
  }

  return lines
}

/** Top-level + nested keys some publish pipelines use instead of `effect_size`. */
function readEffectSizeFromJsonKeys(j: Record<string, unknown>): number | null {
  const n =
    normalizeEffectSizeForBands(j.effect_size ?? j.effectSize) ??
    normalizeEffectSizeForBands(j.effect_size_pct ?? j.effect_pct ?? j.effectPercent)
  if (n != null) return n
  const summary = recordField(j.summary)
  if (summary) {
    const s = normalizeEffectSizeForBands(
      summary.effect_size ?? summary.effectSize ?? summary.effect_size_pct,
    )
    if (s != null) return s
  }
  return null
}

/**
 * When admins publish verdict + metrics but omit Cohen-style `effect_size`, infer a conservative
 * positive strength from baseline→final shifts so the recommendation block matches the visible outcome.
 */
function inferEffectSizeFromParsedMetrics(parsed: ParsedResultMetrics): number | null {
  let best: number | null = null
  for (const row of parsed.rows) {
    const { baseline, final, lowerIsBetter } = row
    if (baseline == null || final == null) continue
    const delta = final - baseline
    const improved = lowerIsBetter ? delta < -0.2 : delta > 0.2
    if (!improved) continue
    const mag = Math.abs(delta)
    let score = 0.24
    if (mag >= 2.5) score = 0.55
    else if (mag >= 2) score = 0.48
    else if (mag >= 1) score = 0.38
    else if (mag >= 0.5) score = 0.3
    if (best == null || score > best) best = score
  }
  return best
}

function buildRecommendationParagraph(
  j: Record<string, unknown>,
  parsed: ParsedResultMetrics,
  productLabel: string,
): string {
  const explicit =
    stringField(j, 'usage_recommendation') ||
    stringField(j, 'recommendation') ||
    stringField(j, 'cohort_usage_recommendation')
  if (explicit) return explicit

  const positive = verdictIsPositive(j)
  const improved = metricsShowImprovement(parsed) || narrativeSuggestsImprovement(j)
  if (positive && improved) {
    return POSITIVE_OUTCOME_RECOMMENDATION
  }

  const effect =
    readEffectSizeFromJsonKeys(j) ??
    parsed.effectSizeNormalized ??
    inferEffectSizeFromParsedMetrics(parsed)

  return cohortUsageRecommendation(effect, productLabel)
}

/** Core outcome fields from seeded `result_json` (metrics + study-level signals). */
function parseResultMetrics(j: Record<string, unknown>): ParsedResultMetrics {
  const primaryRaw =
    stringField(j, 'primary_metric') || stringField(j, 'primaryMetric') || stringField(j, 'primary_outcome')
  const primaryMetric = primaryRaw ? humanizeMetricKey(primaryRaw) : null

  const effectSizeNormalized = normalizeEffectSizeForBands(j.effect_size ?? j.effectSize)
  const effectStrengthLabelOut = effectStrengthLabel(effectSizeNormalized)
  const confidenceLabel = formatConfidenceDisplay(j.confidence ?? j.confidence_score ?? j.signal_strength)

  const metricsRoot = recordField(j.metrics) ?? {}
  const metricKeysPresent = Object.keys(metricsRoot).filter((mk) => recordField(metricsRoot[mk]))
  const cognitiveOnlyResult =
    metricKeysPresent.length > 0 &&
    !metricKeysPresent.some(
      (mk) => mk.includes('sleep') || mk === 'night_wakes' || mk === 'sleep_onset_bucket',
    )

  const specs: Array<{ key: string; label: string; lowerIsBetter: boolean }> = [
    { key: 'sleep_quality', label: 'Sleep quality', lowerIsBetter: false },
    {
      key: 'energy',
      label: cognitiveOnlyResult ? 'Mental energy and alertness' : 'Energy',
      lowerIsBetter: false,
    },
    { key: 'focus', label: 'Focus', lowerIsBetter: false },
    { key: 'mood', label: 'Mood', lowerIsBetter: false },
    { key: 'mental_clarity', label: 'Mental clarity', lowerIsBetter: false },
    { key: 'calmness', label: 'Calmness', lowerIsBetter: false },
    { key: 'night_wakes', label: 'Night wakings', lowerIsBetter: true },
    { key: 'night_wake', label: 'Night wakings', lowerIsBetter: true },
  ]

  const seen = new Set<string>()
  const rows: ParsedMetricRow[] = []
  for (const spec of specs) {
    if (seen.has(spec.label)) continue
    const sub = recordField(metricsRoot[spec.key])
    if (!sub) continue
    const { baseline, final } = readBaselineFinal(sub)
    if (baseline == null && final == null) continue
    seen.add(spec.label)
    rows.push({
      id: spec.key,
      label: spec.label,
      baseline,
      final,
      lowerIsBetter: spec.lowerIsBetter,
    })
  }

  const primaryKey =
    stringField(j, 'primary_metric') || stringField(j, 'primaryMetric') || stringField(j, 'primary_outcome')
  if (primaryKey && !rows.some((r) => r.id === primaryKey)) {
    const sub = recordField(metricsRoot[primaryKey])
    if (sub) {
      const { baseline, final } = readBaselineFinal(sub)
      if (baseline != null || final != null) {
        const pkLower = primaryKey.toLowerCase()
        rows.push({
          id: primaryKey,
          label: humanizeMetricKey(primaryKey),
          baseline,
          final,
          lowerIsBetter:
            pkLower.includes('night_wake') || pkLower.includes('sleep_onset') || pkLower.includes('wakes'),
        })
      }
    }
  }

  return { primaryMetric, effectSizeNormalized, effectStrengthLabel: effectStrengthLabelOut, confidenceLabel, rows }
}

function metricDeltaPhrase(row: ParsedMetricRow): string | null {
  const { baseline, final, lowerIsBetter } = row
  if (baseline == null || final == null) return null
  const delta = final - baseline
  if (Math.abs(delta) < 1e-9) return 'steady between your first and last check-ins'
  const improved = lowerIsBetter ? delta < 0 : delta > 0
  const worse = lowerIsBetter ? delta > 0 : delta < 0
  const mag = formatMetricValue(Math.abs(delta))
  const sleepInterruptionMetric = row.id === 'night_wakes' || row.id === 'night_wake'
  if (improved) {
    if (lowerIsBetter && sleepInterruptionMetric) {
      return `down by about ${mag} vs your start — fewer interruptions overnight`
    }
    return lowerIsBetter
      ? `down by about ${mag} vs your start`
      : `up by about ${mag} vs your start`
  }
  if (worse) {
    return row.lowerIsBetter ? `up by about ${mag} vs your start` : `down by about ${mag} vs your start`
  }
  return null
}

function normalizeResultRecord(raw: Record<string, unknown> | null | unknown): Record<string, unknown> {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) return raw as Record<string, unknown>
  if (typeof raw === 'string') {
    try {
      const p = JSON.parse(raw) as unknown
      if (p && typeof p === 'object' && !Array.isArray(p)) {
        return p as Record<string, unknown>
      }
    } catch {
      /* ignore */
    }
  }
  return {}
}

/** Prefer new keys; fall back to older result_json shapes. */
function parseResultSections(
  j: Record<string, unknown>,
  productName: string | null,
): {
  verdictHeadline: string
  bulletPoints: string[]
  explanation: string | null
  /** True when payload had at least one substantive field (not just fallbacks). */
  hasStructuredContent: boolean
} {
  const verdictRaw = stringField(j, 'verdict') || stringField(j, 'title')

  const bulletPoints = (() => {
    const next = stringListField(j, 'bullet_points')
    if (next.length) return next
    const hi = stringListField(j, 'highlights')
    if (hi.length) return hi
    return stringListField(j, 'bullets')
  })()

  const explanation =
    stringField(j, 'explanation') ||
    stringField(j, 'summary') ||
    stringField(j, 'overview') ||
    null

  const hasStructuredContent = Boolean(
    verdictRaw ||
      stringListField(j, 'bullet_points').length > 0 ||
      stringField(j, 'explanation') ||
      stringField(j, 'summary') ||
      stringField(j, 'overview') ||
      stringListField(j, 'highlights').length > 0 ||
      stringListField(j, 'bullets').length > 0,
  )

  const verdictHeadline =
    verdictRaw ||
    (productName ? `Your ${productName} study — personal outcome` : 'Your personal study outcome')

  return {
    verdictHeadline,
    bulletPoints,
    explanation,
    hasStructuredContent,
  }
}

function studyContextLine(brandName: string | null, productName: string | null): string {
  const b = typeof brandName === 'string' ? brandName.trim() : ''
  const p = typeof productName === 'string' ? productName.trim() : ''
  if (b && p) return `${b} ${p} study`
  if (p) return `${p} study`
  if (b) return `${b} study`
  return 'Study results'
}

/** DNA asset only when brand reads as DoNotAge; otherwise wordmark text for multi-cohort parity. */
function CohortResultPartnerMark({ brandName }: { brandName: string | null }) {
  const b = typeof brandName === 'string' ? brandName.trim() : ''
  if (b && !/donotage/i.test(b)) {
    return (
      <span className="text-lg sm:text-xl font-bold text-slate-950 tracking-tight">{b}</span>
    )
  }
  return (
    <img
      src="/DNA-logo-black.png"
      alt={b || 'Study partner'}
      className={COHORT_RESULT_PARTNER_MARK_CLASS}
    />
  )
}

/**
 * Participant-only cohort result layout + PDF export (not TruthReportView).
 * `result_json`: verdict / bullet_points / explanation / summary, plus optional primary_metric,
 * effect_size (or effect_size_pct, summary.effect_size), usage_recommendation (overrides generated copy),
 * confidence, and metrics.{…}.{baseline_avg,final_avg}. Layout: verdict → key finding → narrative →
 * check-in detail → recommendation; rewards; closing “What this unlocks next” (presentation only).
 */
export default function CohortParticipantResultView({
  payload,
  rewards,
}: {
  payload: CohortParticipantResultPayload
  rewards?: CohortParticipantResultRewards | null
}) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [downloading, setDownloading] = useState(false)
  const [claimBusy, setClaimBusy] = useState(false)
  const [claimErr, setClaimErr] = useState<string | null>(null)
  const [claimedOnPage, setClaimedOnPage] = useState(false)
  const j = normalizeResultRecord(payload.result_json)
  const { verdictHeadline, bulletPoints, explanation, hasStructuredContent } = parseResultSections(
    j,
    payload.product_name,
  )
  const parsedMetrics = parseResultMetrics(j)
  const hasMetricBlock =
    parsedMetrics.rows.length > 0 ||
    parsedMetrics.primaryMetric != null ||
    parsedMetrics.effectStrengthLabel != null ||
    parsedMetrics.confidenceLabel != null
  const showOutcomeBody = hasStructuredContent || hasMetricBlock

  const metricsRootForReward = recordField(j.metrics) ?? {}
  const metricKeysForReward = Object.keys(metricsRootForReward).filter((mk) =>
    recordField(metricsRootForReward[mk]),
  )
  const storeCreditPartnerRewardUi =
    metricKeysForReward.length > 0 &&
    !metricKeysForReward.some(
      (mk) => mk.includes('sleep') || mk === 'night_wakes' || mk === 'sleep_onset_bucket',
    )

  const productLabel = (payload.product_name && payload.product_name.trim()) || 'your study product'
  const recommendationText = buildRecommendationParagraph(j, parsedMetrics, productLabel)
  const { headline: outcomeHeadline, subtext: outcomeSubtext } = outcomeHeadlineAndSubtext(
    j,
    parsedMetrics,
    verdictHeadline,
  )
  const keyFindingLines = buildKeyFindingLines(j, parsedMetrics)
  const showKeyFinding = keyFindingLines.length > 0

  const studyLine = studyContextLine(payload.brand_name, payload.product_name)
  const publishedLabel = (() => {
    try {
      const d = new Date(payload.published_at)
      if (!Number.isFinite(d.getTime())) return null
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    } catch {
      return null
    }
  })()

  async function handleDownloadPdf() {
    if (!rootRef.current) {
      alert('Could not find content to export.')
      return
    }
    try {
      setDownloading(true)
      const html2pdf = (await import('html2pdf.js')).default as (opts?: unknown) => {
        set: (o: unknown) => { from: (el: HTMLElement) => { save: () => Promise<void> } }
      }
      const safe = (payload.product_name || 'cohort-result')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
      const opt = {
        margin: [12, 12, 12, 12],
        filename: `${safe || 'cohort-result'}-summary.pdf`,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
      }
      const wrapper = document.createElement('div')
      wrapper.style.background = '#ffffff'
      wrapper.style.padding = '0'
      wrapper.style.color = '#111827'
      wrapper.appendChild(rootRef.current.cloneNode(true) as HTMLElement)
      await html2pdf().set(opt).from(wrapper).save()
    } catch (e) {
      console.error('cohort result pdf', e)
      alert('PDF export failed. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  const proClaimed = Boolean(rewards?.pro_claimed || claimedOnPage)

  async function claimProOnThisAccount() {
    const token = rewards?.pro_claim_token?.trim()
    if (!token) return
    setClaimErr(null)
    setClaimBusy(true)
    try {
      const res = await fetch('/api/cohort/claim-reward', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const j = (await res.json().catch(() => ({}))) as {
        error?: string
        ok?: boolean
        already_claimed?: boolean
      }
      if (!res.ok) {
        setClaimErr(String(j.error || 'Could not activate Pro'))
        return
      }
      if (j.ok || j.already_claimed) {
        setClaimedOnPage(true)
        try {
          window.dispatchEvent(new Event('dashboard:refresh'))
        } catch {
          /* ignore */
        }
      }
    } catch {
      setClaimErr('Something went wrong.')
    } finally {
      setClaimBusy(false)
    }
  }

  return (
    <div className="space-y-6 sm:space-y-9">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-5">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <div className="shrink-0 rounded-2xl border border-slate-200/95 bg-white px-3 py-2.5 sm:px-4 sm:py-3 shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
            <CohortResultPartnerMark brandName={payload.brand_name} />
          </div>
          <div className="h-8 w-px shrink-0 bg-slate-200/80 hidden sm:block" aria-hidden />
          <div className="min-w-0">
            <h1 className="text-[1.625rem] sm:text-3xl font-bold text-slate-950 tracking-[-0.02em] leading-[1.12]">
              Your results
            </h1>
            <p className="mt-1 text-sm sm:text-[0.9375rem] text-slate-600 font-medium tracking-tight">{studyLine}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleDownloadPdf}
          disabled={downloading}
          className="shrink-0 self-start sm:self-center rounded-xl border border-slate-200/95 bg-white/90 px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm hover:bg-white disabled:opacity-50 backdrop-blur-sm"
        >
          {downloading ? 'Preparing…' : 'Download PDF'}
        </button>
      </div>

      <div
        ref={rootRef}
        className="rounded-3xl border border-slate-200 bg-white px-5 py-7 sm:px-10 sm:py-10 text-slate-900 shadow-[0_12px_48px_-20px_rgba(15,23,42,0.22),0_4px_14px_-6px_rgba(15,23,42,0.08)]"
      >
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs sm:text-sm text-slate-500 font-medium">
          {publishedLabel ? <span className="tabular-nums">Published {publishedLabel}</span> : null}
          {publishedLabel ? <span className="text-slate-300 select-none" aria-hidden>·</span> : null}
          <span>Summary v{payload.result_version}</span>
        </div>

        {showOutcomeBody ? (
          <>
            <header className="mt-6 sm:mt-7">
              <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.16em] text-[#C84B2F]">
                Your verdict
              </p>
              <h2 className="mt-3 sm:mt-4 text-[1.875rem] sm:text-[2.25rem] font-bold text-slate-950 leading-[1.12] tracking-[-0.02em]">
                {outcomeHeadline}
              </h2>
              {outcomeSubtext ? (
                <p className="mt-3 max-w-prose text-[13px] sm:text-[0.9375rem] text-slate-600 leading-relaxed">
                  {outcomeSubtext}
                </p>
              ) : null}
            </header>

            {showKeyFinding ? (
              <section
                className="mt-8 sm:mt-10"
                aria-labelledby="cohort-result-key-finding-heading"
              >
                <h3
                  id="cohort-result-key-finding-heading"
                  className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.14em] text-slate-500"
                >
                  Key finding
                </h3>
                <div className="mt-4 rounded-2xl border border-slate-200/95 bg-gradient-to-b from-slate-50/95 to-white px-5 py-5 sm:px-7 sm:py-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                  <ul className="list-none space-y-3.5 p-0 m-0" role="list">
                    {keyFindingLines.map((line) => (
                      <li key={line} className="flex gap-3 text-[15px] sm:text-[1.0625rem] leading-relaxed text-slate-800">
                        <span
                          className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#C84B2F]"
                          aria-hidden
                        />
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            ) : null}

            {bulletPoints.length > 0 ? (
              <section className="mt-9 sm:mt-11">
                <h3 className="text-base sm:text-lg font-semibold text-slate-950 tracking-tight">What changed</h3>
                <ul className="mt-4 sm:mt-5 list-disc space-y-3 pl-5 text-[15px] sm:text-[1.0625rem] leading-[1.6] text-slate-800 marker:text-[#C84B2F]">
                  {bulletPoints.map((line) => (
                    <li key={line} className="pl-0.5">
                      {line}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {explanation ? (
              <section className="mt-9 sm:mt-11">
                <h3 className="text-base sm:text-lg font-semibold text-slate-950 tracking-tight">What this means</h3>
                <p className="mt-4 sm:mt-5 text-[15px] sm:text-[1.0625rem] leading-[1.65] text-slate-800 whitespace-pre-line">
                  {explanation}
                </p>
              </section>
            ) : null}

            {hasMetricBlock ? (
              <section className="mt-9 sm:mt-11" aria-labelledby="cohort-result-metrics-heading">
                <h3
                  id="cohort-result-metrics-heading"
                  className="text-base sm:text-lg font-semibold text-slate-950 tracking-tight"
                >
                  What your check-ins show
                </h3>
                <p className="mt-2 text-[13px] sm:text-sm text-slate-600 leading-relaxed">
                  Averages from your early study days compared with your last days — your personal trajectory, not a
                  generic template.
                </p>

                {parsedMetrics.primaryMetric != null || parsedMetrics.effectStrengthLabel != null ? (
                  <p className="mt-5 text-[15px] sm:text-[1.0625rem] leading-relaxed text-slate-800">
                    {parsedMetrics.primaryMetric != null ? (
                      <>
                        <span className="text-slate-500">Primary focus</span>{' '}
                        <span className="font-semibold text-slate-950">{parsedMetrics.primaryMetric}</span>
                      </>
                    ) : null}
                    {parsedMetrics.primaryMetric != null && parsedMetrics.effectStrengthLabel != null ? (
                      <span className="text-slate-400 mx-1.5" aria-hidden>
                        ·
                      </span>
                    ) : null}
                    {parsedMetrics.effectStrengthLabel != null ? (
                      <span className="font-semibold text-slate-950">{parsedMetrics.effectStrengthLabel}</span>
                    ) : null}
                  </p>
                ) : null}

                {parsedMetrics.rows.length > 0 ? (
                  <ul className="mt-6 sm:mt-7 list-none space-y-4 p-0 m-0">
                    {parsedMetrics.rows.map((row) => {
                      const phrase = metricDeltaPhrase(row)
                      return (
                        <li
                          key={row.id}
                          className="rounded-2xl border border-slate-200/90 bg-gradient-to-b from-slate-50/90 to-white px-4 py-4 sm:px-5 sm:py-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
                        >
                          <div className="flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-baseline sm:justify-between sm:gap-x-4">
                            <span className="text-[15px] sm:text-base font-semibold text-slate-950">{row.label}</span>
                            <span className="text-[15px] sm:text-base font-bold tabular-nums text-slate-900 tracking-tight">
                              <span className="text-slate-500 font-medium text-sm sm:text-[15px]">Baseline </span>
                              {formatMetricValue(row.baseline)}
                              <span className="text-slate-400 font-normal mx-1.5" aria-hidden>
                                →
                              </span>
                              <span className="text-slate-500 font-medium text-sm sm:text-[15px]">Final </span>
                              {formatMetricValue(row.final)}
                            </span>
                          </div>
                          {phrase ? (
                            <p className="mt-3 text-sm sm:text-[15px] leading-relaxed text-slate-700">{phrase}</p>
                          ) : null}
                        </li>
                      )
                    })}
                  </ul>
                ) : null}

                {parsedMetrics.confidenceLabel != null ? (
                  <div className="mt-7 sm:mt-8 rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-4 sm:px-5 sm:py-4">
                    <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Signal strength
                    </p>
                    <p className="mt-2 text-[15px] sm:text-[1.0625rem] font-medium text-slate-900 leading-snug">
                      {parsedMetrics.confidenceLabel}
                    </p>
                    <p className="mt-2 text-[13px] sm:text-sm text-slate-600 leading-relaxed">
                      Stronger signals mean the shift in your data is less likely to be random noise alone — it does not
                      guarantee the same outcome if you repeat the study.
                    </p>
                  </div>
                ) : null}
              </section>
            ) : null}

            <section className="mt-9 sm:mt-11" aria-labelledby="cohort-result-recommendation-heading">
              <h3
                id="cohort-result-recommendation-heading"
                className="text-base sm:text-lg font-semibold text-slate-950 tracking-tight"
              >
                Your recommendation
              </h3>
              <p className="mt-4 sm:mt-5 text-[15px] sm:text-[1.0625rem] font-medium leading-[1.65] text-slate-900">
                {recommendationText}
              </p>
            </section>
          </>
        ) : (
          <p className="mt-6 text-sm leading-relaxed text-slate-600">
            Your personal outcome summary will appear here once it includes a <strong>verdict</strong>,{' '}
            <strong>check-in metrics</strong> (baseline vs final averages), and/or <strong>bullet_points</strong> plus
            an <strong>explanation</strong> of what the numbers mean for you.
          </p>
        )}
      </div>

      {rewards ? (
        <section className="mt-8 sm:mt-10 space-y-4 sm:space-y-5" aria-label="Your rewards">
          <article className="rounded-2xl border border-stone-200/95 bg-gradient-to-b from-[#faf8f5] via-white to-white px-7 py-8 sm:px-9 sm:py-9 shadow-[0_6px_28px_-12px_rgba(28,25,23,0.12)]">
            <div className="flex items-center min-h-[2.35rem]">
              <div className="max-w-[min(100%,200px)]">
                <CohortResultPartnerMark brandName={payload.brand_name} />
              </div>
            </div>
            <h2 className="mt-6 sm:mt-7 text-xl sm:text-2xl font-bold text-slate-950 tracking-tight">
              {payload.brand_name?.trim()
                ? `Your ${payload.brand_name.trim()} reward`
                : 'Your partner reward'}
            </h2>
            <p className="mt-3 sm:mt-4 max-w-prose text-[15px] sm:text-[1.0625rem] leading-relaxed text-slate-800">
              {storeCreditPartnerRewardUi ? (
                <>
                  Your <strong>$120 store credit</strong> from {payload.brand_name?.trim() || 'the study partner'} is
                  handled per the study terms. You&apos;ll receive details by email where applicable.
                </>
              ) : (
                <>
                  Your 3-month supply of {productLabel} will be shipped automatically to the address you provided during
                  signup.
                </>
              )}
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-white to-slate-50/70 px-7 py-8 sm:px-9 sm:py-9 shadow-[0_8px_36px_-14px_rgba(15,23,42,0.16)] border-l-[4px] border-l-[#C84B2F]">
            <div className="flex items-center min-h-[2.35rem]">
              <img
                src="/brand/biostackr-logo.png"
                alt="BioStackr"
                className="h-8 sm:h-9 w-auto max-w-[132px] object-contain object-left"
              />
            </div>
            <h2 className="mt-6 sm:mt-7 text-xl sm:text-2xl font-bold text-slate-950 tracking-tight">
              Your BioStackr reward
            </h2>

            {proClaimed ? (
              <div className="mt-5 space-y-4">
                <div className="space-y-3 text-[15px] sm:text-[1.0625rem] leading-relaxed text-slate-800">
                  <p>Your BioStackr Pro access is now active.</p>
                  <p>You can now start testing the rest of your supplement stack.</p>
                </div>
                <a
                  href={cohortProProductEntryPath()}
                  className="inline-flex w-full sm:w-auto justify-center rounded-xl bg-[#C84B2F] px-6 py-3.5 text-sm font-semibold text-white hover:opacity-95"
                >
                  Go to your dashboard
                </a>
              </div>
            ) : rewards.pro_claim_token ? (
              <>
                <p className="mt-4 text-[15px] sm:text-base leading-relaxed text-slate-800">
                  You&apos;ve unlocked 3 months of BioStackr Pro — use it to test the rest of your stack the same way you
                  tested this study.
                </p>
                <button
                  type="button"
                  disabled={claimBusy}
                  onClick={() => void claimProOnThisAccount()}
                  className="mt-5 inline-flex justify-center rounded-xl bg-[#1e293b] px-5 py-3 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-50"
                >
                  {claimBusy ? 'Activating…' : 'Claim your Pro access'}
                </button>
                {claimErr ? <p className="mt-3 text-sm text-red-600">{claimErr}</p> : null}
              </>
            ) : (
              <p className="mt-5 text-sm text-slate-600">
                Your reward details will appear here when they are ready. Try refreshing the page, or contact support if
                this continues.
              </p>
            )}
          </article>
        </section>
      ) : null}

      {showOutcomeBody ? (
        <section
          className="rounded-3xl border border-slate-200/90 bg-gradient-to-b from-white via-slate-50/40 to-slate-50/70 px-6 py-10 sm:px-10 sm:py-12 shadow-[0_16px_48px_-28px_rgba(15,23,42,0.18),0_4px_14px_-6px_rgba(15,23,42,0.06)]"
          aria-labelledby="cohort-result-unlocks-heading"
        >
          <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Report conclusion
          </p>
          <h2
            id="cohort-result-unlocks-heading"
            className="mt-3 text-2xl sm:text-[1.75rem] font-bold text-slate-950 tracking-tight leading-snug"
          >
            What this unlocks next
          </h2>
          <div className="mt-7 max-w-2xl space-y-5 text-[15px] sm:text-[1.0625rem] leading-[1.65] text-slate-700">
            <p>
              You now have evidence that this supplement affects you positively.
            </p>
            <p className="text-slate-600">
              Most people are still guessing with the rest of their stack.
            </p>
            <p>
              With BioStackr, you can test your other supplements the same way — and find out what is actually helping,
              what is neutral, and what may not be worth taking.
            </p>
          </div>
          <div className="mt-10">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-xl border border-slate-200/95 bg-white px-6 py-3.5 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-50/90 sm:min-w-[240px]"
            >
              Start testing your stack
            </Link>
          </div>
        </section>
      ) : null}
    </div>
  )
}
