import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../lib/supabase/server'
import { sendNewFollowerNotification } from '../../../../lib/email/resend'

// GET /api/follow/verify?token=... - Verify email-only followers
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.redirect(new URL('/verify-failed?error=missing_token', request.url))
    }

    const supabase = await createClient()

    // Find the follow request with this token
    const { data: follow, error: followError } = await supabase
      .from('stack_followers')
      .select(`
        id,
        owner_user_id,
        follower_email,
        verified_at,
        profiles:owner_user_id(name, slug)
      `)
      .eq('verify_token', token)
      .is('verified_at', null)
      .single()

    if (followError || !follow) {
      return NextResponse.redirect(new URL('/verify-failed?error=invalid_token', request.url))
    }

    // Check if token is expired (7 days)
    const createdAt = new Date(follow.created_at)
    const expiresAt = new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000)
    
    if (new Date() > expiresAt) {
      // Clean up expired token
      await supabase
        .from('stack_followers')
        .delete()
        .eq('id', follow.id)

      return NextResponse.redirect(new URL('/verify-failed?error=expired_token', request.url))
    }

    // Verify the follow
    const { error: verifyError } = await supabase
      .from('stack_followers')
      .update({
        verified_at: new Date().toISOString(),
        verify_token: null
      })
      .eq('id', follow.id)

    if (verifyError) {
      return NextResponse.redirect(new URL('/verify-failed?error=verification_failed', request.url))
    }

    // Create default email preferences
    const { error: prefsError } = await supabase
      .from('email_prefs')
      .insert({
        follower_id: follow.id,
        cadence: 'weekly'
      })

    if (prefsError) {
      console.error('Failed to create email preferences:', prefsError)
      // Continue anyway - user can set preferences later
    }

    // Send owner notification
    await sendOwnerNotification(supabase, follow.owner_user_id)

    // Redirect to success page
    const ownerName = (follow as any).profiles?.name || 'this user'
    const ownerSlug = (follow as any).profiles?.slug
    
    return NextResponse.redirect(new URL(
      `/verify-success?owner=${encodeURIComponent(ownerName)}&slug=${ownerSlug}&followId=${follow.id}`, 
      request.url
    ))

  } catch (error) {
    console.error('Verification error:', error)
    return NextResponse.redirect(new URL('/verify-failed?error=server_error', request.url))
  }
}

async function sendOwnerNotification(supabase: any, ownerUserId: string) {
  try {
    // Get owner's email and profile info
    const { data: ownerProfile, error: ownerError } = await supabase
      .from('profiles')
      .select('name, user_id')
      .eq('user_id', ownerUserId)
      .single()

    if (ownerError || !ownerProfile) {
      console.error('Failed to get owner profile for notification')
      return
    }

    // Get owner's email from auth
    const { data: ownerUser, error: userError } = await supabase.auth.admin.getUserById(ownerUserId)
    if (userError || !ownerUser.user?.email) {
      console.error('Failed to get owner email for notification')
      return
    }

    // Get current follower count
    const { data: followers, error: followersError } = await supabase
      .from('stack_followers')
      .select('id')
      .eq('owner_user_id', ownerUserId)
      .not('verified_at', 'is', null)

    const followerCount = followers?.length || 1

    // Send notification email
    await sendNewFollowerNotification(
      ownerUser.user.email,
      ownerProfile.name || 'User',
      followerCount
    )
  } catch (error) {
    console.error('Error sending owner notification:', error)
    // Don't throw - notification failures shouldn't break the follow process
  }
}
