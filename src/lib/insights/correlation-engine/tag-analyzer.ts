import type { DailyEntry, TagCorrelationConfig, TagCorrelationResult, EffectSize, Confidence } from './types'
import { mean, pooledStandardDeviation, cohensD as computeD, bootstrapCI } from '../utils/statistics'
import { filterOutliers, getValidEntries } from '../utils/data-cleaning'
import { applyLag } from './lag-analyzer'

export function analyzeTagVsMetric(
  entries: DailyEntry[],
  config: TagCorrelationConfig
): TagCorrelationResult | null {
  const { tag, metric } = config
  // Production thresholds: 5 days minimum (2+2 minimum per group)
  // Enables fast pattern detection (3 with + 2 without = insight on day 5)
  // Safety: Cohen's d ≥ 0.5 and CI checks filter false positives
  const minWith = config.minDaysWithTag ?? 2
  const minWithout = config.minDaysWithoutTag ?? 2
  const minDelta = config.minDelta

  // Filter entries with required fields
  const validBase = getValidEntries(entries, ['local_date', metric])
  if (validBase.length < 5) {
    try {
      console.log('[tag-analyzer] insufficient total days', {
        tag,
        metric,
        totalValidDays: validBase.length,
      })
    } catch {}
    return null
  }

  // Apply lag if requested (shift tag forward as `${tag}_lagged`)
  const effectiveTag = (config.lagDays || 0) > 0 ? `${tag}_lagged` : tag
  const lagged = (config.lagDays || 0) > 0 ? applyLag(validBase, tag, config.lagDays || 0) : validBase

  const valid = lagged
  if (valid.length < 5) {
    try {
      console.log('[tag-analyzer] insufficient days after lag', {
        tag,
        metric,
        totalValidDays: valid.length,
        lagDays: config.lagDays || 0,
      })
    } catch {}
    return null
  }

  // Optional outlier filtering on metric
  const cleaned = filterOutliers(valid, metric)

  // Split groups
  const withTag = cleaned.filter((e) => (e.tags || []).includes(effectiveTag))
  const withoutTag = cleaned.filter((e) => !(e.tags || []).includes(effectiveTag))

  try {
    console.log('[tag-analyzer] group sizes', {
      tag,
      metric,
      effectiveTag,
      daysWithTag: withTag.length,
      daysWithoutTag: withoutTag.length,
      thresholds: { minWith, minWithout },
    })
  } catch {}

  if (withTag.length < minWith || withoutTag.length < minWithout) {
    try {
      console.log('[tag-analyzer] failing min group sizes', {
        tag,
        metric,
        effectiveTag,
        daysWithTag: withTag.length,
        daysWithoutTag: withoutTag.length,
        thresholds: { minWith, minWithout },
      })
    } catch {}
    return null
  }

  const withVals = withTag.map((e) => (e as any)[metric] as number)
  const withoutVals = withoutTag.map((e) => (e as any)[metric] as number)

  const avgWith = mean(withVals)
  const avgWithout = mean(withoutVals)
  const delta = avgWithout - avgWith // Positive => tag worsens metric (higher is worse)

  try {
    console.log('[tag-analyzer] stats (pre-threshold)', {
      tag,
      metric,
      avgWithTag: avgWith,
      avgWithoutTag: avgWithout,
      delta,
      minDelta,
    })
  } catch {}

  // Effect size (Cohen's d)
  const d = computeD(withVals, withoutVals)
  if (Math.abs(delta) < minDelta) {
    try { console.log('[tag-analyzer] rejected: delta below minDelta', { tag, metric, delta, minDelta }) } catch {}
    return null
  }
  if (d < 0.5) {
    try { console.log('[tag-analyzer] rejected: effect size below threshold', { tag, metric, d }) } catch {}
    return null
  }

  const { ciLow, ciHigh, pValue } = bootstrapCI(withTag, withoutTag, metric, 1000)
  try {
    console.log('[tag-analyzer] bootstrap', { tag, metric, ciLow, ciHigh, pValue })
  } catch {}
  if (ciLow * ciHigh < 0) {
    try { console.log('[tag-analyzer] rejected: CI crosses zero', { tag, metric, ciLow, ciHigh }) } catch {}
    return null
  }

  const effectSize: EffectSize = d >= 0.8 ? 'large' : d >= 0.5 ? 'moderate' : 'small'
  const confidence: Confidence =
    withTag.length >= 5 && withoutTag.length >= 7 && d >= 0.8
      ? 'high'
      : withTag.length >= 3 && withoutTag.length >= 5 && d >= 0.5
      ? 'medium'
      : 'low'

  const result: TagCorrelationResult = {
    type: 'tag_correlation',
    tag,
    metric,
    lagDays: Math.max(0, config.lagDays || 0),
    avgWithTag: avgWith,
    avgWithoutTag: avgWithout,
    delta,
    cohensD: d,
    effectSize,
    confidence,
    ciLow,
    ciHigh,
    pValue,
    nWith: withTag.length,
    nWithout: withoutTag.length,
    totalDays: cleaned.length,
  }

  try {
    console.log('[tag-analyzer] PASS', {
      tag,
      metric,
      nWith: result.nWith,
      nWithout: result.nWithout,
      avgWith: result.avgWithTag,
      avgWithout: result.avgWithoutTag,
      delta: result.delta,
      d: result.cohensD,
      ciLow: result.ciLow,
      ciHigh: result.ciHigh,
      pValue: result.pValue,
    })
  } catch {}

  return result
}


