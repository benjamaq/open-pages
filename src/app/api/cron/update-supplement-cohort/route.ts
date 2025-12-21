import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()
    // Fetch canonical ids present in reports
    const { data: reports } = await supabase
      .from('supplement_truth_reports')
      .select('canonical_id, primary_metric, effect_size, status, confidence_score')
      .not('canonical_id', 'is', null)
    const byKey = new Map<string, number[]>()
    const byCanonicalMetric = new Map<string, { canonical_id: string; primary_metric: string }>()
    for (const r of (reports || [])) {
      if (!r.canonical_id || !r.primary_metric) continue
      if (!r.status || !['proven_positive', 'no_effect', 'negative'].includes(String(r.status))) continue
      if (typeof r.confidence_score === 'number' && r.confidence_score < 0.4) continue
      const key = `${r.canonical_id}__${r.primary_metric}`
      const arr = byKey.get(key) || []
      if (typeof r.effect_size === 'number') {
        arr.push(r.effect_size)
      }
      byKey.set(key, arr)
      byCanonicalMetric.set(key, { canonical_id: r.canonical_id, primary_metric: r.primary_metric })
    }
    // Build distributions
    for (const [key, list] of byKey.entries()) {
      list.sort((a, b) => a - b)
      const bins: number[] = []
      const counts: number[] = []
      // Simple histogram -1.5 .. +1.5 step 0.1
      for (let b = -1.5; b <= 1.5 + 1e-9; b = Math.round((b + 0.1) * 10) / 10) {
        bins.push(Number(b.toFixed(1)))
        counts.push(0)
      }
      for (const v of list) {
        const idx = Math.max(0, Math.min(bins.length - 1, Math.floor((v + 1.5) / 0.1)))
        counts[idx] = (counts[idx] || 0) + 1
      }
      const avg = list.length ? list.reduce((a, b) => a + b, 0) / list.length : null
      const median = list.length ? (list.length % 2 ? list[(list.length - 1) / 2] : (list[list.length / 2 - 1] + list[list.length / 2]) / 2) : null
      const { canonical_id, primary_metric } = byCanonicalMetric.get(key)!
      const payload = {
        canonical_id,
        primary_metric,
        effect_distribution: { bins, counts },
        avg_effect: avg,
        median_effect: median,
        responder_cutoffs: { super: 0.8, responder: 0.5 },
        sample_size: list.length,
        updated_at: new Date().toISOString()
      }
      // Upsert per canonical_id
      await supabase.from('supplement_cohort_stats').upsert(payload, { onConflict: 'canonical_id' })
    }
    return NextResponse.json({ ok: true, updated: byKey.size })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 })
  }
}




