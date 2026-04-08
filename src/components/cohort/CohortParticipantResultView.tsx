'use client'

import { useRef, useState } from 'react'
import { cohortProProductEntryPath } from '@/lib/cohortDashboardDeepLink'

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

type ParsedResultMetrics = {
  primaryMetric: string | null
  /** Normalized effect size for thresholds; not shown in UI. */
  effectSizeNormalized: number | null
  effectStrengthLabel: string | null
  confidenceLabel: string | null
  rows: ParsedMetricRow[]
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
      className="h-6 sm:h-8 w-auto max-w-[108px] sm:max-w-[124px] object-contain object-left"
    />
  )
}

/**
 * Participant-only cohort result layout + PDF export (not TruthReportView).
 * `result_json`: verdict / bullet_points / explanation / summary, plus optional primary_metric, effect_size,
 * confidence, and metrics.{sleep_quality,energy,night_wakes}.{baseline_avg,final_avg}.
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
  const recommendationText = cohortUsageRecommendation(parsedMetrics.effectSizeNormalized, productLabel)

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
    <div className="space-y-5 sm:space-y-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-5">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <div className="shrink-0 rounded-2xl border border-slate-200/95 bg-white px-3 py-2 shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
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
              <h2 className="mt-3 sm:mt-4 text-[1.75rem] sm:text-[2.125rem] font-bold text-slate-950 leading-[1.14] tracking-[-0.02em]">
                {verdictHeadline}
              </h2>
            </header>

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

            {showOutcomeBody ? (
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
            ) : null}
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
                  <p>Your BioStackr Pro is now active.</p>
                  <p>Start building your stack and see what actually works for you.</p>
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
                  You&apos;ve unlocked 3 months of BioStackr Pro.
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
    </div>
  )
}
