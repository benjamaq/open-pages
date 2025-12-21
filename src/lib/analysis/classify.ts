export type EffectSummary = {
  direction: 'positive' | 'negative' | 'neutral'
  magnitude: number
  confidence: number
}

export function classifyEffect(primary: EffectSummary | null, secondary?: EffectSummary | null, trend?: { delta: number } | null) {
  // Primary decision by primary analysis
  if (primary && primary.confidence > 0.7) {
    if (primary.magnitude > 0.05) {
      return 'works'
    } else {
      return 'no_effect'
    }
  }
  // Mixed signals
  if (primary && secondary) {
    if (Math.sign(primary.magnitude) !== Math.sign(secondary.magnitude) && primary.confidence > 0.5) {
      return 'inconsistent'
    }
  }
  // Trend-only minor
  if (trend && Math.abs(trend.delta) > 0.02) {
    return 'inconsistent'
  }
  return 'needs_more_data'
}


