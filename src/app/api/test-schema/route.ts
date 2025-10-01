import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '../../../utils/supabase/admin'

export async function GET(req: Request) {
  try {
    console.log('🔍 Testing database schema')
    
    const supabaseAdmin = createAdminClient()
    
    // Test profiles table structure
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .limit(1)
    
    console.log('Profiles query result:', { data: profiles, error: profilesError })
    
    // Test notification_preferences table
    const { data: prefs, error: prefsError } = await supabaseAdmin
      .from('notification_preferences')
      .select('*')
      .limit(1)
    
    console.log('Notification preferences query result:', { data: prefs, error: prefsError })
    
    return NextResponse.json({
      success: true,
      profiles: { data: profiles, error: profilesError },
      preferences: { data: prefs, error: prefsError },
      message: 'Schema test completed'
    })
    
  } catch (error: any) {
    console.error('Schema test error:', error)
    return NextResponse.json({ 
      error: 'Schema test failed', 
      details: error.message 
    }, { status: 500 })
  }
}
