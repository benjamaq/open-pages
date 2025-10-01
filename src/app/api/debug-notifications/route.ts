import { createClient } from '../../../lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Authentication required', details: userError }, { status: 401 })
    }

    // Get user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found', details: profileError }, { status: 404 })
    }

    // Try to insert a test record
    const { data: insertData, error: insertError } = await supabase
      .from('notification_preferences')
      .upsert({
        profile_id: profile.id,
        email_enabled: true,
        daily_reminder_enabled: true,
        reminder_time: '09:00:00',
        timezone: 'UTC'
      })
      .select()

    if (insertError) {
      return NextResponse.json({ 
        error: 'Insert failed', 
        details: insertError,
        profile_id: profile.id,
        user_id: user.id
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      data: insertData,
      profile_id: profile.id,
      user_id: user.id
    })

  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Server error', 
      details: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
