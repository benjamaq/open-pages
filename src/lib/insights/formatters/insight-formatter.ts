import type { TagCorrelationResult, MetricCorrelationResult, MedInsight, FormattedInsight } from '../correlation-engine/types'
import { TAG_DISPLAY_NAMES, METRIC_DISPLAY_NAMES } from './copy-rules'
import { generateEvidenceLink } from './evidence-link-generator'

export function formatInsight(result: any): FormattedInsight {
  if (result?.type === 'tag_correlation') return formatTagInsight(result as TagCorrelationResult)
  if (result?.type === 'metric_correlation') return formatMetricInsight(result as MetricCorrelationResult)
  if (result?.type === 'medication_effect') return formatMedInsight(result as MedInsight)
  throw new Error('Unknown insight result type')
}

export function formatTagInsight(result: TagCorrelationResult): FormattedInsight {
  const tagDisplay = TAG_DISPLAY_NAMES[result.tag] || result.tag
  const metricDisplay = METRIC_DISPLAY_NAMES[result.metric] || result.metric

  // Determine whether higher values are good or bad for this metric
  const GOOD_METRICS = new Set<string>(['mood', 'sleep_quality', 'sleep_hours'])
  const isGoodMetric = GOOD_METRICS.has(result.metric)

  // Helper: ensure we never coerce null/undefined to 0 for display or logic
  const toNum = (v: any): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null)
  const avgWith = toNum((result as any).avgWithTag)
  const avgWithout = toNum((result as any).avgWithoutTag)

  // Determine direction using available means; fall back to delta when needed
  let isWorse: boolean
  if (avgWith != null && avgWithout != null) {
    // For bad metrics (e.g., pain), higher withTag is worse; for good metrics, lower withTag is worse
    isWorse = isGoodMetric ? (avgWith < avgWithout) : (avgWith > avgWithout)
  } else if (typeof (result as any).delta === 'number') {
    // delta defined as avgWithout - avgWith in analyzers
    isWorse = isGoodMetric ? ((result as any).delta > 0) : ((result as any).delta < 0)
  } else {
    isWorse = false
  }

  const verb = result.confidence === 'high' ? 'is consistently linked to' : result.confidence === 'medium' ? 'appears linked to' : 'might be linked to'
  const magnitude = result.effectSize === 'large' ? 'significantly' : result.effectSize === 'moderate' ? 'noticeably' : ''
  const lagPhrase = result.lagDays > 0 ? ` (${result.lagDays === 1 ? 'next-day' : `${result.lagDays}-day delayed`} effect)` : ''

  let title: string
  let message: string
  let actionable: string

  const avgWithStr = avgWith != null ? avgWith.toFixed(1) : '—'
  const avgWithoutStr = avgWithout != null ? avgWithout.toFixed(1) : '—'
  const diffStr = (avgWith != null && avgWithout != null) ? Math.abs(avgWith - avgWithout).toFixed(1) : (typeof (result as any).delta === 'number' ? Math.abs((result as any).delta).toFixed(1) : '—')

  if (isWorse) {
    // Tag correlates with worse outcomes for this metric
    const dirWord = isGoodMetric ? 'lower' : 'higher'
    title = `${tagDisplay} ${verb} ${magnitude} ${dirWord} ${metricDisplay}`.trim()
    message = `On days with ${tagDisplay.toLowerCase()}, your ${metricDisplay} averages ${avgWithStr}/10 vs ${avgWithoutStr}/10 on days without it. That's a ${diffStr}-point difference${lagPhrase} (${result.nWith} vs ${result.nWithout} days).`
    const effectVerb = isGoodMetric ? 'decreasing' : 'increasing'
    actionable = `Consider reducing or avoiding ${tagDisplay.toLowerCase()} — it may be ${effectVerb} your ${metricDisplay}.`
  } else {
    // Tag correlates with better outcomes
    const dirWord = isGoodMetric ? 'higher' : 'lower'
    title = `${tagDisplay} ${verb} ${magnitude} ${dirWord} ${metricDisplay}`.trim()
    message = `With ${tagDisplay.toLowerCase()}, your ${metricDisplay} averages ${avgWithStr}/10 vs ${avgWithoutStr}/10 without it${lagPhrase} (${result.nWith} vs ${result.nWithout} days).`
    actionable = `Keep prioritizing ${tagDisplay.toLowerCase()} — it's making a measurable difference.`
  }

  return {
    type: 'tag_correlation',
    priority: result.effectSize === 'large' ? 1 : result.effectSize === 'moderate' ? 2 : 3,
    title,
    message,
    actionable,
    confidence: result.confidence,
    evidenceLink: generateEvidenceLink(result),
    insightKey: `${result.tag}_${result.metric}`,
    data: result,
    createdAt: new Date(),
  }
}

export function formatMetricInsight(result: MetricCorrelationResult): FormattedInsight {
  const metric1Display = METRIC_DISPLAY_NAMES[result.metric1] || result.metric1
  const metric2Display = METRIC_DISPLAY_NAMES[result.metric2] || result.metric2
  const title = `${metric1Display} ${result.confidence === 'high' ? 'consistently affects' : 'appears to affect'} your ${metric2Display}`
  const splitLabel = result.splitValue != null ? (result.splitValue >= 7 ? 'good' : 'poor') : 'higher'
  const message = `When your ${metric1Display} is ${splitLabel}${result.splitValue != null ? ` (≥${result.splitValue})` : ''}, your ${metric2Display} averages ${result.avgHigh.toFixed(1)}/10. When it's lower${result.splitValue != null ? ` (<${result.splitValue})` : ''}, ${metric2Display} is ${result.avgLow.toFixed(1)}/10. That's a ${Math.abs(result.delta).toFixed(1)}-point difference (${result.nHigh} vs ${result.nLow} days, Cohen's d: ${result.cohensD.toFixed(2)}).`
  const actionable = `Focus on improving your ${metric1Display}${result.splitValue != null ? ` — aim for ${result.splitValue}+ consistently` : ''}.`

  return {
    type: 'metric_correlation',
    priority: result.effectSize === 'large' ? 1 : 2,
    title,
    message,
    actionable,
    confidence: result.confidence,
    evidenceLink: generateEvidenceLink(result),
    insightKey: `${result.metric1}_${result.metric2}`,
    data: result,
    createdAt: new Date(),
  }
}

export function formatMedInsight(result: MedInsight): FormattedInsight {
  const painChange = result.painDelta > 0 ? 'dropped' : 'increased'
  const moodChange = result.moodDelta > 0 ? 'improved' : 'worsened'
  const title = `${result.medName} appears to be helping`
  const message = `After starting ${result.medName} (${result.startDate.toISOString().split('T')[0]}), your pain ${painChange} from ${result.painBefore.toFixed(1)} to ${result.painAfter.toFixed(1)} (${Math.abs(result.painDelta).toFixed(1)}-point change) over ${result.postStartDays} days. Your mood also ${moodChange} from ${result.moodBefore.toFixed(1)} to ${result.moodAfter.toFixed(1)}.`
  const actionable = `Continue taking ${result.medName} as prescribed. Discuss these improvements with your doctor at your next visit.`

  return {
    type: 'medication_effect',
    priority: 1,
    title,
    message,
    actionable,
    confidence: result.confidence,
    evidenceLink: generateEvidenceLink(result as any),
    insightKey: `med_${result.medName}`,
    data: result,
    createdAt: new Date(),
  }
}


