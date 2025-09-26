import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const results: any = {
      user: {
        id: user.id,
        email: user.email
      },
      tables: {}
    }

    // Check if stack_followers table exists and get data
    try {
      const { data: followers, error: followersError } = await supabase
        .from('stack_followers')
        .select('*')
        .eq('owner_user_id', user.id)
        .limit(10)

      results.tables.stack_followers = {
        exists: true,
        error: followersError?.message || null,
        count: followers?.length || 0,
        data: followers || []
      }
    } catch (error) {
      results.tables.stack_followers = {
        exists: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }

    // Check if email_prefs table exists
    try {
      const { data: prefs, error: prefsError } = await supabase
        .from('email_prefs')
        .select('*')
        .limit(5)

      results.tables.email_prefs = {
        exists: true,
        error: prefsError?.message || null,
        count: prefs?.length || 0
      }
    } catch (error) {
      results.tables.email_prefs = {
        exists: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }

    // Check profiles table
    try {
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, display_name, slug, allow_stack_follow, user_id, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      results.tables.profiles = {
        exists: true,
        error: profileError?.message || null,
        count: profiles?.length || 0,
        data: profiles || [],
        primaryProfile: profiles && profiles.length > 0 ? profiles[0] : null
      }
    } catch (error) {
      results.tables.profiles = {
        exists: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }

    return NextResponse.json(results)

  } catch (error) {
    console.error('Database check error:', error)
    return NextResponse.json({ 
      error: 'Database check failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
