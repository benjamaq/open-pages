import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../lib/supabase/server'

// GET /api/stack-follow/followers - Get follower count for current user
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Get user's profile - handle multiple profiles
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, user_id, slug, display_name')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    const profile = profiles && profiles.length > 0 ? profiles[0] : null

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Get follower count (handle missing tables gracefully)
    let followerCount = 0
    let newFollowersSinceLastCheck = 0
    
    try {
      // Try to get follower count from stack_followers table
      const { data: followers, error: followersError } = await supabase
        .from('stack_followers')
        .select('id, created_at')
        .eq('owner_user_id', user.id)

      if (!followersError && followers) {
        followerCount = followers.length
        
        // Calculate new followers since last check (last 24 hours)
        const oneDayAgo = new Date()
        oneDayAgo.setDate(oneDayAgo.getDate() - 1)
        
        newFollowersSinceLastCheck = followers.filter(follower => 
          new Date(follower.created_at) > oneDayAgo
        ).length
      }
    } catch (error) {
      console.log('Stack followers table not found or error:', error)
      // Gracefully handle missing table
    }

    return NextResponse.json({
      followerCount,
      newFollowersSinceLastCheck,
      profile: {
        id: profile.id,
        slug: profile.slug,
        display_name: profile.display_name
      }
    })

  } catch (error) {
    console.error('Stack follow followers error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
