import { NextRequest, NextResponse } from 'next/server'
import { sendWelcomeEmail, sendNewFollowerNotification } from '../../../lib/email/resend'

// Use a service-role client to bypass RLS for public follow actions
import { createClient as createServiceClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    console.log('🟢 API /api/follow-simple called')
    const rawBody = await request.json()
    console.log('🟢 Request body:', rawBody)
    const { ownerUserId, email } = rawBody
    
    console.log('🔍 Simple follow API received:', { ownerUserId, email })

    if (!ownerUserId) {
      return NextResponse.json({ error: 'Owner user ID is required' }, { status: 400 })
    }

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !serviceKey) {
      console.error('Missing Supabase envs', { hasUrl: !!url, hasServiceKey: !!serviceKey })
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
    }
    const supabase = createServiceClient(url, serviceKey)

    // SECURITY: Rate limiting - check if email has made too many follow requests recently
    const { count: recentFollows } = await supabase
      .from('stack_followers')
      .select('*', { count: 'exact', head: true })
      .eq('follower_email', email)
      .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()) // Last hour
    console.log('🟢 Rate limit check count:', recentFollows)

    if (recentFollows && recentFollows > 10) {
      return NextResponse.json({ error: 'Too many follow requests. Please try again later.' }, { status: 429 })
    }

    // Check if owner allows followers
    const { data: ownerProfile, error: ownerError } = await supabase
      .from('profiles')
      .select('allow_stack_follow, display_name, slug, user_id')
      .eq('user_id', ownerUserId)
      .single()
    console.log('🟢 Owner profile result:', ownerProfile, ownerError)

    if (ownerError || !ownerProfile) {
      console.error('❌ Profile not found:', ownerError)
      return NextResponse.json({ error: 'Owner profile not found' }, { status: 404 })
    }

    if (!ownerProfile.allow_stack_follow) {
      return NextResponse.json({ error: 'This user does not allow followers' }, { status: 400 })
    }

    // No authentication required for following public stacks

    // Check if already following to prevent duplicates
    const { data: existingFollow, error: checkError } = await supabase
      .from('stack_followers')
      .select('id, verified_at')
      .eq('owner_user_id', ownerUserId)
      .eq('follower_email', email)
      .single()
    console.log('🟢 Existing follow result:', existingFollow, checkError)

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('❌ Error checking existing follow:', checkError)
      return NextResponse.json({ error: 'Failed to check follow status' }, { status: 500 })
    }

    if (existingFollow) {
      if (existingFollow.verified_at) {
        return NextResponse.json({ 
          status: 'already_following',
          message: `You're already following ${ownerProfile.display_name}'s stack!`
        })
      } else {
        // Update existing unverified follow
        const { error: updateError } = await supabase
          .from('stack_followers')
          .update({ verified_at: new Date().toISOString() })
          .eq('id', existingFollow.id)
        console.log('🟢 Update existing follow error:', updateError)

        if (updateError) {
          console.error('Error updating follow:', updateError)
          return NextResponse.json({ error: 'Failed to update follow status' }, { status: 500 })
        }

        return NextResponse.json({ 
          status: 'following',
          message: `You're now following ${ownerProfile.display_name}'s stack!`
        })
      }
    }

    // Try to insert into database
    const { data: newFollow, error: followError } = await supabase
      .from('stack_followers')
      .insert({
        owner_user_id: ownerUserId,
        follower_user_id: null, // Anonymous follow - no user ID
        follower_email: email,
        verified_at: new Date().toISOString() // Auto-verify for now
      })
      .select('id')
      .single()
    console.log('🟢 Insert follow result:', newFollow, followError)

    if (followError) {
      console.error('Error creating follow:', followError)
      console.error('Follow error details:', JSON.stringify(followError, null, 2))
      
      // Handle specific error cases
      if (followError.code === '23505') { // Unique constraint violation
        return NextResponse.json({ 
          status: 'already_following',
          message: `You're already following ${ownerProfile.display_name}'s stack!`
        })
      }
      
      return NextResponse.json({ 
        error: 'Failed to create follow',
        details: followError.message 
      }, { status: 500 })
    }

    // Create email preferences
    const { error: prefsError } = await supabase
      .from('email_prefs')
      .insert({
        follower_id: newFollow.id,
        cadence: 'weekly'
      })
    console.log('🟢 Insert email_prefs error:', prefsError)

    if (prefsError) {
      console.error('Error creating email preferences:', prefsError)
      // Don't fail the whole operation for prefs error
    }

    console.log('✅ Follow created in database:', {
      owner: ownerProfile.display_name,
      email: email,
      followId: newFollow.id,
      timestamp: new Date().toISOString()
    })

    // Send welcome email to follower
    try {
      console.log('📧 Sending welcome email to:', email)
      console.log('📧 Owner name:', ownerProfile.display_name)
      const welcomeResult = await sendWelcomeEmail(email, ownerProfile.display_name)
      console.log('📧 Welcome email result:', welcomeResult)
      if (welcomeResult.success) {
        console.log('✅ Welcome email sent successfully')
      } else {
        console.error('❌ Failed to send welcome email:', welcomeResult.error)
      }
    } catch (emailError) {
      console.error('❌ Error sending welcome email:', emailError)
      // Don't fail the follow if email fails
    }

    // Send notification to owner about new follower
    try {
      // Get owner's email from auth
      const { data: ownerAuth } = await supabase.auth.admin.getUserById(ownerUserId)
      console.log('🟢 Owner auth lookup:', ownerAuth?.user?.email)
      const ownerEmail = ownerAuth?.user?.email

      if (ownerEmail) {
        // Get total follower count for notification
        const { count: totalFollowers } = await supabase
          .from('stack_followers')
          .select('*', { count: 'exact', head: true })
          .eq('owner_user_id', ownerUserId)
          .not('verified_at', 'is', null)

        console.log('📧 Sending new follower notification to owner:', ownerEmail)
        const notificationResult = await sendNewFollowerNotification(
          ownerEmail,
          ownerProfile.display_name,
          totalFollowers || 1
        )
        console.log('🟢 Owner notification result:', notificationResult)
        if (notificationResult.success) {
          console.log('✅ New follower notification sent successfully')
        } else {
          console.error('❌ Failed to send new follower notification:', notificationResult.error)
        }
      } else {
        console.warn('⚠️ Could not get owner email for notification')
      }
    } catch (notificationError) {
      console.error('❌ Error sending new follower notification:', notificationError)
      // Don't fail the follow if notification fails
    }

    const payload = { 
      status: 'following',
      message: `You're now following ${ownerProfile.display_name}'s stack!`,
      owner: ownerProfile.display_name
    }
    console.log('🟢 Returning:', payload)
    return NextResponse.json(payload)

  } catch (error) {
    console.error('❌ Simple follow API error:', error)
    return NextResponse.json({ error: 'Follow failed', details: error.message }, { status: 500 })
  }
}
