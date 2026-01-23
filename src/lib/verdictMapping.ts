export type TruthStatus = 'proven_positive' | 'negative' | 'no_effect' | 'no_detectable_effect' | 'too_early' | 'confounded'

export const STATUS_TO_BADGE: Record<TruthStatus, { badge: string; color: 'green' | 'red' | 'gray'; text: string }> = {
  proven_positive: { badge: 'KEEP', color: 'green', text: "This supplement works for you" },
  negative: { badge: 'DROP', color: 'red', text: "This supplement isn't helping" },
  no_effect: { badge: 'DROP', color: 'red', text: 'No effect detected' },
  no_detectable_effect: { badge: 'No detectable effect', color: 'gray', text: 'No meaningful change detected' },
  too_early: { badge: 'Testing', color: 'gray', text: 'Collecting data' },
  confounded: { badge: 'Testing', color: 'gray', text: 'Data too noisy' },
}

// Canonical mapping used by the dashboard to reduce to UI categories
// These categories are the only ones the client should branch on.
export function statusToCategory(status: string): 'works' | 'no_effect' | 'no_detectable_effect' | 'inconsistent' | 'needs_more_data' | undefined {
  const s = String(status || '').toLowerCase()
  if (s === 'proven_positive') return 'works'
  if (s === 'negative') return 'no_effect' // negative maps to DROP which uses no_effect dashboard category
  if (s === 'no_effect') return 'no_effect'
  if (s === 'no_detectable_effect') return 'no_detectable_effect'
  if (s === 'too_early') return 'needs_more_data'
  if (s === 'confounded') return 'inconsistent'
  return undefined
}


