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

    // Get user's trial status from user_usage table
    const { data: usageData, error: usageError } = await supabase
      .from('user_usage')
      .select('trial_started_at, trial_ended_at, is_in_trial')
      .eq('user_id', user.id)
      .single()

    if (usageError) {
      console.error('Error fetching trial status:', usageError)
      return NextResponse.json({ error: 'Failed to fetch trial status' }, { status: 500 })
    }

    if (!usageData) {
      return NextResponse.json({ 
        isInTrial: false, 
        daysRemaining: 0, 
        trialStartedAt: null, 
        trialEndedAt: null 
      })
    }

    // Calculate trial status
    const now = new Date()
    const trialStartedAt = usageData.trial_started_at ? new Date(usageData.trial_started_at) : null
    const trialEndedAt = usageData.trial_ended_at ? new Date(usageData.trial_ended_at) : null
    
    let isInTrial = false
    let daysRemaining = 0

    if (trialStartedAt && usageData.is_in_trial) {
      // Check if trial is still active (14 days from start)
      const trialEndDate = new Date(trialStartedAt.getTime() + (14 * 24 * 60 * 60 * 1000))
      const timeDiff = trialEndDate.getTime() - now.getTime()
      daysRemaining = Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)))
      
      // Trial is active if it hasn't ended and hasn't been 14 days yet
      isInTrial = timeDiff > 0 && !trialEndedAt
    }

    return NextResponse.json({
      isInTrial,
      daysRemaining,
      trialStartedAt: trialStartedAt?.toISOString() || null,
      trialEndedAt: trialEndedAt?.toISOString() || null
    })

  } catch (error) {
    console.error('Trial status API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
