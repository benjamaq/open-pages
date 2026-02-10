'use server'

import { createClient } from '@/lib/supabase/server'

type PersistArgs = {
  profileId: string
  interventionId: string
  metric: string
  effectPct: number
  confidence: number
  n: number
  status: 'confirmed' | 'hurting' | 'no_effect' | 'testing' | 'insufficient' | 'protective' | 'confounded' | 'loading'
  preMean?: number | null
  postMean?: number | null
}

export async function upsertPatternInsight(args: PersistArgs) {
  try {
    const supabase = await createClient()
    const effect_size = (args.effectPct ?? 0) / 100
    const confidence_score = (args.confidence ?? 0) / 100
    const sample_size = args.n ?? 0
    const mappedStatus =
      (args.status === 'confirmed' || args.status === 'protective')
        ? 'significant'
        : (args.status === 'hurting')
        ? 'negative'
        : 'inconclusive'
    const payload = {
      profile_id: args.profileId,
      intervention_id: args.interventionId,
      metric: args.metric,
      effect_size,
      confidence_score,
      sample_size,
      status: mappedStatus,
      pre_mean: args.preMean ?? null,
      post_mean: args.postMean ?? null
    } as any
    const { data, error } = await supabase
      .from('pattern_insights')
      .upsert(payload, { onConflict: 'profile_id,intervention_id,metric' })
      .select('id')
      .maybeSingle()
    if (error) {
      console.error('❌ upsertPatternInsight error:', error)
      return { ok: false, error }
    }
    console.log('📝 pattern_insights upserted for', args.interventionId, 'metric', args.metric, '→', (data as any)?.id)
    return { ok: true, id: (data as any)?.id ?? null }
  } catch (e) {
    console.error('💥 upsertPatternInsight fatal:', e)
    return { ok: false, error: e }
  }
}


