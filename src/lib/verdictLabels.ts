export type TruthStatus =
  | 'proven_positive'
  | 'negative'
  | 'no_effect'
  | 'no_detectable_effect'
  | 'confounded'
  | 'too_early'

export type VerdictSurface = 'dashboard' | 'stack' | 'truth_report'

export function normalizeTruthStatus(s: unknown): TruthStatus | null {
  const v = String(s || '').toLowerCase().trim()
  if (
    v === 'proven_positive' ||
    v === 'negative' ||
    v === 'no_effect' ||
    v === 'no_detectable_effect' ||
    v === 'confounded' ||
    v === 'too_early'
  ) return v
  return null
}

export function isFinalVerdictStatus(s: unknown): boolean {
  const st = normalizeTruthStatus(s)
  // NOTE: too_early stays in Testing; confounded is treated as a completed-but-inconclusive result.
  return Boolean(st && st !== 'too_early')
}

export function verdictLabelsForStatus(args: {
  status: unknown
  surface: VerdictSurface
  primaryMetricLabel?: string | null
}): {
  // Badge text shown on each surface
  badge: string
  // For dashboard-style keys where applicable (used for unified chip styling)
  badgeKey: 'keep' | 'drop' | 'no_clear_signal' | 'inconclusive' | 'testing'
  // Recommendation copy (truth report) for final statuses
  recommendation: string | null
} {
  const st = normalizeTruthStatus(args.status)
  const metric = String(args.primaryMetricLabel || '').trim()
  const metricText = metric ? metric.toLowerCase() : 'primary outcome'

  // Defaults
  if (!st) {
    return {
      badge: args.surface === 'truth_report' ? 'TESTING' : '◐ TESTING',
      badgeKey: 'testing',
      recommendation: null,
    }
  }

  if (st === 'too_early') {
    return {
      badge: args.surface === 'truth_report' ? 'TESTING' : '◐ TESTING',
      badgeKey: 'testing',
      recommendation: null,
    }
  }

  if (st === 'confounded') {
    return {
      badge: args.surface === 'truth_report' ? 'INCONCLUSIVE' : '⚠ INCONCLUSIVE',
      badgeKey: 'inconclusive',
      recommendation: 'Too much noise in the data. Try retesting with fewer disruptions.',
    }
  }

  if (st === 'proven_positive') {
    return {
      badge: args.surface === 'truth_report' ? 'POSITIVE SIGNAL' : '✓ KEEP',
      badgeKey: 'keep',
      recommendation: 'This supplement is working for you. Keep it in your stack.',
    }
  }

  if (st === 'negative') {
    return {
      badge: args.surface === 'truth_report' ? 'NEGATIVE SIGNAL' : '✗ DROP',
      badgeKey: 'drop',
      recommendation: `This supplement appears to be hurting your ${metricText}. Consider removing it.`,
    }
  }

  // no_effect / no_detectable_effect
  return {
    badge: args.surface === 'truth_report' ? 'NO CLEAR SIGNAL' : '○ NO CLEAR SIGNAL',
    badgeKey: 'no_clear_signal',
    recommendation: "We couldn't detect a meaningful effect. You could drop this to save money, or retest.",
  }
}


