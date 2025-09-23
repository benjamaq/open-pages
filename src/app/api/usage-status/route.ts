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

    // Get user's profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profileData) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Get user's usage data (which contains tier information)
    const { data: usageData, error: usageError } = await supabase
      .from('user_usage')
      .select('tier, stack_items_limit, protocols_limit, uploads_limit, is_in_trial, trial_ended_at')
      .eq('user_id', user.id)
      .single()

    if (usageError || !usageData) {
      return NextResponse.json({ error: 'Usage data not found' }, { status: 404 })
    }

    // Get current counts - unified stack limit
    const [stackItemsResult, protocolsResult, uploadsResult, libraryResult, gearResult] = await Promise.all([
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
        .eq('profile_id', profileData.id),
      supabase
        .from('library_items')
        .select('id', { count: 'exact' })
        .eq('profile_id', profileData.id),
      supabase
        .from('gear')
        .select('id', { count: 'exact' })
        .eq('profile_id', profileData.id)
    ])

    // Handle potential errors gracefully
    const stackItemsCount = stackItemsResult.error ? 0 : (stackItemsResult.count || 0)
    const protocolsCount = protocolsResult.error ? 0 : (protocolsResult.count || 0)
    const uploadsCount = uploadsResult.error ? 0 : (uploadsResult.count || 0)
    const libraryCount = libraryResult.error ? 0 : (libraryResult.count || 0)
    const gearCount = gearResult.error ? 0 : (gearResult.count || 0)

    // Calculate total stack items (everything combined)
    const totalStackItems = stackItemsCount + protocolsCount + uploadsCount + libraryCount + gearCount

    const response = NextResponse.json({
      stackItems: totalStackItems,
      stackItemsLimit: usageData.stack_items_limit || 20, // Use actual limit from database
      currentTier: usageData.tier || 'free',
      isInTrial: usageData.is_in_trial || false,
      trialEndedAt: usageData.trial_ended_at,
      breakdown: {
        supplements: stackItemsCount,
        protocols: protocolsCount,
        uploads: uploadsCount,
        library: libraryCount,
        gear: gearCount
      }
    })

    // Add cache-busting headers for Safari
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    return response

  } catch (error) {
    console.error('Usage status API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
