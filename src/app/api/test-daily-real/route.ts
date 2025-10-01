import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../lib/supabase/server'
import { sendDailyReminder } from '../../../lib/email/resend'

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing real daily reminder system')
    
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
          slug
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
        if (!profile) {
          console.log(`⚠️ Skipping user - no profile data`)
          continue
        }

        // Get user email from auth.users
        const { data: userData } = await supabase.auth.admin.getUserById(profile.user_id)
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
          // Get user's actual data
          const { data: supplements } = await supabase
            .from('supplements')
            .select('name, dose, timing')
            .eq('profile_id', profile.id)
            .eq('is_public', true)
          
          const { data: protocols } = await supabase
            .from('protocols')
            .select('name, frequency')
            .eq('profile_id', profile.id)
            .eq('is_public', true)
          
          const { data: movement } = await supabase
            .from('movement')
            .select('name, duration')
            .eq('profile_id', profile.id)
            .eq('is_public', true)
          
          const { data: mindfulness } = await supabase
            .from('mindfulness')
            .select('name, duration')
            .eq('profile_id', profile.id)
            .eq('is_public', true)
          
          console.log(`📊 User data: ${supplements?.length || 0} supplements, ${protocols?.length || 0} protocols, ${movement?.length || 0} movement, ${mindfulness?.length || 0} mindfulness`)
          
          // Send real daily reminder
          console.log(`📧 Sending real daily reminder to ${userEmail}`)
          
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
          
          await sendDailyReminder(emailData)
          
          results.push({
            user: userName,
            email: userEmail,
            reminderTime: pref.reminder_time,
            timezone: pref.timezone,
            utcTime: `${reminderUTCHour}:${reminderUTCMinute}`,
            timeDiff,
            sent: true,
            dataCounts: {
              supplements: supplements?.length || 0,
              protocols: protocols?.length || 0,
              movement: movement?.length || 0,
              mindfulness: mindfulness?.length || 0
            }
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
