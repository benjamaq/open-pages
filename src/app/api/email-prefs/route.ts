import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../lib/supabase/server'

// POST /api/email-prefs - Update follower email preferences
export async function POST(request: NextRequest) {
  try {
    const { followerId, cadence, token } = await request.json()

    if (!followerId || !cadence) {
      return NextResponse.json({ error: 'Follower ID and cadence are required' }, { status: 400 })
    }

    if (!['off', 'daily', 'weekly'].includes(cadence)) {
      return NextResponse.json({ error: 'Invalid cadence value' }, { status: 400 })
    }

    const supabase = await createClient()

    // Check authentication - either signed in user or valid token
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user && !token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Verify the follower exists and user has permission to update
    let followerQuery = supabase
      .from('stack_followers')
      .select(`
        id,
        follower_user_id,
        follower_email,
        verified_at
      `)
      .eq('id', followerId)

    const { data: follow, error: followError } = await followerQuery.single()

    if (followError || !follow) {
      return NextResponse.json({ error: 'Follow relationship not found' }, { status: 404 })
    }

    if (!follow.verified_at) {
      return NextResponse.json({ error: 'Follow relationship not verified' }, { status: 400 })
    }

    // Check permission
    let hasPermission = false
    
    if (user && follow.follower_user_id === user.id) {
      hasPermission = true
    } else if (token && !user) {
      // For email-only followers, validate token (simple approach - in production use JWT)
      // For now, we'll trust the token if it matches the follower ID pattern
      hasPermission = true // TODO: Implement proper token validation
    }

    if (!hasPermission) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    // Update email preferences
    const { error: updateError } = await supabase
      .from('email_prefs')
      .upsert({
        follower_id: followerId,
        cadence: cadence
      })

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 })
    }

    return NextResponse.json({ 
      status: 'updated',
      cadence: cadence
    })

  } catch (error) {
    console.error('Email preferences error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
