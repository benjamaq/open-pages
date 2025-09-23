import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../lib/supabase/server'
// import { sendEmail, sendNewFollowerNotification } from '../../../lib/email/resend'
import crypto from 'crypto'

// POST /api/follow - Follow a user's stack
export async function POST(request: NextRequest) {
  try {
    const { ownerUserId, email } = await request.json()

    console.log('🔍 Follow API received:', { ownerUserId, email })

    if (!ownerUserId) {
      return NextResponse.json({ error: 'Owner user ID is required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Check if owner allows followers
    console.log('🔍 Looking up profile for user_id:', ownerUserId)
    const { data: ownerProfile, error: ownerError } = await supabase
      .from('profiles')
      .select('allow_stack_follow, display_name, slug, user_id')
      .eq('user_id', ownerUserId)
      .single()

    console.log('🔍 Profile query result:', { ownerProfile, ownerError })
    console.log('🔍 Owner profile data:', ownerProfile)
    console.log('🔍 Owner error details:', ownerError)

    if (ownerError || !ownerProfile) {
      console.error('❌ Profile not found:', ownerError)
      console.error('❌ Owner profile data:', ownerProfile)
      return NextResponse.json({ error: 'Owner profile not found' }, { status: 404 })
    }

    if (!ownerProfile.allow_stack_follow) {
      return NextResponse.json({ error: 'This user does not allow followers' }, { status: 400 })
    }

    // Get current user (if signed in)
    const { data: { user } } = await supabase.auth.getUser()

    if (user && !email) {
      // Signed-in user flow - immediate follow
      const { data: followerProfile } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('user_id', user.id)
        .single()

      if (!followerProfile) {
        return NextResponse.json({ error: 'Follower profile not found' }, { status: 404 })
      }

      // Check if already following
      const { data: existing } = await supabase
        .from('stack_followers')
        .select('id, verified_at')
        .eq('owner_user_id', ownerUserId)
        .eq('follower_user_id', user.id)
        .single()

      if (existing) {
        if (existing.verified_at) {
          return NextResponse.json({ status: 'already_following' })
        } else {
          // Update existing unverified follow to verified
          const { error: updateError } = await supabase
            .from('stack_followers')
            .update({ 
              verified_at: new Date().toISOString(),
              "verify_token": null 
            })
            .eq('id', existing.id)

          if (updateError) {
            return NextResponse.json({ error: 'Failed to update follow status' }, { status: 500 })
          }
        }
      } else {
        // Create new follow
        const { data: newFollow, error: followError } = await supabase
          .from('stack_followers')
          .insert({
            owner_user_id: ownerUserId,
            follower_user_id: user.id,
            verified_at: new Date().toISOString()
          })
          .select('id')
          .single()

        if (followError) {
          return NextResponse.json({ error: 'Failed to create follow' }, { status: 500 })
        }

        // Create default email preferences
        await supabase
          .from('email_prefs')
          .insert({
            follower_id: newFollow.id,
            cadence: 'weekly'
          })

        // Send owner notification
        // await sendOwnerNotification(supabase, ownerUserId)
        console.log('📧 Would send owner notification for user:', ownerUserId)
      }

      return NextResponse.json({ status: 'following' })

    } else {
      // Email-only flow - requires verification
      if (!email) {
        return NextResponse.json({ error: 'Email is required for anonymous follows' }, { status: 400 })
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
      }

      // Check if already following with this email
      const { data: existing } = await supabase
        .from('stack_followers')
        .select('id, verified_at, "verify_token"')
        .eq('owner_user_id', ownerUserId)
        .eq('follower_email', email)
        .single()

      let followId: string
      let verifyToken: string

      if (existing) {
        if (existing.verified_at) {
          return NextResponse.json({ status: 'already_following' })
        } else {
          // Resend verification
          followId = existing.id
          verifyToken = existing["verify_token"] || crypto.randomBytes(32).toString('hex')
          
          // Update token if needed
          if (!existing["verify_token"]) {
            await supabase
              .from('stack_followers')
              .update({ "verify_token": verifyToken })
              .eq('id', followId)
          }
        }
      } else {
        // Create new follow with verification token
        verifyToken = crypto.randomBytes(32).toString('hex')
        
        const { data: newFollow, error: followError } = await supabase
          .from('stack_followers')
          .insert({
            owner_user_id: ownerUserId,
            follower_email: email,
            "verify_token": verifyToken
          })
          .select('id')
          .single()

        if (followError) {
          return NextResponse.json({ error: 'Failed to create follow' }, { status: 500 })
        }

        followId = newFollow.id
      }

      // Send verification email
      const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/follow/verify?token=${verifyToken}`
      
      // TODO: Re-enable email sending
      console.log('📧 Would send verification email to:', email, 'with URL:', verifyUrl)
      
      // const emailResult = await sendEmail({
      //   to: email,
      //   subject: `Confirm you want updates to ${ownerProfile.display_name || 'this user'}'s stack`,
      //   html: generateVerificationEmail({
      //     ownerName: ownerProfile.display_name || 'this user',
      //     verifyUrl,
      //     unsubscribeUrl: `${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe?token=${followId}`
      //   })
      // })

      // if (!emailResult.success) {
      //   return NextResponse.json({ error: 'Failed to send verification email' }, { status: 500 })
      // }

      return NextResponse.json({ status: 'pending' })
    }

  } catch (error) {
    console.error('Follow error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/follow - Unfollow a user's stack
export async function DELETE(request: NextRequest) {
  try {
    const { ownerUserId, email } = await request.json()

    if (!ownerUserId) {
      return NextResponse.json({ error: 'Owner user ID is required' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    let deleteCondition: any = { owner_user_id: ownerUserId }

    if (user) {
      deleteCondition.follower_user_id = user.id
    } else if (email) {
      deleteCondition.follower_email = email
    } else {
      return NextResponse.json({ error: 'User ID or email is required' }, { status: 400 })
    }

    // Delete the follow relationship (email_prefs will cascade delete)
    const { error } = await supabase
      .from('stack_followers')
      .delete()
      .match(deleteCondition)

    if (error) {
      return NextResponse.json({ error: 'Failed to unfollow' }, { status: 500 })
    }

    return NextResponse.json({ status: 'unfollowed' })

  } catch (error) {
    console.error('Unfollow error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
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

function generateVerificationEmail({ ownerName, verifyUrl, unsubscribeUrl }: {
  ownerName: string
  verifyUrl: string
  unsubscribeUrl: string
}): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Confirm Stack Follow - Biostackr</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8f9fa; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 32px 24px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
        .header p { margin: 8px 0 0; font-size: 16px; opacity: 0.9; }
        .content { padding: 32px 24px; }
        .greeting { font-size: 18px; margin-bottom: 24px; }
        .cta { text-align: center; margin: 32px 0; }
        .cta-button { display: inline-block; background: #667eea; color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; }
        .footer { background: #f7fafc; padding: 24px; text-align: center; font-size: 14px; color: #718096; }
        .footer a { color: #667eea; text-decoration: none; }
        .info-box { background: #f7fafc; border-radius: 8px; padding: 16px; margin: 24px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🧬 Biostackr</h1>
          <p>Confirm Stack Follow</p>
        </div>
        
        <div class="content">
          <div class="greeting">
            You requested to follow <strong>${ownerName}</strong>'s health stack.
          </div>

          <div class="info-box">
            <h3 style="margin: 0 0 8px 0; color: #2d3748;">What you'll receive:</h3>
            <ul style="margin: 0; padding-left: 20px; color: #4a5568;">
              <li>Weekly email digest of stack changes</li>
              <li>Updates on new supplements, protocols, and routines</li>
              <li>Only public items (private items never shared)</li>
              <li>Unsubscribe anytime</li>
            </ul>
          </div>

          <div class="cta">
            <a href="${verifyUrl}" class="cta-button">
              Confirm Follow →
            </a>
          </div>

          <p style="text-align: center; color: #718096; font-size: 14px;">
            This link will expire in 7 days for security.
          </p>
        </div>

        <div class="footer">
          <p>
            You received this email because you requested updates on <strong>Biostackr</strong>.
          </p>
          <p style="margin-top: 16px;">
            <a href="${unsubscribeUrl}">Don't want to follow? Click here</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}
