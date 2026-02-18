import type { DaySample, EffectStats } from './types'

const LOWER_IS_BETTER = new Set<string>(['sleep_latency_minutes', 'resting_hr'])
const PERCENT_METRICS = new Set<string>(['deep_sleep_pct'])

export function computeEffectStats(samples: DaySample[], metricKey: string): EffectStats {
  const onVals = samples.filter(s => s.taken && !s.confounded && isFiniteNumber(s.metric)).map(s => Number(s.metric))
  const offVals = samples.filter(s => !s.taken && !s.confounded && isFiniteNumber(s.metric)).map(s => Number(s.metric))

  const meanOn = mean(onVals)
  const meanOff = mean(offVals)
  const sdOn = stddev(onVals, meanOn)
  const sdOff = stddev(offVals, meanOff)

  const sampleOn = onVals.length
  const sampleOff = offVals.length
  const rawPooledSD = pooledStd(sdOn, sdOff, sampleOn, sampleOff)
  // Floor pooled SD to prevent division-by-near-zero effect size inflation on 1–10 scales.
  const pooled = Math.max(0.5, rawPooledSD)
  if (rawPooledSD < 0.5) {
    try { console.log('[truth-engine] SD floor applied:', { raw: rawPooledSD, floored: pooled }) } catch {}
  }

  let absoluteChange = meanOn - meanOff
  // Normalize so "positive" means improved outcome
  if (LOWER_IS_BETTER.has(metricKey)) absoluteChange = (meanOff - meanOn)

  const effectSize = pooled > 0 ? absoluteChange / pooled : (absoluteChange === 0 ? 0 : (absoluteChange > 0 ? 1 : -1))
  const direction: EffectStats['direction'] =
    Math.abs(effectSize) < 0.1 ? 'neutral' : (effectSize > 0 ? 'positive' : 'negative')

  let percentChange: number | null = null
  // Truth report percentChange should be actual % change, not Cohen's d scaled.
  // ((meanOn - meanOff) / max(meanOff, 0.01)) * 100
  if (isFiniteNumber(meanOff) && Math.abs(meanOff) > 1e-9) {
    const denom = Math.max(Number(meanOff), 0.01)
    percentChange = ((meanOn - meanOff) / denom) * 100
  } else if (PERCENT_METRICS.has(metricKey) && isFiniteNumber(meanOff)) {
    // For percent metrics near 0 baseline, use a tiny denominator to avoid blowups while still providing a signal.
    percentChange = ((meanOn - meanOff) / 0.01) * 100
  }

  return {
    meanOn,
    meanOff,
    absoluteChange,
    percentChange,
    effectSize,
    direction,
    sampleOn,
    sampleOff
  }
}

export function estimateConfidence(effectSize: number, sampleOn: number, sampleOff: number): number {
  const n = Math.min(sampleOn, sampleOff)
  const sizeScore = Math.min(Math.abs(effectSize) / 0.5, 2)
  const nScore = Math.min(n / 10, 2)
  const raw = (sizeScore + nScore) / 4
  return clamp01(raw)
}

export function classifyStatus(effect: EffectStats, confidence: number): 'proven_positive' | 'no_detectable_effect' | 'negative' | 'confounded' | 'too_early' {
  // Treat very low confidence as confounded (needs more/cleaner data upstream)
  if (confidence < 0.4) return 'confounded'
  // Thresholds (aligned with truthEngine decision tree):
  // - effectSize is Cohen’s d (NOT a percent)
  // - |d| >= 0.3 is treated as a meaningful signal (small-but-real)
  // - confidence >= 0.6 required for a directional verdict
  if (Math.abs(effect.effectSize) < 0.3 || confidence < 0.6) return 'no_detectable_effect'
  if (effect.direction === 'positive') return 'proven_positive'
  if (effect.direction === 'negative') return 'negative'
  return 'no_detectable_effect'
}

function isFiniteNumber(n: unknown): n is number {
  return typeof n === 'number' && Number.isFinite(n)
}

function mean(arr: number[]): number {
  if (arr.length === 0) return 0
  return arr.reduce((a, b) => a + b, 0) / arr.length
}

function stddev(arr: number[], m: number): number {
  if (arr.length <= 1) return 0
  const v = arr.reduce((acc, x) => acc + Math.pow(x - m, 2), 0) / (arr.length - 1)
  return Math.sqrt(Math.max(v, 0))
}

function pooledStd(sd1: number, sd2: number, n1: number, n2: number): number {
  const df = (n1 - 1) + (n2 - 1)
  if (df <= 0) return 0
  const v = (((n1 - 1) * sd1 * sd1) + ((n2 - 1) * sd2 * sd2)) / df
  return Math.sqrt(Math.max(v, 0))
}

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x))
}




