import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../lib/supabase/server'

// GET /api/dashboard - Get dashboard data including follower count
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Get user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, user_id, name, slug, allow_stack_follow, show_public_followers')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Get follower count (handle missing tables gracefully)
    let followerCount = 0
    let newFollowersSinceLastCheck = 0
    
    try {
      const { data: followers, error: followersError } = await supabase
        .from('stack_followers')
        .select('id, created_at')
        .eq('owner_user_id', user.id)
        .not('verified_at', 'is', null)

      if (followersError) {
        if (followersError.message?.includes('relation') || followersError.message?.includes('table')) {
          console.warn('Follow stack tables not found, using default follower count')
        } else {
          throw followersError
        }
      } else {
        followerCount = followers?.length || 0
        
        // Check for new followers in last 24 hours (for toast notification)
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
        newFollowersSinceLastCheck = followers?.filter(f => 
          new Date(f.created_at) > yesterday
        ).length || 0
      }
    } catch (error) {
      console.error('Error fetching follower count:', error)
      // Use defaults
    }

    return NextResponse.json({
      profile: {
        id: profile.id,
        name: profile.name,
        slug: profile.slug,
        allow_stack_follow: profile.allow_stack_follow || false,
        show_public_followers: profile.show_public_followers || false
      },
      followers: {
        count: followerCount,
        newSinceLastCheck: newFollowersSinceLastCheck
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
