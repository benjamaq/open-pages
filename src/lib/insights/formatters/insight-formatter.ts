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
  const isNegative = result.delta > 0
  const tagDisplay = TAG_DISPLAY_NAMES[result.tag] || result.tag
  const metricDisplay = METRIC_DISPLAY_NAMES[result.metric] || result.metric

  const verb = result.confidence === 'high' ? 'is consistently linked to' : result.confidence === 'medium' ? 'appears linked to' : 'might be linked to'
  const magnitude = result.effectSize === 'large' ? 'significantly' : result.effectSize === 'moderate' ? 'noticeably' : ''
  const lagPhrase = result.lagDays > 0 ? ` (${result.lagDays === 1 ? 'next-day' : `${result.lagDays}-day delayed`} effect)` : ''

  let title: string
  let message: string
  let actionable: string

  if (isNegative) {
    title = `${tagDisplay} ${verb} ${magnitude} higher ${metricDisplay}`.trim()
    message = `On days with ${tagDisplay.toLowerCase()}, your ${metricDisplay} averages ${result.avgWithTag.toFixed(1)}/10, compared to ${result.avgWithoutTag.toFixed(1)}/10 on days without it. That's a ${Math.abs(result.delta).toFixed(1)}-point difference${lagPhrase} (${result.nWith} vs ${result.nWithout} days, 95% CI: ${result.ciLow.toFixed(1)} to ${result.ciHigh.toFixed(1)}).`
    actionable = `Try reducing or avoiding ${tagDisplay.toLowerCase()} for 7 days and track how you feel.`
  } else {
    title = `${tagDisplay} ${verb} ${magnitude} lower ${metricDisplay}`.trim()
    message = `Your ${metricDisplay} averages ${result.avgWithTag.toFixed(1)}/10 on days with ${tagDisplay.toLowerCase()}, compared to ${result.avgWithoutTag.toFixed(1)}/10 without it${lagPhrase} (${result.nWith} vs ${result.nWithout} days, effect size: ${result.cohensD.toFixed(2)}).`
    actionable = `Keep prioritizing ${tagDisplay.toLowerCase()} - it's making a measurable difference.`
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


