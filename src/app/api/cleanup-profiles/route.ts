import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Get all profiles for this user
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (profilesError) {
      return NextResponse.json({ error: 'Failed to fetch profiles', details: profilesError.message }, { status: 500 })
    }

    if (!profiles || profiles.length <= 1) {
      return NextResponse.json({ 
        message: 'No duplicate profiles found',
        profiles: profiles?.length || 0
      })
    }

    // Keep the most recent profile (first in the ordered list)
    const keepProfile = profiles[0]
    const duplicateProfiles = profiles.slice(1)

    console.log(`🧹 Found ${duplicateProfiles.length} duplicate profiles for user ${user.id}`)
    console.log(`✅ Keeping profile: ${keepProfile.id} (${keepProfile.display_name})`)

    // Delete duplicate profiles
    const duplicateIds = duplicateProfiles.map(p => p.id)
    const { error: deleteError } = await supabase
      .from('profiles')
      .delete()
      .in('id', duplicateIds)

    if (deleteError) {
      console.error('Error deleting duplicate profiles:', deleteError)
      return NextResponse.json({ 
        error: 'Failed to delete duplicate profiles', 
        details: deleteError.message 
      }, { status: 500 })
    }

    console.log(`🗑️ Deleted ${duplicateIds.length} duplicate profiles`)

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${duplicateIds.length} duplicate profiles`,
      keptProfile: {
        id: keepProfile.id,
        display_name: keepProfile.display_name,
        slug: keepProfile.slug
      },
      deletedProfiles: duplicateIds.length
    })

  } catch (error) {
    console.error('Profile cleanup error:', error)
    return NextResponse.json({ 
      error: 'Profile cleanup failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
