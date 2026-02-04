import type { CanonicalSupplement, EffectStats, TruthStatus } from './types'

export function buildNextSteps(ctx: {
  status: TruthStatus
  effect: EffectStats
  canonical: CanonicalSupplement | null
  analysisSource?: 'explicit' | 'implicit'
}): string {
  const { status, analysisSource } = ctx
  const implicit = analysisSource === 'implicit'
  if (implicit) {
    if (status === 'proven_positive') {
      const sup = String(ctx?.canonical?.name || '').trim()
      const namePart = sup ? ` for ${sup}` : ''
      return `Your historical data shows a promising signal${namePart}. Start daily check-ins to confirm this result.`
    }
    if (status === 'negative')
      return 'Your historical data shows a negative signal. It may be unlikely to matter — consider dropping or confirm with a short active test.'
    if (status === 'no_effect' || status === 'no_detectable_effect')
      return 'No clear signal from historical data. Consider a short active test with daily check-ins to confirm, or remove it from your stack.'
    if (status === 'confounded')
      return 'Historical data are too noisy to trust. Start a short active test with daily check-ins to get a clear answer.'
    return 'We need more data. Start active testing with daily check-ins to build a clearer picture.'
  }
  // explicit
  if (status === 'proven_positive')
    return 'Keep this in your stack. Active testing confirms a measurable benefit.'
  if (status === 'no_effect' || status === 'no_detectable_effect')
    return 'Active testing did not show a measurable benefit at this dose and schedule. Consider stopping.'
  if (status === 'negative')
    return 'Active testing suggests this is net‑negative for you. Consider stopping.'
  if (status === 'confounded')
    return 'The data’s too noisy to trust yet. If you want a clear answer, run a short, cleaner protocol with fewer confounds.'
  return 'Let’s collect a few more clean days of data before calling it.'
}

export function buildScienceNote(canonical: CanonicalSupplement | null, mechanismLabel: string): string {
  const partA = canonical?.pathway_summary
    ? canonical.pathway_summary
    : 'This supplement targets known neurochemical pathways relevant to your metrics.'
  const partB = mechanismLabel ? ` Your pattern matches: ${mechanismLabel}.` : ''
  return `${partA}${partB}`.trim()
}




