import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../lib/supabase/server'
import { sendEmail } from '../../../../lib/email/resend'
import { 
  coalesceChanges, 
  generateWeeklyDigestHTML, 
  generateDailyDigestHTML,
  type DigestChange 
} from '../../../../lib/email/digest-templates'

// POST /api/digest/send - Send digest emails (called by cron)
export async function POST(request: NextRequest) {
  try {
    // Verify the request is from a trusted source
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { cadence } = await request.json()
    
    if (!cadence || !['daily', 'weekly'].includes(cadence)) {
      return NextResponse.json({ error: 'Invalid cadence' }, { status: 400 })
    }

    const supabase = await createClient()
    const now = new Date()
    
    // Calculate time window
    const windowHours = cadence === 'daily' ? 24 : 168 // 24h or 7 days
    const windowStart = new Date(now.getTime() - windowHours * 60 * 60 * 1000)

    // Get followers who should receive this cadence
    const { data: followers, error: followersError } = await supabase
      .from('email_prefs')
      .select(`
        follower_id,
        cadence,
        last_digest_sent_at,
        stack_followers:follower_id(
          id,
          owner_user_id,
          follower_user_id,
          follower_email,
          verified_at,
          profiles:owner_user_id(name, slug, user_id)
        )
      `)
      .eq('cadence', cadence)
      .not('stack_followers.verified_at', 'is', null)

    if (followersError) {
      console.error('Error fetching followers:', followersError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    const sentDigests = []
    const errors = []

    for (const follower of followers || []) {
      try {
        const stackFollower = (follower as any).stack_followers
        const ownerProfile = stackFollower.profiles
        
        // Skip if already sent digest within this window
        if (follower.last_digest_sent_at) {
          const lastSent = new Date(follower.last_digest_sent_at)
          if (lastSent > windowStart) {
            continue
          }
        }

        // Get changes for this owner within the time window
        const { data: changes, error: changesError } = await supabase
          .from('stack_change_log')
          .select('*')
          .eq('owner_user_id', stackFollower.owner_user_id)
          .eq('is_public', true)
          .gte('changed_at', windowStart.toISOString())
          .order('changed_at', { ascending: false })

        if (changesError) {
          console.error('Error fetching changes:', changesError)
          continue
        }

        // Skip if no changes
        if (!changes || changes.length === 0) {
          continue
        }

        // Coalesce changes
        const coalescedChanges = coalesceChanges(changes as DigestChange[])
        
        if (coalescedChanges.length === 0) {
          continue
        }

        // Determine recipient email
        const recipientEmail = stackFollower.follower_email || 
          (await getUserEmail(stackFollower.follower_user_id))

        if (!recipientEmail) {
          continue
        }

        // Generate email content
        const digestData = {
          ownerName: ownerProfile.name || 'A Biostackr user',
          ownerSlug: ownerProfile.slug,
          followerEmail: recipientEmail,
          cadence: cadence as 'daily' | 'weekly',
          changes: coalescedChanges,
          profileUrl: `${process.env.NEXT_PUBLIC_APP_URL}/u/${ownerProfile.slug}`,
          manageUrl: `${process.env.NEXT_PUBLIC_APP_URL}/manage-follow?id=${follower.follower_id}`,
          unsubscribeUrl: `${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe?token=${follower.follower_id}`,
          periodStart: windowStart.toISOString(),
          periodEnd: now.toISOString()
        }

        const emailHTML = cadence === 'daily' 
          ? generateDailyDigestHTML(digestData)
          : generateWeeklyDigestHTML(digestData)

        const subject = cadence === 'daily'
          ? `Yesterday in ${ownerProfile.name || 'this user'}'s stack`
          : `This week in ${ownerProfile.name || 'this user'}'s stack`

        // Send email
        const emailResult = await sendEmail({
          to: recipientEmail,
          subject,
          html: emailHTML
        })

        if (emailResult.success) {
          // Update last digest sent time
          await supabase
            .from('email_prefs')
            .update({ last_digest_sent_at: now.toISOString() })
            .eq('follower_id', follower.follower_id)

          // Log the sent email
          await supabase.from('email_log').insert({
            profile_id: ownerProfile.user_id,
            email_type: `${cadence}_digest`,
            recipient_email: recipientEmail,
            subject,
            provider_id: emailResult.id,
            delivery_status: 'sent'
          })

          sentDigests.push({
            follower_id: follower.follower_id,
            owner_name: ownerProfile.name,
            email: recipientEmail,
            changes_count: coalescedChanges.length
          })
        } else {
          errors.push({
            follower_id: follower.follower_id,
            error: emailResult.error
          })
        }

      } catch (error) {
        console.error('Error processing digest for follower:', error)
        errors.push({
          follower_id: follower.follower_id,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json({
      success: true,
      cadence,
      sent: sentDigests.length,
      errors: errors.length,
      details: {
        sent: sentDigests,
        errors
      }
    })

  } catch (error) {
    console.error('Error in digest generation:', error)
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

async function getUserEmail(userId: string | null): Promise<string | null> {
  if (!userId) return null
  
  try {
    const supabase = await createClient()
    const { data: user } = await supabase.auth.admin.getUserById(userId)
    return user.user?.email || null
  } catch (error) {
    console.error('Error getting user email:', error)
    return null
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'Digest service is running'
  })
}
