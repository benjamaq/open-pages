import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '../../../utils/supabase/admin'

export async function GET(req: Request) {
  try {
    console.log('🧪 Simple cron test started')
    
    const supabaseAdmin = createAdminClient()
    
    // Test basic query
    const { data: preferences, error: prefsError } = await supabaseAdmin
      .from('notification_preferences')
      .select('*')
      .eq('email_enabled', true)
      .eq('daily_reminder_enabled', true)
    
    console.log('Preferences found:', preferences?.length || 0)
    
    if (prefsError) {
      console.error('Error:', prefsError)
      return NextResponse.json({ error: prefsError.message }, { status: 500 })
    }
    
    if (!preferences || preferences.length === 0) {
      return NextResponse.json({ message: 'No users with reminders enabled' })
    }
    
    // Test getting one user's data
    const pref = preferences[0]
    console.log('Testing with preference:', pref)
    
    // Get profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, user_id, display_name')
      .eq('id', pref.profile_id)
      .single()
    
    if (profileError) {
      console.error('Profile error:', profileError)
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }
    
    console.log('Profile found:', profile)
    
    // Get user email
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(profile.user_id)
    
    if (userError) {
      console.error('User error:', userError)
      return NextResponse.json({ error: userError.message }, { status: 500 })
    }
    
    console.log('User email:', userData?.user?.email)
    
    return NextResponse.json({
      success: true,
      message: 'Simple cron test completed',
      userCount: preferences.length,
      testUser: {
        email: userData?.user?.email,
        name: profile.display_name,
        reminderTime: pref.reminder_time,
        timezone: pref.timezone
      }
    })
    
  } catch (error: any) {
    console.error('Simple cron test error:', error)
    return NextResponse.json({ 
      error: 'Simple cron test failed', 
      details: error.message 
    }, { status: 500 })
  }
}
