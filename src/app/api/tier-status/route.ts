import { createClient } from '../../../lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get fresh tier information from user_usage
    const { data: usageData, error: usageError } = await supabase
      .from('user_usage')
      .select('tier, is_in_trial, trial_started_at, trial_ended_at')
      .eq('user_id', user.id)
      .single()

    if (usageError || !usageData) {
      return NextResponse.json({ 
        tier: 'free',
        isInTrial: false,
        trialStartedAt: null,
        trialEndedAt: null
      })
    }

    const response = NextResponse.json({
      tier: usageData.tier || 'free',
      isInTrial: usageData.is_in_trial || false,
      trialStartedAt: usageData.trial_started_at,
      trialEndedAt: usageData.trial_ended_at,
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

