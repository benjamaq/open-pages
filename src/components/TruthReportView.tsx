'use client'

import type { TruthReport } from '@/lib/truthEngine/types'
import bioMap from '@/lib/truthEngine/supplement-biology-map-full.json'

export default function TruthReportView({ report }: { report: TruthReport }) {
  const statusColor = colorForStatus(report.status)
  const phenotype = derivePhenotype(report)
  const deficiency = deriveDeficiencyHint(report)
  const decision = decisionFor(report)
  const dynamic = generateReportCopy(report)
  const isImplicit = String((report as any)?.analysisSource || 'implicit') === 'implicit'
  const supName = String(
    (report as any)?.supplementName ||
    (report as any)?.name ||
    (report as any)?.label ||
    (report as any)?.supplement ||
    (report as any)?.meta?.supplementName ||
    ''
  ).trim()
  try {
    console.log('[TruthReportView] supName resolved:', supName || null, 'report.supplementName:', (report as any)?.supplementName || null)
  } catch {}
  return (
    <div className="min-h-screen bg-[#0B0D13] text-slate-100">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {isImplicit && (
          <div className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 p-3 text-sm text-indigo-200">
            <div className="font-semibold">This result is based on patterns in your Apple Health and WHOOP data.</div>
            <div className="text-indigo-200/90">Daily check-ins will sharpen this into a confirmed verdict.</div>
          </div>
        )}
        <header className="space-y-1.5">
          {supName && (
            <h1 className="text-3xl md:text-[32px] font-semibold leading-tight">{supName}</h1>
          )}
          <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${statusColor.badge}`}>
            {report.verdictLabel}
          </div>
          <div className="text-sm text-slate-400">{report.confoundsSummary}</div>
          <div className="mt-2 text-sm text-slate-200 space-y-0.5">
            <div><span className="text-slate-400">Recommendation:</span> {decision.recommendation}</div>
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {phenotype && (
              <span className="text-[10px] font-semibold inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/40">
                {phenotype.icon} {phenotype.label}
              </span>
            )}
            {typeof report.community.userPercentile === 'number' && (
              <span className="text-[10px] inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-700/40 text-slate-200 border border-slate-600/60">
                ↕ {report.community.userPercentile}th percentile
              </span>
            )}
          </div>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Card>
            <div className="text-sm text-slate-400 mb-1">Your effect ({report.primaryMetricLabel})</div>
            <div className="space-y-1 font-mono">
              <div>Absolute change: {fmt(report.effect.absoluteChange)}</div>
              <div>Effect size (d): {Number.isFinite(report?.effect?.effectSize as any) ? (Number(report.effect.effectSize).toFixed(2)) : '—'}</div>
              {report.status === 'no_detectable_effect' ? null : (
                <div>Direction: {report.effect.direction}</div>
              )}
              <div>Confidence: {report.confidence.label.toUpperCase()}</div>
            </div>
          </Card>
          {report.status === 'no_detectable_effect' && (
            <Card>
              <div className="text-sm text-slate-400 mb-2">Interpretation</div>
              <div className="text-sm text-slate-200 whitespace-pre-line">
{`This supplement did not produce a meaningful change in your tracked 
symptoms or outcomes at your current dose and timing.

If you're taking it to improve how you feel or perform, consider 
pausing or dropping it. If you're taking it for general health, 
you may still choose to keep it—this test simply can't detect 
that kind of benefit.`}
              </div>
            </Card>
          )}
          <Card>
            <div className="text-sm text-slate-400 mb-2">ON vs OFF</div>
            <table className="w-full text-sm font-mono">
              <thead className="text-slate-400">
                <tr>
                  <th className="text-left py-1"> </th>
                  <th className="text-left py-1">OFF</th>
                  <th className="text-left py-1">ON</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-1">{report.primaryMetricLabel}</td>
                  <td className="py-1">{fmt(report.effect.meanOff)}</td>
                  <td className="py-1">{fmt(report.effect.meanOn)}</td>
                </tr>
                <tr>
                  <td className="py-1">Samples</td>
                  <td className="py-1">{report.effect.sampleOff}</td>
                  <td className="py-1">{report.effect.sampleOn}</td>
                </tr>
              </tbody>
            </table>
            {String(report.status) === 'too_early' && typeof (report as any)?.meta?.missingOffMetrics === 'number' && (report as any).meta.missingOffMetrics > 0 && (
              <div className="mt-3 text-xs text-amber-300">
                We found {(report as any).meta.sampleOff} OFF day(s) with usable metrics. {(report as any).meta.missingOffMetrics} OFF day(s) didn’t include {String(report.primaryMetricLabel).toLowerCase()} data. Connect a device that tracks sleep for older dates to speed up results.
              </div>
            )}
          </Card>
        </section>

        <Card>
          <div className="text-sm text-slate-400 mb-2">{isImplicit ? 'What your data suggests' : (report.status === 'proven_positive' ? 'Why this worked for you' : report.status === 'negative' ? 'Why this didn’t work for you' : 'What we see so far')}</div>
          <div className="space-y-2">
            <div className="text-slate-200">{dynamic.effectSummary}</div>
            {deficiency && (
              <div className="mt-2 rounded-lg border border-amber-400/30 bg-amber-500/10 text-amber-200 text-xs px-3 py-2">
                <span className="font-semibold">Deficiency hint:</span> {deficiency}
              </div>
            )}
          </div>
        </Card>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Card>
            <div className="text-sm text-slate-400 mb-2">How you compare to others</div>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>You responded {report.community.userPercentile != null ? `stronger than ${report.community.userPercentile}%` : 'within cohort range'} of users.</li>
              {report.community.avgEffect != null && (
                <li>Average effect size (d) in cohort: {report.community.avgEffect.toFixed(2)}</li>
              )}
              {report.community.responderLabel && (
                <li>Responder type: {report.community.responderLabel.replace('_', ' ')}</li>
              )}
            </ul>
          </Card>
          <Card>
            <div className="text-sm text-slate-400 mb-2">Cohort distribution (effect size)</div>
            <CurveChip effectSize={report.effect.effectSize} avgEffect={report.community.avgEffect ?? null} userPercentile={report.community.userPercentile ?? null} />
          </Card>
        </section>

        <Card>
          <div className="text-sm text-slate-400 mb-2">What this suggests about your biology</div>
          <div className="text-sm text-slate-200 whitespace-pre-line">{dynamic.biologyText || report.biologyProfile}</div>
        </Card>

        <Card>
          <div className="text-sm text-slate-400 mb-2">Next steps</div>
          <div className="text-sm text-slate-200 whitespace-pre-line">{dynamic.nextSteps}</div>
        </Card>

        <footer className="flex items-center justify-between border-t border-slate-800 pt-4">
          <div className="text-xs text-slate-400">Science note: {report.scienceNote}</div>
          <div className="flex items-center gap-2">
            <button className="text-xs text-slate-400 hover:text-slate-200">Download PDF</button>
            <button className="text-xs text-slate-400 hover:text-slate-200">Share summary</button>
          </div>
        </footer>
      </div>
    </div>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 md:p-5 shadow-sm">
      {children}
    </div>
  )
}

function CurveChip({ effectSize, avgEffect, userPercentile }: { effectSize: number; avgEffect: number | null; userPercentile: number | null }) {
  // Clamp user marker within -1.5..+1.5 range and map to chip width
  const min = -1.5
  const max = 1.5
  const clamped = Math.max(min, Math.min(max, effectSize))
  const percent = ((clamped - min) / (max - min)) * 100
  const avgClamped = typeof avgEffect === 'number' ? Math.max(min, Math.min(max, avgEffect)) : null
  const avgPercent = avgClamped == null ? null : ((avgClamped - min) / (max - min)) * 100
  return (
    <div className="rounded-xl bg-slate-900 p-3 border border-slate-800">
      <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
        <span>-1.5</span>
        <span>0</span>
        <span>+1.5</span>
      </div>
      <div className="relative mt-1 h-16">
        <svg viewBox="0 0 200 64" width="100%" height="64">
          <defs>
            <linearGradient id="curveFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="rgba(99,102,241,0.35)" />
              <stop offset="100%" stopColor="rgba(99,102,241,0)" />
            </linearGradient>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {/* simple bell-like curve */}
          <path d="M5,56 C35,56 55,8 100,8 C145,8 165,56 195,56 L195,60 L5,60 Z" fill="url(#curveFill)" />
          <path d="M5,56 C35,56 55,8 100,8 C145,8 165,56 195,56" fill="none" stroke="rgba(148,163,184,0.6)" strokeWidth="1.25" />
          {/* cohort average marker */}
          {avgPercent != null && (
            <g>
              <line x1={5 + (avgPercent / 100) * 190} y1="10" x2={5 + (avgPercent / 100) * 190} y2="58" stroke="rgba(255,255,255,0.4)" strokeDasharray="2 3" />
            </g>
          )}
          {/* user marker */}
          <circle
            cx={5 + (percent / 100) * 190}
            cy={18}
            r="3"
            fill="#3B6EF6"
            filter="url(#glow)"
          />
        </svg>
        <div className="absolute -top-1 text-[10px] text-slate-300" style={{ left: `calc(${percent}% - 10px)` }}>you</div>
        {avgPercent != null && (
          <div className="absolute -bottom-1 text-[10px] text-slate-400" style={{ left: `calc(${avgPercent}% - 8px)` }}>avg</div>
        )}
      </div>
      <div className="text-[10px] text-slate-400 mt-1">
        d = {effectSize.toFixed(2)} {avgEffect != null && <>• cohort avg {avgEffect.toFixed(2)}</>}
        {typeof userPercentile === 'number' && <> • you’re at {userPercentile}th percentile</>}
      </div>
    </div>
  )
}

function colorForStatus(status: string) {
  if (status === 'proven_positive') return { badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/40' }
  if (status === 'negative') return { badge: 'bg-rose-500/10 text-rose-300 border-rose-500/40' }
  if (status === 'confounded') return { badge: 'bg-amber-500/10 text-amber-300 border-amber-500/40' }
  return { badge: 'bg-slate-600/10 text-slate-300 border-slate-600/40' }
}

function generateReportCopy(report: any): { effectSummary: string; biologyText: string; nextSteps: string } {
  const fullName = String(report?.supplementName || '').trim() || 'this supplement'
  // Determine mapping key by best match (prefer longest key that appears in the full name or short name)
  const sn = shortSupplementName(fullName)
  const lcFull = fullName.toLowerCase()
  const lcShort = sn.toLowerCase()
  const keys = Object.keys(bioMap as Record<string, any>).sort((a, b) => b.length - a.length)
  const matchedKey = keys.find(k => lcFull.includes(k) || lcShort.includes(k)) || ''
  const mapped = (bioMap as any)[matchedKey] || null
  const name = (mapped?.short_name as string) || sn
  const metric = String(report?.primaryMetricLabel || 'your metric')
  const d = typeof report?.effect?.effectSize === 'number' ? Number(report.effect.effectSize) : null
  const absChange = typeof report?.effect?.absoluteChange === 'number' ? Number(report.effect.absoluteChange) : null
  const dir = String(report?.effect?.direction || '').toLowerCase() // 'positive' | 'negative' | 'neutral'
  const status = String(report?.status || '').toLowerCase()
  const conf = String(report?.confidence?.label || '').toUpperCase()
  const magnitude = d != null
    ? (Math.abs(d) >= 0.8 ? 'large' : Math.abs(d) >= 0.5 ? 'medium' : Math.abs(d) >= 0.3 ? 'moderate' : 'small')
    : 'small'
  const points = absChange != null && Number.isFinite(absChange) ? Math.round(Math.abs(absChange)) : null
  const changePhrase = points != null ? `${points} point${points === 1 ? '' : 's'}` : `a ${magnitude} amount`
  // Effect summary
  let effectSummary = ''
  if (status === 'proven_positive') {
    effectSummary = `Your ${metric} improved by ${changePhrase} on ${name}. This is a ${magnitude} positive effect${d != null ? ` (d = ${d.toFixed(2)})` : ''}, with ${conf} confidence.`
  } else if (status === 'negative') {
    effectSummary = `Your ${metric} dropped by ${changePhrase} on ${name}. This is a ${magnitude} negative effect${d != null ? ` (d = ${d.toFixed(2)})` : ''}, with ${conf} confidence.`
  } else if (status === 'no_effect' || status === 'no_detectable_effect') {
    effectSummary = `We did not detect a meaningful change in ${metric} on ${name}${d != null ? ` (d = ${d.toFixed(2)})` : ''}.`
  } else if (status === 'too_early') {
    effectSummary = `We don't have enough comparable data yet to call this one. Keep tracking and we'll update your verdict as data builds.`
  } else {
    effectSummary = `Your data shows a pattern in ${metric} when taking ${name}.`
  }
  // Biology text from mapping, chosen by direction when available
  let biologyText: string | null = null
  const dirKey = status === 'proven_positive' || dir === 'positive'
    ? 'positive'
    : (status === 'negative' || dir === 'negative') ? 'negative' : ''
  if (mapped && dirKey) {
    biologyText = (mapped as any)[dirKey] || null
  }
  if (!biologyText) {
    const dirText = dir === 'positive' ? 'your body may benefit from continued use' : dir === 'negative' ? 'this may not align with your biology at this dose' : 'the effect may be subtle or context‑dependent'
    biologyText = `This supplement targets pathways related to your primary goals. Your ${dir || 'observed'} response suggests ${dirText}.`
  }
  // Next steps by verdict
  let nextSteps = ''
  const isImplicitSrc = String(report?.analysisSource || '').toLowerCase() === 'implicit'
  if (status === 'negative' || status === 'no_effect' || status === 'no_detectable_effect') {
    if (nm.includes('magnesium')) {
      nextSteps = `Consider stopping ${name}. You could re‑test at a different dose, time of day, or form (e.g., switch from oxide to glycinate).`
    } else {
      nextSteps = `Consider stopping ${name}. You could re‑test at a different dose or time of day if you still suspect benefit.`
    }
  } else if (status === 'proven_positive') {
    nextSteps = `Keep taking ${name}. Your data supports continued use. We'll keep monitoring as more data comes in.`
  } else if (status === 'too_early') {
    nextSteps = `Keep tracking — we need more clean ON and OFF days with usable ${metric.toLowerCase()} data to give you a confident verdict.`
  } else {
    nextSteps = `Keep tracking and consider standardizing dose/timing for clearer comparisons.`
  }
  // Override for upload-only implicit analyses: encourage confirmation via check-ins
  if (isImplicitSrc) {
    nextSteps = 'Your historical data shows a promising signal. Start daily check-ins to confirm this result.'
  }
  return { effectSummary, biologyText, nextSteps }
}

function shortSupplementName(full: string): string {
  try {
    let s = full.replace(/\[[^\]]+\]/g, ' ')
    // Keep first two comma-separated parts (brand + product), drop the rest
    const parts = s.split(',').map(p => p.trim()).filter(Boolean)
    s = parts.slice(0, 2).join(' ')
    // Remove dose and count patterns
    s = s.replace(/\b\d+(\.\d+)?\s?(mg|mcg|g|iu|ml)\b/gi, ' ')
    s = s.replace(/\b\d+\s?(tablets?|capsules?|softgels?|tabs?|caps?|count)\b/gi, ' ')
    // Common container descriptors
    s = s.replace(/\b(high absorption|extra strength|time[-\s]?release|fast[-\s]?acting)\b/gi, ' ')
    s = s.replace(/\s{2,}/g, ' ').trim()
    // Prefer Brand + Key ingredient if possible
    const keyMap = ['magnesium','collagen','vitamin d','vitamin c','b complex','b-complex','melatonin','ashwagandha','creatine','omega','fish oil','zinc','glycine','theanine','probiotic']
    const lower = s.toLowerCase()
    const hit = keyMap.find(k => lower.includes(k))
    if (hit) {
      const brand = parts[0] || ''
      // If brand already includes the key, keep as-is; else combine
      const hasBrand = brand && !brand.toLowerCase().includes(hit)
      const label = hit.split(' ').map(w => w[0]?.toUpperCase() + w.slice(1)).join(' ')
      const out = (hasBrand ? `${brand} ${label}` : s).trim()
      return out.length > 60 ? out.slice(0, 60).trim() : out
    }
    return s.length > 60 ? s.slice(0, 60).trim() : s
  } catch {
    return full
  }
}

function fmt(n: number | null | undefined) {
  if (n == null || !Number.isFinite(n)) return '—'
  if (Math.abs(n) < 1) return n.toFixed(2)
  return n.toFixed(0)
}

function decisionFor(report: any): { verdict: string; recommendation: string } {
  const metric = String(report?.primaryMetricLabel || 'your metric')
  const isImplicit = String((report as any)?.analysisSource || '').toLowerCase() === 'implicit'
  switch (String(report?.status)) {
    case 'proven_positive':
      return isImplicit
        ? {
            verdict: `Signal suggests a positive effect on ${metric}.`,
            recommendation: 'Confirm with daily check-ins.'
          }
        : {
            verdict: `This supplement meaningfully improved your ${metric}.`,
            recommendation: 'Keep it in your stack.'
          }
    case 'no_detectable_effect':
      return isImplicit
        ? {
            verdict: 'No clear signal.',
            recommendation: 'Signal suggests little effect — confirm with daily check-ins.'
          }
        : {
            verdict: 'No detectable effect.',
            recommendation: `This supplement did not produce a meaningful change in your tracked symptoms or outcomes at your current dose and timing.

If you're taking it to improve how you feel or perform, consider pausing or dropping it. If you're taking it for general health, you may still choose to keep it—this test simply can't detect that kind of benefit.`
          }
    case 'no_effect':
      return isImplicit
        ? {
            verdict: `No clear signal on ${metric}.`,
            recommendation: 'Signal suggests little effect — confirm with daily check-ins.'
          }
        : {
            verdict: `This supplement did not show a clear effect on your ${metric}.`,
            recommendation: 'Consider stopping.'
          }
    case 'negative':
      return isImplicit
        ? {
            verdict: `Signal suggests little or negative effect on ${metric}.`,
            recommendation: 'Confirm with daily check-ins before making changes.'
          }
        : {
            verdict: `This supplement likely worsened your ${metric}.`,
            recommendation: 'Consider stopping.'
          }
    case 'confounded':
      return {
        verdict: 'Data are too noisy to make a confident call.',
        recommendation: 'Collect a few more clean days and retest.'
      }
    case 'too_early':
    default:
      return {
        verdict: 'We don’t have enough clean data yet.',
        recommendation: 'Keep collecting data before deciding.'
      }
  }
}

function derivePhenotype(report: any): { label: string; icon: string } | null {
  // Prefer responder label if provided from cohort comparison
  const rl = (report?.community?.responderLabel || '') as string
  if (rl) {
    const map: Record<string, { label: string; icon: string }> = {
      super_responder: { label: 'Super Responder', icon: '⚡' },
      responder: { label: 'Responder', icon: '📈' },
      non_responder: { label: 'Non‑Responder', icon: '⏸️' }
    }
    if (map[rl]) return map[rl]
  }
  // Heuristic from onset
  const onset = report?.meta?.onsetDays
  if (typeof onset === 'number') {
    if (onset <= 3) return { label: 'Fast Responder', icon: '⚡' }
    if (onset > 7) return { label: 'Slow Responder', icon: '🐢' }
  }
  return null
}

function deriveDeficiencyHint(report: any): string | null {
  const bio = (report?.biologyProfile || '').toLowerCase()
  if (!bio) return null
  if (bio.includes('deficiency') || bio.includes('depleted') || bio.includes('saturation')) {
    return 'Your response pattern suggests a possible nutrient deficit or low baseline in this pathway. Consider lab confirmation and evaluate baseline intake.'
  }
  return null
}


