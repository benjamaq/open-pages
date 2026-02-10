import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail, createFollowerNotificationEmail, createCreatorConfirmationEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      console.error('User auth error:', userError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('User ID:', user.id)
    console.log('User email:', user.email)

    // Get the user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, display_name, slug')
      .eq('user_id', user.id)
      .single()

    if (profileError) {
      console.error('Profile query error:', profileError)
      return NextResponse.json({ error: 'Profile not found', details: profileError.message }, { status: 404 })
    }

    if (!profile) {
      console.error('No profile found for user:', user.id)
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    console.log('Profile found:', profile)
    const profileAny = profile as { display_name: string; slug: string }

    const { message } = await request.json()

    // Get actual followers from the database
    const { data: followersData, error: followersError } = await supabase
      .from('stack_followers')
      .select('follower_email, created_at, verified_at')
      .eq('owner_user_id', user.id)
      .not('verified_at', 'is', null)

    if (followersError) {
      console.error('Error fetching followers:', followersError)
      // If table doesn't exist, return helpful error
      if (followersError.message?.includes('relation') || followersError.message?.includes('table')) {
        return NextResponse.json({ 
          error: 'Followers table not found. Please run the database migration first.',
          details: followersError.message 
        }, { status: 500 })
      }
      return NextResponse.json({ error: 'Failed to fetch followers', details: followersError.message }, { status: 500 })
    }

    const followers = (followersData || []) as Array<{ follower_email: string }>
    let followersNotified = 0

    console.log(`📧 Sending notifications to ${followers.length} follower(s)...`)
    
    // If no followers, return early
    if (followers.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No followers to notify',
        followersNotified: 0
      })
    }

    // Send emails to followers
    for (const follower of followers) {
      try {
        const emailData = createFollowerNotificationEmail(
          profileAny.display_name,
          profileAny.slug,
          message,
          follower.follower_email
        )
        
        console.log(`📧 Sending email to: ${follower.follower_email}`)
        const emailSent = await sendEmail(emailData)
        if (emailSent) {
          followersNotified++
          console.log(`✅ Email sent successfully to ${follower.follower_email}`)
        } else {
          console.log(`❌ Failed to send email to ${follower.follower_email}`)
        }
      } catch (error) {
        console.error(`Failed to send email to ${follower.follower_email}:`, error)
      }
    }

    // Send confirmation email to creator
    try {
      const confirmationEmail = createCreatorConfirmationEmail(
        profileAny.display_name,
        followersNotified,
        user.email || 'creator@example.com'
      )
      console.log(`📧 Sending confirmation email to creator: ${user.email}`)
      await sendEmail(confirmationEmail)
      console.log(`✅ Confirmation email sent`)
    } catch (error) {
      console.error('Failed to send confirmation email:', error)
    }

    console.log(`📧 Notify Followers: ${profileAny.display_name} sent update to ${followersNotified} follower(s): "${message}"`)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Update sent to followers',
      followersNotified
    })

  } catch (error) {
    console.error('Notify followers API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
