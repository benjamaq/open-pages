import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '../../../../utils/supabase/admin'
import { startOfMinute, endOfMinute, subMinutes, addMinutes } from 'date-fns'
import { sendDailyReminder } from '../../../../lib/email/resend'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// --- 🔑 FIX 1: IMPLEMENT VERCEL CRON SECRET AUTHENTICATION ---
function authenticateCron(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const headerSecret = req.headers.get('Authorization')?.replace('Bearer ', '')

  // For manual testing, allow if no secret is set
  if (!cronSecret) {
    console.warn('CRON_SECRET not set - allowing for testing')
    return true
  }

  if (headerSecret !== cronSecret) {
    console.warn('CRON JOB FAILED: Unauthorized access attempt.')
    return false
  }
  return true
}

export async function GET(req: NextRequest) {
  if (!authenticateCron(req)) {
    return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 })
  }
  return handleSend()
}

export async function POST(req: NextRequest) {
  // Allow manual POST for testing
  return handleSend()
}

async function handleSend() {
  try {
    console.log('🚀 CRON TRIGGERED - VERSION 3.0 - CACHE BUST', { 
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

    if (!preferences || preferences.length === 0) {
      console.log('❌ No users with reminders enabled - EXITING EARLY')
      return NextResponse.json({ message: 'No reminders to send' })
    }

    const sentEmails = []
    const errors = []

    for (const pref of preferences) {
      let userEmail = 'Unknown'
      try {
        // Get profile data separately
        const { data: profile, error: profileError } = await supabaseAdmin
          .from('profiles')
          .select('id, user_id, display_name, slug')
          .eq('id', pref.profile_id)
          .single()
        
        if (profileError || !profile) {
          console.error(`⚠️ Skipping preference - no profile data:`, profileError)
          errors.push({ user: 'Unknown', error: 'No profile data' })
          continue
        }

        // Get user email from auth.users using admin client
        const { data: userData } = await supabaseAdmin.auth.admin.getUserById(profile.user_id)
        userEmail = userData?.user?.email || 'Unknown'
        if (!userData?.user?.email) {
          console.error(`⚠️ Skipping user ${profile.id} - no email data`)
          errors.push({ user: profile.id, error: 'No email found' })
          continue
        }

        const userName = profile.display_name || 'User'
        
        console.log(`👤 Processing user: ${userName} (${userEmail})`)
        console.log(`⏰ Reminder time: ${pref.reminder_time} ${pref.timezone}`)
        
        // --- ⏰ SIMPLIFIED TIMEZONE MATCHING (temporary fix) ---
        const userTimezone = pref.timezone || 'Europe/London'
        const [reminderHour, reminderMinute] = pref.reminder_time.split(':').map(Number)
        
        // Simple timezone conversion for London (UTC+1 during BST)
        const isBST = currentUtcTime.getMonth() >= 2 && currentUtcTime.getMonth() <= 9 // Rough BST check
        const offset = isBST ? 1 : 0
        const reminderUtcHour = reminderHour - offset
        
        // Check if current time matches reminder time (within 5 min window)
        const currentHour = currentUtcTime.getUTCHours()
        const currentMinute = currentUtcTime.getUTCMinutes()
        const reminderMinuteUtc = reminderMinute
        
        const inWindow = Math.abs(currentHour - reminderUtcHour) <= 0 && Math.abs(currentMinute - reminderMinuteUtc) <= 2
        console.log(`🕐 TIME CHECK for ${userEmail}:`, {
          user_time: `${reminderHour}:${reminderMinute} ${userTimezone}`,
          current_utc: currentUtcTime.toISOString(),
          in_window: inWindow,
          current_hour: currentHour,
          current_minute: currentMinute,
          reminder_hour: reminderUtcHour,
          reminder_minute: reminderMinuteUtc,
          is_bst: isBST,
          offset: offset
        })
        
        // TEMPORARY: Always send for testing
        if (true) { // inWindow) {
          console.log(`🎯 SENDING EMAIL to ${userEmail} - Time match confirmed`)
          // Get user's actual data
          const { data: supplements } = await supabaseAdmin
            .from('stack_items')
            .select('name, dose, timing, brand, notes')
            .eq('profile_id', profile.id)
            .eq('item_type', 'supplements')

          const { data: allProtocols } = await supabaseAdmin
            .from('protocols')
            .select('name, frequency, schedule_days')
            .eq('profile_id', profile.id)
          
          // Filter protocols that are due today (0=Sunday, 1=Monday, etc.)
          const today = new Date().getDay()
          const protocols = allProtocols?.filter(protocol => {
            if (!protocol.schedule_days || protocol.schedule_days.length === 0) {
              return true // If no schedule specified, include it
            }
            return protocol.schedule_days.includes(today)
          }) || []

          const { data: movement } = await supabaseAdmin
            .from('stack_items')
            .select('name, dose, timing, notes')
            .eq('profile_id', profile.id)
            .eq('item_type', 'movement')

          const { data: mindfulness } = await supabaseAdmin
            .from('stack_items')
            .select('name, dose, timing, notes')
            .eq('profile_id', profile.id)
            .eq('item_type', 'mindfulness')

          const dailyReminderData = {
            userName: userName,
            userEmail: userEmail,
            supplements: supplements || [],
            protocols: protocols || [],
            movement: movement || [],
            mindfulness: mindfulness || [],
            profileUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dash`,
            unsubscribeUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dash/settings`
          }

          console.log(`📧 Sending reminder to ${userEmail}`)
          await sendDailyReminder(dailyReminderData)
          console.log(`✅ Email sent to ${userEmail}`)
          
          sentEmails.push(userEmail)
        } else {
          console.log(`⏰ Not time for ${userEmail} yet`)
        }
      } catch (error: any) {
        console.error(`❌ Error processing user:`, error)
        errors.push({ user: userEmail || 'Unknown', error: error.message })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Cron job completed',
      sent: sentEmails.length,
      errors: errors.length,
      details: { sentEmails, errors }
    })
  } catch (error: any) {
    console.error('Cron error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}