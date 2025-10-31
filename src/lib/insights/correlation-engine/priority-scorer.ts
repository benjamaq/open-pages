import type { CorrelationResult } from './types'
import { categorizeCorrelation, InsightCategory, shouldShowCorrelation } from './correlation-filters'

export interface ScoredInsight extends CorrelationResult {
  priorityScore: number
  category: InsightCategory
  showReason: string
}

export function calculatePriorityScore(result: CorrelationResult): number {
  const category = categorizeCorrelation(result)
  let score = 0
  switch (category) {
    case InsightCategory.ACTIONABLE_HIGH_VALUE: score += 1000; break
    case InsightCategory.INFORMATIVE: score += 500; break
    case InsightCategory.META_INSIGHT: score += 300; break
    default: score += 0
  }
  const d = (result as any).cohensD as number | undefined
  if (typeof d === 'number') {
    if (d >= 0.8) score += 200
    else if (d >= 0.5) score += 100
  }
  const conf = (result as any).confidence as string | undefined
  if (conf === 'high') score += 100
  else if (conf === 'medium') score += 50
  const n = ((result as any).nWith || 0) + ((result as any).nWithout || 0) + ((result as any).nHigh || 0) + ((result as any).nLow || 0)
  if (n >= 14) score += 50
  else if (n >= 10) score += 25
  const delta = Math.abs((result as any).delta ?? 0)
  if (delta >= 3) score += 50
  else if (delta >= 2) score += 25
  const p = (result as any).pValue as number | undefined
  if (typeof p === 'number') {
    if (p < 0.01) score += 50
    else if (p < 0.05) score += 25
  }
  return score
}

export function rankInsights(results: CorrelationResult[]): ScoredInsight[] {
  const valid = results.filter(shouldShowCorrelation)
  const scored = valid.map(r => ({
    ...r,
    priorityScore: calculatePriorityScore(r),
    category: categorizeCorrelation(r),
    showReason: generateShowReason(r)
  }))
  scored.sort((a, b) => b.priorityScore - a.priorityScore)
  return scored
}

function generateShowReason(result: CorrelationResult): string {
  const cat = categorizeCorrelation(result)
  switch (cat) {
    case InsightCategory.ACTIONABLE_HIGH_VALUE:
      return `Actionable: You control ${(result as any).variable1}, affects ${(result as any).variable2}`
    case InsightCategory.INFORMATIVE:
      return `Context: ${(result as any).variable1} affects ${(result as any).variable2}`
    case InsightCategory.META_INSIGHT:
      return `Pattern: ${(result as any).variable1} influences ${(result as any).variable2}`
    default:
      return 'Unknown'
  }
}


