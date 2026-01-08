import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '../../../../utils/supabase/admin'
import { startOfMinute, endOfMinute, subMinutes, addMinutes } from 'date-fns'
import { renderDailyReminderEmail as renderV3Reminder } from '@/lib/email/templates/daily-reminder'

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

    // Helper: compute YYYY-MM-DD in user's timezone
    function ymdInTz(date: Date, tz: string): string {
      try {
        return new Intl.DateTimeFormat('en-CA', { timeZone: tz || 'UTC', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date)
      } catch {
        return new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(date)
      }
    }
    function isSameLocalDay(a: Date, b: Date, tz: string): boolean { return ymdInTz(a, tz) === ymdInTz(b, tz) }

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

        // ✅ Proper per-timezone matching using Intl
        const userTimezone = pref.timezone || 'UTC'
        const [reminderHour, reminderMinute] = String(pref.reminder_time || '09:00').split(':').map((n: string) => parseInt(n, 10))

        const fmt = new Intl.DateTimeFormat('en-GB', {
          timeZone: userTimezone,
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        })
        const parts = fmt.formatToParts(currentUtcTime)
        const curH = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10)
        const curM = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10)

        const curTotal = curH * 60 + curM
        const tgtTotal = reminderHour * 60 + reminderMinute
        const diff = Math.abs(curTotal - tgtTotal)
        const inWindow = diff <= 5 // 5-minute window

        console.log(`🕐 TIME CHECK for ${userEmail}:`, {
          user_time: `${reminderHour}:${String(reminderMinute).padStart(2, '0')} ${userTimezone}`,
          current_in_user_tz: `${String(curH).padStart(2, '0')}:${String(curM).padStart(2, '0')}`,
          in_window: inWindow,
          minute_diff: diff,
        })
        
        // Check if current time matches reminder time AND email hasn't been sent already today
        // Idempotency: check daily_email_sends for a row on this user's local date
        let alreadySentToday = false
        try {
          const localYmd = ymdInTz(currentUtcTime, userTimezone)
          const { data: sentRow } = await supabaseAdmin
            .from('daily_email_sends')
            .select('profile_id')
            .eq('profile_id', pref.profile_id)
            .eq('local_date', localYmd)
            .maybeSingle()
          alreadySentToday = !!sentRow
        } catch (e) {
          // fallback to last_email_sent_at if table missing
          const lastEmailSentAt: string | null = (pref as any).last_email_sent_at || null
          alreadySentToday = lastEmailSentAt ? isSameLocalDay(new Date(lastEmailSentAt), currentUtcTime, userTimezone) : false
        }

        if (inWindow && !alreadySentToday) {
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
          // Use the new single-column V3 template
          const supplementCount = (supplements?.length || 0) + (protocols?.length || 0) + (movement?.length || 0) + (mindfulness?.length || 0)
          const progressPercent = Math.max(0, Math.min(100, Math.round(readinessPercent)))
          const html = renderV3Reminder({
            firstName: userName || 'there',
            supplementCount: Math.max(1, supplementCount),
            progressPercent,
            checkinUrl: `${process.env.NEXT_PUBLIC_APP_URL || base}/dashboard?checkin=open`,
          })
          const subject = `${progressPercent}% complete`
          const sendResp = await resend.emails.send({
            from,
            to: userEmail!,
            subject,
            html,
            ...(reply_to ? { reply_to: reply_to } : {})
          })
          console.log('Resend response (V3):', { id: sendResp.data?.id, error: sendResp.error?.message })
          console.log(`✅ Email sent to ${userEmail}`)
          // Idempotency write: insert daily_email_sends row and update last_email_sent_at (best effort)
          try {
            const localYmd = ymdInTz(currentUtcTime, userTimezone)
            await supabaseAdmin
              .from('daily_email_sends')
              .insert({ profile_id: profile.id, local_date: localYmd })
            const { error: updErr } = await supabaseAdmin
              .from('notification_preferences')
              .update({ last_email_sent_at: new Date().toISOString() })
              .eq('profile_id', pref.profile_id)
            if (updErr) {
              // Ignore unknown column errors (42703) to allow forward-compatible deploys
              if (!/42703/.test(updErr.code || '') && !/column .* does not exist/i.test(updErr.message || '')) {
                console.warn('⚠️ Failed to set last_email_sent_at:', updErr)
              }
            }
          } catch (e) {
            console.warn('⚠️ last_email_sent_at update threw', e)
          }
          
          sentEmails.push(userEmail)
        } else {
          if (!inWindow) {
            console.log(`⏰ Not time for ${userEmail} yet`)
          } else if (alreadySentToday) {
            console.log(`⏭️ Skipping ${userEmail} - already sent today in ${userTimezone}`)
          }
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