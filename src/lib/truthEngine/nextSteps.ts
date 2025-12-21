import type { CanonicalSupplement, EffectStats, TruthStatus } from './types'

export function buildNextSteps(ctx: {
  status: TruthStatus
  effect: EffectStats
  canonical: CanonicalSupplement | null
}): string {
  const { status } = ctx
  if (status === 'proven_positive')
    return 'Keep this in your stack. Consider a brief "3-days off, 3-days on" retest in 6–8 weeks to confirm the effect is stable, not just a lucky streak.'
  if (status === 'no_effect')
    return 'You can safely drop this from your stack for now. Your data doesn’t show a meaningful benefit at this dose and schedule.'
  if (status === 'negative')
    return 'This looks net-negative for you. Consider stopping and re-testing later at a lower dose or in a different context.'
  if (status === 'confounded')
    return 'The data’s too noisy to trust yet. If you want a clear answer, run a short, cleaner protocol with fewer alcohol or travel days.'
  return 'Let’s collect a few more clean days of data before calling it.'
}

export function buildScienceNote(canonical: CanonicalSupplement | null, mechanismLabel: string): string {
  const partA = canonical?.pathway_summary
    ? canonical.pathway_summary
    : 'This supplement targets known neurochemical pathways relevant to your metrics.'
  const partB = mechanismLabel ? ` Your pattern matches: ${mechanismLabel}.` : ''
  return `${partA}${partB}`.trim()
}




