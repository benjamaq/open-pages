import { createClient } from '../../../lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get user's profile and usage data
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id, tier')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profileData) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const { data: usageData, error: usageError } = await supabase
      .from('user_usage')
      .select('stack_items_limit, protocols_limit, uploads_limit')
      .eq('user_id', user.id)
      .single()

    if (usageError || !usageData) {
      return NextResponse.json({ error: 'Usage data not found' }, { status: 404 })
    }

    // Get current counts
    const [stackItemsResult, protocolsResult, uploadsResult] = await Promise.all([
      supabase
        .from('stack_items')
        .select('id', { count: 'exact' })
        .eq('profile_id', profileData.id),
      supabase
        .from('protocols')
        .select('id', { count: 'exact' })
        .eq('profile_id', profileData.id),
      supabase
        .from('uploads')
        .select('id', { count: 'exact' })
        .eq('profile_id', profileData.id)
    ])

    return NextResponse.json({
      stackItems: stackItemsResult.count || 0,
      protocols: protocolsResult.count || 0,
      uploads: uploadsResult.count || 0,
      stackItemsLimit: usageData.stack_items_limit || 10,
      protocolsLimit: usageData.protocols_limit || 5,
      uploadsLimit: usageData.uploads_limit || 3,
      currentTier: profileData.tier || 'free'
    })

  } catch (error) {
    console.error('Usage status API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
