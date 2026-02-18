export type TruthStatus = 'proven_positive' | 'negative' | 'no_effect' | 'no_detectable_effect' | 'too_early' | 'confounded'

export const STATUS_TO_BADGE: Record<TruthStatus, { badge: string; color: 'green' | 'red' | 'gray'; text: string }> = {
  proven_positive: { badge: 'KEEP', color: 'green', text: "This supplement works for you" },
  negative: { badge: 'NEGATIVE', color: 'red', text: "Negative effect detected" },
  no_effect: { badge: 'NO CLEAR SIGNAL', color: 'gray', text: 'No effect detected' },
  no_detectable_effect: { badge: 'NO CLEAR SIGNAL', color: 'gray', text: 'No meaningful change detected' },
  too_early: { badge: 'TESTING', color: 'gray', text: 'Collecting data' },
  confounded: { badge: 'TESTING', color: 'gray', text: 'Data too noisy' },
}

// Canonical mapping used by the dashboard to reduce to UI categories
// These categories are the only ones the client should branch on.
export function statusToCategory(
  status: string
): 'works' | 'negative' | 'no_effect' | 'no_detectable_effect' | 'inconsistent' | 'needs_more_data' | undefined {
  const s = String(status || '').toLowerCase()
  if (s === 'proven_positive') return 'works'
  if (s === 'negative') return 'negative'
  if (s === 'no_effect') return 'no_effect'
  if (s === 'no_detectable_effect') return 'no_detectable_effect'
  if (s === 'too_early') return 'needs_more_data'
  if (s === 'confounded') return 'inconsistent'
  return undefined
}


