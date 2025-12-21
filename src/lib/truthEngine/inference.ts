import type { CanonicalSupplement, EffectStats, TruthStatus } from './types'
import { mechanismInferenceRules, mechanismTemplates } from './mechanismTemplates'
import { biologyProfiles } from './biologyTemplates'

export function inferMechanism(ctx: {
  canonical: CanonicalSupplement | null
  effect: EffectStats
  status: TruthStatus
  primaryMetric: string
  secondaryMetrics?: Record<string, EffectStats>
}): { mechanismLabel: string; mechanismText: string } {
  const tags = (ctx.canonical?.mechanism_tags || []).map(t => t.toLowerCase())
  const dir = ctx.effect.direction
  const metric = ctx.primaryMetric

  for (const rule of mechanismInferenceRules) {
    const hasTag = rule.tags.some(t => tags.includes(t.toLowerCase()))
    if (hasTag && rule.primaryMetric === metric && rule.direction === dir) {
      const tpl = mechanismTemplates[rule.templateId]
      if (tpl) return { mechanismLabel: tpl.label, mechanismText: tpl.text }
    }
  }
  // Fallback
  return {
    mechanismLabel: 'General responder',
    mechanismText: 'Your data shows a consistent pattern on the tested metric. We’ll refine the mechanism call as more data accumulates.'
  }
}

export function inferBiologyProfile(ctx: {
  canonical: CanonicalSupplement | null
  effect: EffectStats
  status: TruthStatus
  primaryMetric: string
}): string {
  const tags = (ctx.canonical?.mechanism_tags || []).map(t => t.toLowerCase())
  const suppName = (ctx.canonical?.name || '').toLowerCase()

  for (const rule of biologyProfiles) {
    const tagOk = rule.conditions.mechanismTag ? tags.includes(rule.conditions.mechanismTag.toLowerCase()) : true
    const metricOk = rule.conditions.metric ? rule.conditions.metric === ctx.primaryMetric : true
    const dirOk = rule.conditions.direction ? rule.conditions.direction === ctx.effect.direction : true
    const nameOk = rule.conditions.supplementNameLike ? suppName.includes(rule.conditions.supplementNameLike.toLowerCase()) : true
    if (tagOk && metricOk && dirOk && nameOk) return rule.text
  }
  // Fallback
  return 'Your response points to a pathway-level sensitivity on the tested metric. As we collect more clean days and related markers, we’ll pinpoint the biology more precisely.'
}




