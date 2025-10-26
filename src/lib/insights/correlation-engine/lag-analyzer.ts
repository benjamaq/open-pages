import type { DailyEntry, TagCorrelationConfig, TagCorrelationResult } from './types'
import { analyzeTagVsMetric } from './tag-analyzer'

export function findBestLag(
  entries: DailyEntry[],
  tag: string,
  metric: string,
  maxLag: number = 3
): { bestLag: number; result: TagCorrelationResult } | null {
  const candidates: Array<{ lag: number; result: TagCorrelationResult }> = []

  for (let lag = 0; lag <= maxLag; lag++) {
    const result = analyzeTagVsMetric(entries, {
      type: 'tag',
      tag,
      metric,
      lagDays: lag,
      minDaysWithTag: 3,
      minDaysWithoutTag: 5,
      minDelta: 2,
      priority: 'high',
    })
    if (result) candidates.push({ lag, result })
  }

  if (candidates.length === 0) return null
  candidates.sort((a, b) => b.result.cohensD - a.result.cohensD)
  return { bestLag: candidates[0].lag, result: candidates[0].result }
}

export function applyLag(entries: DailyEntry[], tag: string, lagDays: number): DailyEntry[] {
  if (lagDays <= 0) return entries
  return entries.map((entry, index) => {
    if (index < lagDays) return entry
    const pastEntry = entries[index - lagDays]
    const hadTagInPast = (pastEntry.tags || []).includes(tag)
    return hadTagInPast
      ? { ...entry, tags: [...(entry.tags || []), `${tag}_lagged`] }
      : entry
  })
}


