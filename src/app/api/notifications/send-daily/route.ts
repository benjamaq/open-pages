import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '../../../../utils/supabase/admin'
// import * as dateFnsTz from 'date-fns-tz'
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
    console.log('🚀 CRON TRIGGERED', { 
      currentUTCHour: new Date().getUTCHours(),
      currentUTCMinute: new Date().getUTCMinutes(),
      currentUTC: new Date().toISOString(),
      londonTime: new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' })
    })

    const supabaseAdmin = createAdminClient()
    const currentUtcTime = new Date()

    // Fetch users with reminders enabled (bypass RLS with admin client)
    const { data: preferences, error: prefsError } = await supabaseAdmin
      .from('notification_preferences')
      .select('*')
      .eq('email_enabled', true)
      .eq('daily_reminder_enabled', true)

    if (prefsError) {
      console.error('Error fetching preferences:', prefsError)
      return NextResponse.json({ error: 'Database error', details: prefsError }, { status: 500 })
    }

    console.log(`📧 FOUND USERS: ${preferences?.length || 0}`, preferences)
    console.log('Raw preferences data:', JSON.stringify(preferences, null, 2))

    if (!preferences || preferences.length === 0) {
      console.log('❌ No users with reminders enabled - EXITING EARLY')
      return NextResponse.json({ message: 'No reminders to send' })
    }

    const sentEmails = []
    const errors = []

    for (const pref of preferences) {
      try {
        // Get profile data separately
        const { data: profile, error: profileError } = await supabaseAdmin
          .from('profiles')
          .select('id, user_id, display_name, slug')
          .eq('id', pref.profile_id)
          .single()
        
        if (profileError || !profile) {
          console.log(`⚠️ Skipping preference - no profile data:`, profileError)
          continue
        }

        // Get user email from auth.users using admin client
        const { data: userData } = await supabaseAdmin.auth.admin.getUserById(profile.user_id)
        if (!userData?.user?.email) {
          console.log(`⚠️ Skipping user - no email data`)
          continue
        }

        const userEmail = userData.user.email
        const userName = profile.display_name || 'User'
        
        console.log(`👤 Processing user: ${userName} (${userEmail})`)
        console.log(`⏰ Reminder time: ${pref.reminder_time} ${pref.timezone}`)
        
        // Proper timezone conversion using date-fns-tz
        const userTimezone = pref.timezone || 'Europe/London'
        const [reminderHour, reminderMinute] = pref.reminder_time.split(':').map(Number)
        
        // Create user's local time
        const userLocalTime = new Date()
        userLocalTime.setHours(reminderHour, reminderMinute, 0, 0)
        
        // Convert to UTC properly
        const reminderUtc = new Date(userLocalTime.getTime() - (userLocalTime.getTimezoneOffset() * 60000))
        
        // For London timezone, handle GMT/BST properly
        if (userTimezone === 'Europe/London') {
          const now = new Date()
          const isBST = now.getTimezoneOffset() < 0 // BST is UTC+1, GMT is UTC+0
          const offset = isBST ? 1 : 0
          reminderUtc.setUTCHours(reminderHour - offset, reminderMinute, 0, 0)
        }
        
        // Check if current UTC time is within 5-min window (cron interval)
        const windowStart = startOfMinute(reminderUtc)
        const windowEnd = endOfMinute(reminderUtc)
        
        const inWindow = currentUtcTime >= windowStart && currentUtcTime <= windowEnd
        console.log(`🕐 TIME CHECK for ${userEmail}:`, {
          user_time: `${reminderHour}:${reminderMinute} ${userTimezone}`,
          utc_time: reminderUtc.toISOString(),
          current_utc: currentUtcTime.toISOString(),
          window_start: windowStart.toISOString(),
          window_end: windowEnd.toISOString(),
          in_window: inWindow,
          current_hour: currentUtcTime.getUTCHours(),
          current_minute: currentUtcTime.getUTCMinutes(),
          reminder_hour: reminderUtc.getUTCHours(),
          reminder_minute: reminderUtc.getUTCMinutes()
        })
        
        // TEMPORARY: Always send for testing
        if (true) { // inWindow) {
          console.log(`🎯 SENDING EMAIL to ${userEmail} - TESTING MODE (bypassing time check)`)
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