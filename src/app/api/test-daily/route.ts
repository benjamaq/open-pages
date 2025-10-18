import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../lib/supabase/server'
import { sendDailyReminder } from '../../../lib/email/resend'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current time in UTC
    const now = new Date()
    const currentHour = now.getUTCHours()
    const currentMinute = now.getUTCMinutes()
    
    console.log(`🕐 Test triggered at ${now.toISOString()} (UTC ${currentHour}:${currentMinute})`)
    
    // Find users who should receive reminders
    const { data: preferences, error: prefsError } = await supabase
      .from('notification_preferences')
      .select(`
        *,
        profiles:profile_id(
          id,
          user_id,
          name,
          slug,
          users:user_id(email)
        )
      `)
      .eq('email_enabled', true)
      .eq('daily_reminder_enabled', true)
    
    console.log(`📧 Found ${preferences?.length || 0} users with email notifications enabled`)

    if (prefsError) {
      console.error('Error fetching preferences:', prefsError)
      return NextResponse.json({ error: 'Database error', details: prefsError }, { status: 500 })
    }

    const results = []
    
    for (const pref of preferences || []) {
      try {
        const profile = (pref as any).profiles
        if (!profile || !profile.users) {
          console.log(`⚠️ Skipping user - no profile or email data`)
          continue
        }

        const userEmail = profile.users.email
        const userName = (profile.name || 'there').split(' ')[0]
        
        console.log(`👤 Testing user: ${userName} (${userEmail})`)
        console.log(`⏰ Reminder time: ${pref.reminder_time} ${pref.timezone}`)
        
        // Parse reminder time
        const [reminderHour, reminderMinute] = pref.reminder_time.split(':').map(Number)
        
        // Convert to UTC (simplified for testing)
        const userTimezone = pref.timezone || 'UTC'
        let reminderUTCHour = reminderHour
        let reminderUTCMinute = reminderMinute
        
        if (userTimezone === 'Europe/London') {
          reminderUTCHour = reminderHour - 1 // BST is UTC+1
        }
        
        console.log(`🕐 Converted: ${reminderHour}:${reminderMinute} ${userTimezone} → ${reminderUTCHour}:${reminderUTCMinute} UTC`)
        console.log(`🕐 Current: ${currentHour}:${currentMinute} UTC`)
        
        // Check if it's time to send (within 5 minutes)
        const timeDiff = Math.abs((currentHour * 60 + currentMinute) - (reminderUTCHour * 60 + reminderUTCMinute))
        const shouldSend = timeDiff <= 5
        
        console.log(`📊 Time difference: ${timeDiff} minutes, Should send: ${shouldSend}`)
        
        if (shouldSend) {
          // Send test email
          console.log(`📧 Sending test email to ${userEmail}`)
          
          const emailData = {
            userName,
            userEmail,
            supplements: [],
            protocols: [],
            movement: [],
            mindfulness: []
          }
          
          await sendDailyReminder(emailData)
          
          results.push({
            user: userName,
            email: userEmail,
            reminderTime: pref.reminder_time,
            timezone: pref.timezone,
            utcTime: `${reminderUTCHour}:${reminderUTCMinute}`,
            timeDiff,
            sent: true
          })
        } else {
          results.push({
            user: userName,
            email: userEmail,
            reminderTime: pref.reminder_time,
            timezone: pref.timezone,
            utcTime: `${reminderUTCHour}:${reminderUTCMinute}`,
            timeDiff,
            sent: false
          })
        }
        
      } catch (error: any) {
        console.error('Error processing user:', error)
        results.push({
          error: error.message,
          user: 'Unknown'
        })
      }
    }

    return NextResponse.json({
      success: true,
      currentTime: `${currentHour}:${currentMinute} UTC`,
      results
    })

  } catch (error: any) {
    console.error('Test error:', error)
    return NextResponse.json({ 
      error: 'Test failed', 
      details: error.message 
    }, { status: 500 })
  }
}
