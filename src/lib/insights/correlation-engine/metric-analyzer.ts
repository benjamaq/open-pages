import type { DailyEntry, MetricCorrelationConfig, MetricCorrelationResult, EffectSize, Confidence } from './types'
import { mean, cohensD as computeD, bootstrapCI, calculateMedian, calculateTertiles } from '../utils/statistics'
import { filterOutliers, getValidEntries } from '../utils/data-cleaning'

export function analyzeMetricVsMetric(
  entries: DailyEntry[],
  config: MetricCorrelationConfig
): MetricCorrelationResult | null {
  // Guard: skip self-correlation
  if (config.metric1 === config.metric2) return null
  const { metric1, metric2 } = config

  // Validate entries have both metrics
  const valid0 = getValidEntries(entries, [metric1, metric2])
  if (valid0.length < 12) return null

  // Outlier filtering on both metrics
  const valid = filterOutliers(valid0, metric1)

  let groupHigh: DailyEntry[] = []
  let groupLow: DailyEntry[] = []

  const m1Vals = valid.map((e) => (e as any)[metric1] as number).filter((v) => typeof v === 'number')

  switch (config.splitStrategy.type) {
    case 'threshold': {
      const threshold = config.splitStrategy.value!
      groupHigh = valid.filter((e) => ((e as any)[metric1] as number) >= threshold)
      groupLow = valid.filter((e) => ((e as any)[metric1] as number) < threshold)
      break
    }
    case 'median': {
      const med = calculateMedian(m1Vals)
      groupHigh = valid.filter((e) => ((e as any)[metric1] as number) >= med)
      groupLow = valid.filter((e) => ((e as any)[metric1] as number) < med)
      break
    }
    case 'tertile': {
      const [low33, high67] = calculateTertiles(m1Vals)
      groupHigh = valid.filter((e) => ((e as any)[metric1] as number) >= high67)
      groupLow = valid.filter((e) => ((e as any)[metric1] as number) <= low33)
      break
    }
  }

  if (groupHigh.length < 3 || groupLow.length < 3) return null

  const highVals = groupHigh.map((e) => (e as any)[metric2] as number)
  const lowVals = groupLow.map((e) => (e as any)[metric2] as number)

  const avgHigh = mean(highVals)
  const avgLow = mean(lowVals)
  const delta = avgLow - avgHigh // Positive => higher metric1 associated with worse metric2

  const d = computeD(highVals, lowVals)
  if (Math.abs(delta) < 1.5) return null
  if (d < 0.5) return null

  const { ciLow, ciHigh, pValue } = bootstrapCI(groupHigh, groupLow, metric2, 1000)
  if (ciLow * ciHigh < 0) return null

  const effectSize: EffectSize = d >= 0.8 ? 'large' : d >= 0.5 ? 'moderate' : 'small'
  const confidence: Confidence =
    groupHigh.length >= 5 && groupLow.length >= 5 && d >= 0.8
      ? 'high'
      : groupHigh.length >= 3 && groupLow.length >= 3 && d >= 0.5
      ? 'medium'
      : 'low'

  const result: MetricCorrelationResult = {
    type: 'metric_correlation',
    metric1,
    metric2,
    splitValue: config.splitStrategy.type === 'threshold' ? config.splitStrategy.value : undefined,
    avgHigh,
    avgLow,
    delta,
    cohensD: d,
    effectSize,
    confidence,
    ciLow,
    ciHigh,
    pValue,
    nHigh: groupHigh.length,
    nLow: groupLow.length,
    totalDays: valid.length,
  }

  return result
}


