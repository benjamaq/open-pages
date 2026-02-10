import { createClient } from '@/lib/supabase/server'

export type CohortStats = {
  sampleSize: number
  avgEffect: number | null
  distribution: { bins: number[]; counts: number[] } | null
  responderCutoffs?: { super?: number; responder?: number } | null
}

export async function getCohortStats(canonicalId: string | null, primaryMetric: string): Promise<CohortStats | null> {
  try {
    if (!canonicalId) return null
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('supplement_cohort_stats')
      .select('effect_distribution, avg_effect, median_effect, responder_cutoffs, sample_size')
      .eq('canonical_id', canonicalId)
      .maybeSingle()
    if (error || !data) return null
    const d = data as any
    const dist = d.effect_distribution as any
    return {
      sampleSize: Number(d.sample_size || 0),
      avgEffect: typeof d.avg_effect === 'number' ? d.avg_effect : null,
      distribution: dist && Array.isArray(dist.bins) && Array.isArray(dist.counts) ? { bins: dist.bins, counts: dist.counts } : null,
      responderCutoffs: (d.responder_cutoffs as any) || null
    }
  } catch {
    return null
  }
}

export function percentileFromDistribution(effectSize: number, distribution: { bins: number[]; counts: number[] } | null): number | null {
  if (!distribution) return null
  const { bins, counts } = distribution
  if (!bins.length || !counts.length || bins.length !== counts.length) return null
  const total = counts.reduce((a, b) => a + b, 0)
  if (total <= 0) return null
  // Find cumulative proportion of bins <= effectSize
  let cum = 0
  for (let i = 0; i < bins.length; i++) {
    const b = bins[i]
    if (effectSize >= b) cum += counts[i]
    else break
  }
  const pct = cum / total
  return Math.round(pct * 100)
}

export function responderLabelForPercentile(pct: number | null): string | null {
  if (pct == null) return null
  if (pct >= 80) return 'super_responder'
  if (pct >= 50) return 'responder'
  return 'non_responder'
}




