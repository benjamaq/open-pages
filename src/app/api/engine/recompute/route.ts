import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { computeSignal } from '@/lib/engine/index'
import { upsertPatternInsight } from '@/lib/engine/persist'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Resolve profile
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()
    if (profileErr) {
      return NextResponse.json({ error: 'Failed to load profile', details: profileErr.message }, { status: 500 })
    }
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Get all supplements for this profile
    let { data: items, error: itemsErr } = await supabase
      .from('stack_items')
      .select('id,name,item_type')
      .eq('profile_id', (profile as any).id)
      .eq('item_type', 'supplements')
      .order('created_at', { ascending: false })

    if (itemsErr) {
      return NextResponse.json({ error: 'Failed to load stack items', details: itemsErr.message }, { status: 500 })
    }

    // Fallback: if none tagged as 'supplements', try all items for profile
    if (!items || items.length === 0) {
      const alt = await supabase
        .from('stack_items')
        .select('id,name,item_type')
        .eq('profile_id', (profile as any).id)
        .order('created_at', { ascending: false })
      if (alt.error) {
        return NextResponse.json({ error: 'Failed to load stack items (fallback)', details: alt.error.message }, { status: 500 })
      }
      items = alt.data || []
    }

    const results: Array<{
      id: string
      name: string
      n: number
      effectPct: number
      confidence: number
      status: string
    }> = []

    for (const it of items || []) {
      try {
        const interventionId = (it as any).id as string
        const name = (it as any).name as string
        // Run analysis over a longer window; metric = sleep_quality per current implementation
        const signal = await computeSoundSignal(user.id, interventionId)

        results.push({
          id: interventionId,
          name,
          n: signal.n,
          effectPct: signal.effectPct,
          confidence: signal.confidence,
          status: (signal as any).status || 'testing'
        })

        // Persist if we have meaningful data
        if ((signal.n || 0) > 0 && (signal.confidence || 0) >= 0) {
          await upsertPatternInsight({
            profileId: (profile as any).id,
            interventionId,
            metric: 'sleep_quality',
            effectPct: signal.effectPct ?? 0,
            confidence: signal.confidence ?? 0,
            n: signal.n ?? 0,
            status: (signal as any).status || 'testing',
            preMean: (signal as any).preMean ?? null,
            postMean: (signal as any).postMean ?? null
          })
        }
      } catch (e: any) {
        // Continue with next item
        results.push({
          id: (it as any).id,
          name: (it as any).name,
          n: 0,
          effectPct: 0,
          confidence: 0,
          status: 'error'
        })
      }
    }

    return NextResponse.json({
      profileId: (profile as any).id,
      count: results.length,
      results
    })
  } catch (e: any) {
    return NextResponse.json({ error: 'recompute failed', details: e?.message || String(e) }, { status: 500 })
  }
}

/**
 * Small wrapper to run the truth engine with our defaults.
 * Uses 'sleep_quality' metric over a 365d window.
 */
async function computeSoundSignal(
  userId: string,
  interventionId: string
): Promise<{ n: number; effectPct: number; confidence: number; status: string; preMean?: number; postMean?: number }> {
  const signal = await computeSignal(userId, interventionId, '365d', 'sleep_quality')
  return {
    n: signal.n,
    effectPct: signal.effectPct,
    confidence: signal.confidence,
    status: (signal as any).status || 'testing',
    preMean: (signal as any).preMean,
    postMean: (signal as any).postMean
  }
}

