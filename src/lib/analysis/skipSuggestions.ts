export type SupplementWithSignal = {
  id: string
  name: string
  daysOn: number
  daysOff: number
  signalPercent: number
  status: 'needs_more_data' | 'building' | 'ready' | 'no_signal' | 'inconsistent'
  startDate?: string | null
  skippedYesterday?: boolean
  isDirty?: boolean
  requiredCleanDays?: number
}

export type SkipSuggestion = {
  id: string
  name: string
  reason: 'no_off_days' | 'insufficient_off_days' | 'high_uncertainty'
}

export function getSkipSuggestions(supps: SupplementWithSignal[]): SkipSuggestion[] {
  const candidates = (supps || []).filter(s =>
    (s.status === 'needs_more_data' || s.status === 'building')
  ).filter(s => {
    // exclude very new starts (< 2 days old)
    if (s.startDate) {
      try {
        const started = new Date(s.startDate).getTime()
        const now = Date.now()
        if (!isNaN(started) && now - started < 1000 * 60 * 60 * 24 * 2) return false
      } catch {}
    }
    // avoid back-to-back skipping
    if (s.skippedYesterday) return false
    // drop if extremely noisy
    if (s.isDirty) return false
    return true
  })

  // Priority: daysOff==0 highest, then <2, then <4
  type WithScore = SupplementWithSignal & { score: number; reason: SkipSuggestion['reason'] }
  const scored: WithScore[] = []
  for (const s of candidates) {
    let score = -1
    let reason: SkipSuggestion['reason'] = 'insufficient_off_days'
    if ((s.daysOff ?? 0) === 0) { score = 3; reason = 'no_off_days' }
    else if ((s.daysOff ?? 0) < 2) { score = 2; reason = 'insufficient_off_days' }
    else if ((s.daysOff ?? 0) < 4) { score = 1; reason = 'insufficient_off_days' }
    else { score = 0; }
    // if extremely noisy suggest skip to get cleaner window
    if (s.isD
      && score < 2) {
      score = 2;
      reason = 'high_uncertainty';
    }
    if (score > 0) {
      scored.push({ ...s, score, reason })
    }
  }
  scored.sort((a, b) => b.score - a.score || (a.daysOff ?? 0) - (b.daysOff ?? 0))
  return scored.slice(0, 2).map(s => ({ id: s.id, name: s.name, reason: s.reason }))
}


