import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../lib/supabase/server'
import { revalidatePath } from 'next/cache'

// PATCH /api/stack-follow/settings - Update owner's follow settings
export async function PATCH(request: NextRequest) {
  try {
    const { allow, showPublicFollowers } = await request.json()

    if (allow !== undefined && typeof allow !== 'boolean') {
      return NextResponse.json({ error: 'Allow parameter must be boolean' }, { status: 400 })
    }

    if (showPublicFollowers !== undefined && typeof showPublicFollowers !== 'boolean') {
      return NextResponse.json({ error: 'ShowPublicFollowers parameter must be boolean' }, { status: 400 })
    }

    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Prepare update data
    const updateData: any = {}
    if (allow !== undefined) updateData.allow_stack_follow = allow
    if (showPublicFollowers !== undefined) updateData.show_public_followers = showPublicFollowers

    // Update the profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Database update error:', updateError)
      return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
    }

    // If disabling follows, optionally notify existing followers
    if (!allow) {
      // Could send notification emails to existing followers here
      console.log('Stack following disabled - existing followers will stop receiving updates')
    }

    // Revalidate relevant pages - handle multiple profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('slug')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (profiles && profiles.length > 0) {
      revalidatePath(`/u/${profiles[0].slug}`)
    }
    revalidatePath('/dash/settings')

    return NextResponse.json({ 
      status: 'updated',
      allow_stack_follow: allow,
      show_public_followers: showPublicFollowers
    })

  } catch (error) {
    console.error('Stack follow settings error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/stack-follow/followers - Get followers list for owner
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Get followers with email preferences (handle missing tables gracefully)
    let followers: any[] = []
    
    try {
      const { data: followersData, error: followersError } = await supabase
        .from('stack_followers')
        .select(`
          id,
          follower_user_id,
          follower_email,
          verified_at,
          created_at,
          profiles:follower_user_id(name, slug),
          email_prefs:email_prefs(cadence, last_digest_sent_at)
        `)
        .eq('owner_user_id', user.id)
        .not('verified_at', 'is', null)
        .order('created_at', { ascending: false })

      if (followersError) {
        // If tables don't exist yet, return empty list
        if (followersError.message?.includes('relation') || followersError.message?.includes('table')) {
          console.warn('Follow stack tables not found, returning empty followers list')
          followers = []
        } else {
          throw followersError
        }
      } else {
        followers = followersData || []
      }
    } catch (error) {
      console.error('Error fetching followers:', error)
      // Return empty list rather than error - feature will work with defaults
      followers = []
    }

    // Format the response with masked emails for privacy
    const formattedFollowers = (followers || []).map(follower => ({
      id: follower.id,
      type: follower.follower_user_id ? 'user' : 'email',
      name: (follower as any).profiles?.name || null,
      slug: (follower as any).profiles?.slug || null,
      email: follower.follower_email ? maskEmail(follower.follower_email) : null,
      cadence: (follower as any).email_prefs?.cadence || 'weekly',
      followedAt: follower.created_at,
      lastDigestSent: (follower as any).email_prefs?.last_digest_sent_at || null
    }))

    return NextResponse.json({
      followers: formattedFollowers,
      total: formattedFollowers.length
    })

  } catch (error) {
    console.error('Get followers error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function maskEmail(email: string): string {
  const [username, domain] = email.split('@')
  if (username.length <= 2) {
    return email
  }
  const masked = username[0] + '*'.repeat(username.length - 2) + username[username.length - 1]
  return `${masked}@${domain}`
}
