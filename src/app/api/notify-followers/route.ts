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

    const { message } = await request.json()

    // For now, simulate followers with creator's own email for testing
    // In production, you'd query the stack_followers table
    const followers = [
      { email: user.email || 'creator@example.com', name: profile.display_name }
    ]

    let followersNotified = 0

    console.log(`📧 Sending notifications to ${followers.length} follower(s)...`)

    // Send emails to followers
    for (const follower of followers) {
      try {
        const emailData = createFollowerNotificationEmail(
          profile.display_name,
          profile.slug,
          message,
          follower.email
        )
        
        console.log(`📧 Sending email to: ${follower.email}`)
        const emailSent = await sendEmail(emailData)
        if (emailSent) {
          followersNotified++
          console.log(`✅ Email sent successfully to ${follower.email}`)
        } else {
          console.log(`❌ Failed to send email to ${follower.email}`)
        }
      } catch (error) {
        console.error(`Failed to send email to ${follower.email}:`, error)
      }
    }

    // Send confirmation email to creator
    try {
      const confirmationEmail = createCreatorConfirmationEmail(
        profile.display_name,
        followersNotified,
        user.email || 'creator@example.com'
      )
      console.log(`📧 Sending confirmation email to creator: ${user.email}`)
      await sendEmail(confirmationEmail)
      console.log(`✅ Confirmation email sent`)
    } catch (error) {
      console.error('Failed to send confirmation email:', error)
    }

    console.log(`📧 Notify Followers: ${profile.display_name} sent update to ${followersNotified} follower(s): "${message}"`)
    
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
