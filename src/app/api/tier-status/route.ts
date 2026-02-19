import { createClient } from '../../../lib/supabase/server'
import { NextResponse } from 'next/server'
import { isProActive } from '@/lib/entitlements/pro'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Trial status (user_usage)
    const { data: usageData } = await supabase
      .from('user_usage')
      .select('is_in_trial, trial_started_at, trial_ended_at')
      .eq('user_id', user.id)
      .maybeSingle()

    // Tier is sourced from profiles so promo-Pro works without Stripe/user_usage changes.
    const { data: prof } = await supabase
      .from('profiles')
      .select('tier,pro_expires_at')
      .eq('user_id', user.id)
      .maybeSingle()

    const isInTrial = Boolean((usageData as any)?.is_in_trial)
    const tierRaw = String((prof as any)?.tier || '').toLowerCase()
    const tier =
      tierRaw === 'creator'
        ? 'creator'
        : (isInTrial || isProActive({ tier: (prof as any)?.tier, pro_expires_at: (prof as any)?.pro_expires_at }))
          ? 'pro'
          : 'free'

    const response = NextResponse.json({
      tier,
      isInTrial,
      trialStartedAt: (usageData as any)?.trial_started_at || null,
      trialEndedAt: (usageData as any)?.trial_ended_at || null,
      timestamp: Date.now()
    })

    // Add aggressive cache-busting headers
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    response.headers.set('Last-Modified', new Date().toUTCString())
    response.headers.set('ETag', `"${Date.now()}"`)
    
    return response

  } catch (error) {
    console.error('Tier status API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

