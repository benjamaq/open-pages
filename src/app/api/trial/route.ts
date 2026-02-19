import { createClient } from '../../../lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { isProActive } from '@/lib/entitlements/pro'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get user's trial information (user_usage)
    const { data: usageData, error: usageError } = await supabase
      .from('user_usage')
      .select('is_in_trial, trial_started_at, trial_ended_at')
      .eq('user_id', user.id)
      .maybeSingle()

    if (usageError) {
      console.error('Error fetching trial data:', usageError)
      return NextResponse.json({ error: 'Failed to fetch trial data' }, { status: 500 })
    }

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

    return NextResponse.json({
      tier,
      isInTrial,
      trialStartedAt: (usageData as any)?.trial_started_at || null,
      trialEndedAt: (usageData as any)?.trial_ended_at || null
    })

  } catch (error) {
    console.error('Error in trial API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body

    if (action === 'start_trial') {
      // Start a 14-day trial
      const trialStart = new Date()
      const trialEnd = new Date(trialStart.getTime() + 14 * 24 * 60 * 60 * 1000)

      const { error: updateError } = await (supabase as any)
        .from('user_usage')
        .update({
          is_in_trial: true,
          trial_started_at: trialStart.toISOString(),
          trial_ended_at: trialEnd.toISOString(),
          tier: 'pro' // During trial, they get pro features
        } as any)
        .eq('user_id', user.id)

      if (updateError) {
        console.error('Error starting trial:', updateError)
        return NextResponse.json({ error: 'Failed to start trial' }, { status: 500 })
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Trial started successfully',
        trialEndsAt: trialEnd.toISOString()
      })
    }

    if (action === 'end_trial') {
      // End the trial and revert to free
      const { error: updateError } = await (supabase as any)
        .from('user_usage')
        .update({
          is_in_trial: false,
          tier: 'free'
        } as any)
        .eq('user_id', user.id)

      if (updateError) {
        console.error('Error ending trial:', updateError)
        return NextResponse.json({ error: 'Failed to end trial' }, { status: 500 })
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Trial ended successfully'
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('Error in trial API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

