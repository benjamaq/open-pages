import { createClient } from '../../../../lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('API route received:', body)
    
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      console.error('Authentication error:', userError)
      return NextResponse.json({ 
        error: 'Authentication failed', 
        details: userError?.message || 'No user found' 
      }, { status: 401 })
    }
    console.log('User authenticated:', user.id)

    // Get user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      console.error('Profile error:', profileError)
      return NextResponse.json({ 
        error: 'Profile lookup failed', 
        details: profileError?.message || 'Profile not found' 
      }, { status: 404 })
    }
    console.log('Profile found:', profile.id)

    // Prepare update data
    const updateData: any = {}
    if (body.email_enabled !== undefined) updateData.email_enabled = body.email_enabled
    if (body.daily_reminder_enabled !== undefined) updateData.daily_reminder_enabled = body.daily_reminder_enabled
    if (body.reminder_time !== undefined) updateData.reminder_time = body.reminder_time + ':00'
    if (body.timezone !== undefined) updateData.timezone = body.timezone
    if (body.supplements_reminder !== undefined) updateData.supplements_reminder = body.supplements_reminder
    if (body.protocols_reminder !== undefined) updateData.protocols_reminder = body.protocols_reminder
    if (body.movement_reminder !== undefined) updateData.movement_reminder = body.movement_reminder
    if (body.mindfulness_reminder !== undefined) updateData.mindfulness_reminder = body.mindfulness_reminder
    if (body.missed_items_reminder !== undefined) updateData.missed_items_reminder = body.missed_items_reminder
    if (body.weekly_summary !== undefined) updateData.weekly_summary = body.weekly_summary

    console.log('Attempting to upsert preferences:', { profile_id: profile.id, ...updateData })

    // Try to update preferences
    const { data: result, error: updateError } = await supabase
      .from('notification_preferences')
      .upsert({
        profile_id: profile.id,
        ...updateData
      })
      .select()

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json({ 
        error: 'Database update failed', 
        details: updateError.message,
        code: updateError.code,
        hint: updateError.hint
      }, { status: 500 })
    }

    console.log('Preferences updated successfully:', result)
    return NextResponse.json({ 
      success: true, 
      data: result 
    })

  } catch (error: any) {
    console.error('API route error:', error)
    return NextResponse.json({ 
      error: 'Server error', 
      details: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
