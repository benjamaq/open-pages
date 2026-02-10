import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const defaults = {
      stackItems: 0,
      stackItemsLimit: 10,
      currentTier: 'free',
      isInTrial: false,
      trialEndedAt: null,
      isBetaUser: false,
      betaExpiresAt: null,
      breakdown: { supplements: 0, protocols: 0, uploads: 0, library: 0, gear: 0 }
    }
    if (!user) return NextResponse.json(defaults)
    const { data: usage } = await supabase
      .from('user_usage')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
    if (!usage) return NextResponse.json(defaults)
    return NextResponse.json({
      stackItems: (usage as any).stack_items || 0,
      stackItemsLimit: (usage as any).stack_items_limit || 10,
      currentTier: (usage as any).tier || 'free',
      isInTrial: (usage as any).is_in_trial || false,
      trialEndedAt: (usage as any).trial_ended_at || null,
      isBetaUser: (usage as any).is_beta_user || false,
      betaExpiresAt: (usage as any).beta_expires_at || null,
      breakdown: {
        supplements: (usage as any).supplements_count || 0,
        protocols: (usage as any).protocols_count || 0,
        uploads: (usage as any).uploads_count || 0,
        library: (usage as any).library_count || 0,
        gear: (usage as any).gear_count || 0,
      }
    })
  } catch (e) {
    return NextResponse.json({ ok: true })
  }
}
