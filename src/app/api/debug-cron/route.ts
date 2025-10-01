import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '../../../utils/supabase/admin'

export async function GET(req: Request) {
  try {
    console.log('🔍 Debug cron test started')
    
    // Test admin client
    const supabaseAdmin = createAdminClient()
    
    // Test basic query
    const { data: testData, error: testError } = await supabaseAdmin
      .from('notification_preferences')
      .select('*')
      .limit(1)
    
    console.log('Test query result:', { data: testData, error: testError })
    
    // Test user preferences query
    const { data: preferences, error: prefsError } = await supabaseAdmin
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
    
    console.log('Preferences query result:', { 
      count: preferences?.length || 0, 
      error: prefsError,
      data: preferences 
    })
    
    // Test getting user email
    if (preferences && preferences.length > 0) {
      const firstPref = preferences[0]
      const profile = (firstPref as any).profiles
      
      if (profile) {
        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(profile.user_id)
        console.log('User email query result:', { 
          email: userData?.user?.email, 
          error: userError 
        })
      }
    }
    
    return NextResponse.json({
      success: true,
      testQuery: { data: testData, error: testError },
      preferencesQuery: { count: preferences?.length || 0, error: prefsError },
      message: 'Debug test completed'
    })
    
  } catch (error: any) {
    console.error('Debug test error:', error)
    return NextResponse.json({ 
      error: 'Debug test failed', 
      details: error.message 
    }, { status: 500 })
  }
}
