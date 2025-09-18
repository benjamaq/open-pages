import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../lib/supabase/server'
import { sendDailyReminder } from '../../../../lib/email/resend'

// This endpoint would be called by a cron job service like Vercel Cron or GitHub Actions
export async function POST(request: NextRequest) {
  try {
    // Verify the request is from a trusted source (in production, use a secret token)
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()
    
    // Get current time in UTC
    const now = new Date()
    const currentHour = now.getUTCHours()
    const currentMinute = now.getUTCMinutes()
    
    // Find users who should receive reminders at this time
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

    if (prefsError) {
      console.error('Error fetching preferences:', prefsError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    const sentEmails = []
    const errors = []

    for (const pref of preferences || []) {
      try {
        // Parse reminder time
        const [reminderHour, reminderMinute] = pref.reminder_time.split(':').map(Number)
        
        // Check if it's time to send (with 5-minute window)
        const timeDiff = Math.abs((currentHour * 60 + currentMinute) - (reminderHour * 60 + reminderMinute))
        if (timeDiff > 5) continue // Skip if not within 5-minute window

        const profile = (pref as any).profiles
        const userEmail = profile.users.email

        if (!userEmail) continue

        // Get user's current items
        const { data: stackItems, error: stackError } = await supabase
          .from('stack_items')
          .select('*')
          .eq('profile_id', profile.id)
          .eq('public', true)

        const { data: protocols, error: protocolsError } = await supabase
          .from('protocols')
          .select('*')
          .eq('profile_id', profile.id)
          .eq('public', true)

        if (stackError || protocolsError) {
          console.error('Error fetching user items:', stackError || protocolsError)
          continue
        }

        // Filter items by type
        const supplements = stackItems?.filter(item => 
          !item.name?.toLowerCase().includes('movement') && 
          !item.name?.toLowerCase().includes('mindfulness')
        ) || []

        const movement = stackItems?.filter(item => 
          item.name?.toLowerCase().includes('movement') || 
          item.name?.toLowerCase().includes('exercise')
        ) || []

        const mindfulness = stackItems?.filter(item => 
          item.name?.toLowerCase().includes('mindfulness') || 
          item.name?.toLowerCase().includes('meditation')
        ) || []

        // Filter based on user preferences
        const emailData = {
          userName: profile.name || 'User',
          userEmail,
          supplements: pref.supplements_reminder ? supplements.map((item: any) => ({
            name: item.name,
            dose: item.dose,
            timing: item.timing
          })) : [],
          protocols: pref.protocols_reminder ? (protocols || []).map((item: any) => ({
            name: item.name,
            frequency: item.frequency
          })) : [],
          movement: pref.movement_reminder ? movement.map((item: any) => ({
            name: item.name,
            duration: item.dose
          })) : [],
          mindfulness: pref.mindfulness_reminder ? mindfulness.map((item: any) => ({
            name: item.name,
            duration: item.dose
          })) : [],
          profileUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dash`,
          unsubscribeUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/unsubscribe?token=${profile.id}`
        }

        // Send email
        const result = await sendDailyReminder(emailData)

        if (result.success) {
          sentEmails.push({
            email: userEmail,
            profileId: profile.id,
            emailId: result.id
          })

          // Log the sent email
          await supabase.from('email_log').insert({
            profile_id: profile.id,
            email_type: 'daily_reminder',
            recipient_email: userEmail,
            subject: `Your Daily Biostackr Reminder - ${new Date().toLocaleDateString()}`,
            provider_id: result.id,
            delivery_status: 'sent'
          })
        } else {
          errors.push({
            email: userEmail,
            error: result.error
          })
        }

      } catch (error) {
        console.error(`Error processing reminder for user:`, error)
        errors.push({
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json({
      success: true,
      sent: sentEmails.length,
      errors: errors.length,
      details: {
        sent: sentEmails,
        errors
      }
    })

  } catch (error) {
    console.error('Error in daily reminder job:', error)
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'Daily reminder service is running'
  })
}
