import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '../../../../utils/supabase/admin'
import { utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz'
import { startOfMinute, endOfMinute } from 'date-fns'
import { sendDailyReminder } from '../../../../lib/email/resend'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function isFromVercelCron(headers: Headers) {
  return headers.get('x-vercel-cron') === '1' ||
         (headers.get('user-agent') || '').toLowerCase().includes('vercel')
}

export async function GET(req: Request) {
  if (!isFromVercelCron(new Headers(req.headers))) {
    return NextResponse.json({ ok: true, reason: 'not vercel cron' })
  }
  return handleSend()
}

export async function POST() {
  return handleSend()
}

async function handleSend() {
  try {
    console.log('🕐 Cron job started at:', new Date().toISOString())

    const supabaseAdmin = createAdminClient()
    const currentUtcTime = new Date()

    // Fetch users with reminders enabled (bypass RLS with admin client)
    const { data: preferences, error: prefsError } = await supabaseAdmin
      .from('notification_preferences')
      .select(`
        *,
        profiles:profile_id(
          id,
          user_id,
          name,
          slug
        )
      `)
      .eq('email_enabled', true)
      .eq('daily_reminder_enabled', true)

    if (prefsError) {
      console.error('Error fetching preferences:', prefsError)
      return NextResponse.json({ error: 'Database error', details: prefsError }, { status: 500 })
    }

    console.log(`📧 Found ${preferences?.length || 0} users with email notifications enabled`)

    if (!preferences || preferences.length === 0) {
      console.log('No users with reminders enabled')
      return NextResponse.json({ message: 'No reminders to send' })
    }

    const sentEmails = []
    const errors = []

    for (const pref of preferences) {
      try {
        const profile = (pref as any).profiles
        if (!profile) {
          console.log(`⚠️ Skipping user - no profile data`)
          continue
        }

        // Get user email from auth.users using admin client
        const { data: userData } = await supabaseAdmin.auth.admin.getUserById(profile.user_id)
        if (!userData?.user?.email) {
          console.log(`⚠️ Skipping user - no email data`)
          continue
        }

        const userEmail = userData.user.email
        const userName = profile.name || 'User'
        
        console.log(`👤 Processing user: ${userName} (${userEmail})`)
        console.log(`⏰ Reminder time: ${pref.reminder_time} ${pref.timezone}`)
        
        // Parse reminder time
        const [reminderHour, reminderMinute] = pref.reminder_time.split(':').map(Number)
        
        // Convert user's local time to UTC using proper timezone handling
        const userTimezone = pref.timezone || 'UTC'
        const reminderTimeLocal = new Date(`1970-01-01T${pref.reminder_time}`)
        const reminderUtc = zonedTimeToUtc(reminderTimeLocal, userTimezone)
        
        // Check if current UTC time is within 5-min window (cron interval)
        const windowStart = startOfMinute(reminderUtc)
        const windowEnd = endOfMinute(reminderUtc)
        
        console.log(`🕐 Time check:`, {
          user_time: `${reminderHour}:${reminderMinute} ${userTimezone}`,
          utc_time: reminderUtc.toISOString(),
          current_utc: currentUtcTime.toISOString(),
          in_window: currentUtcTime >= windowStart && currentUtcTime <= windowEnd
        })
        
        if (currentUtcTime >= windowStart && currentUtcTime <= windowEnd) {
          // Get user's actual data
          const { data: supplements } = await supabaseAdmin
            .from('supplements')
            .select('name, dose, timing')
            .eq('profile_id', profile.id)
            .eq('is_public', true)
          
          const { data: protocols } = await supabaseAdmin
            .from('protocols')
            .select('name, frequency')
            .eq('profile_id', profile.id)
            .eq('is_public', true)
          
          const { data: movement } = await supabaseAdmin
            .from('movement')
            .select('name, duration')
            .eq('profile_id', profile.id)
            .eq('is_public', true)
          
          const { data: mindfulness } = await supabaseAdmin
            .from('mindfulness')
            .select('name, duration')
            .eq('profile_id', profile.id)
            .eq('is_public', true)
          
          console.log(`📊 User data: ${supplements?.length || 0} supplements, ${protocols?.length || 0} protocols, ${movement?.length || 0} movement, ${mindfulness?.length || 0} mindfulness`)
          
          // Send real daily reminder
          console.log(`📧 Sending daily reminder to ${userEmail}`)
          
          const emailData = {
            userName,
            userEmail,
            supplements: supplements || [],
            protocols: protocols || [],
            movement: movement || [],
            mindfulness: mindfulness || [],
            profileUrl: `https://biostackr.io/dash`,
            unsubscribeUrl: `https://biostackr.io/dash/settings`
          }
          
          const result = await sendDailyReminder(emailData)
          
          if (result.success) {
            sentEmails.push({
              user: userName,
              email: userEmail,
              reminderTime: pref.reminder_time,
              timezone: pref.timezone,
              sent: true
            })
            console.log(`✅ Email sent to ${userEmail}`)
          } else {
            errors.push({
              user: userName,
              email: userEmail,
              error: result.error
            })
            console.error(`❌ Failed to send email to ${userEmail}:`, result.error)
          }
        } else {
          console.log(`⏰ Not time for ${userName} yet`)
        }
        
      } catch (error: any) {
        console.error('Error processing user:', error)
        errors.push({
          user: 'Unknown',
          error: error.message
        })
      }
    }

    console.log(`📊 Cron job completed: ${sentEmails.length} sent, ${errors.length} errors`)

    return NextResponse.json({
      success: true,
      message: 'Cron job completed',
      sent: sentEmails.length,
      errors: errors.length,
      details: {
        sentEmails,
        errors
      }
    })

  } catch (error: any) {
    console.error('Cron job error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 })
  }
}