import type { CorrelationResult } from '../correlation-engine/types'

export function generateEvidenceLink(result: CorrelationResult): string {
  // Use insight key format to match evidence API contract
  const key = (result as any).type === 'tag_correlation'
    ? `${(result as any).tag}_${(result as any).metric}`
    : (result as any).type === 'metric_correlation'
    ? `${(result as any).metric1}_${(result as any).metric2}`
    : (result as any).type === 'medication_effect'
    ? `med_${(result as any).medName}`
    : 'insight'
  const params = new URLSearchParams({ insightKey: key })
  return `/insights/evidence?${params.toString()}`
}


