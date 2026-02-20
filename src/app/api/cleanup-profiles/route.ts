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

    // Choose the profile to keep.
    // CRITICAL: stack_items is profile-scoped. If we delete the profile that owns stack_items, the stack can be lost (often via FK cascades).
    // So we keep the profile with the MOST stack_items, and migrate any stack_items from duplicates to the kept profile before deletion.
    const allProfiles = (profiles as any[]) as any[]
    const profileIds = allProfiles.map((p: any) => String(p?.id || '')).filter(Boolean)
    const countsByProfileId = new Map<string, number>()
    for (const pid of profileIds) {
      const { count } = await supabase
        .from('stack_items')
        .select('id', { count: 'exact', head: true })
        .eq('profile_id', pid)
      countsByProfileId.set(pid, Number(count || 0))
    }
    const sortedByMostStack = [...allProfiles].sort((a: any, b: any) => {
      const ca = countsByProfileId.get(String(a?.id || '')) || 0
      const cb = countsByProfileId.get(String(b?.id || '')) || 0
      if (cb !== ca) return cb - ca
      // tie-break: keep most recent
      const am = Date.parse(String(a?.created_at || '')) || 0
      const bm = Date.parse(String(b?.created_at || '')) || 0
      return bm - am
    })
    const keepProfile = sortedByMostStack[0] as any
    const duplicateProfiles = sortedByMostStack.slice(1) as any[]

    console.log(`🧹 Found ${duplicateProfiles.length} duplicate profiles for user ${user.id}`)
    console.log(`✅ Keeping profile: ${keepProfile.id} (${keepProfile.display_name})`)

    const duplicateIds = duplicateProfiles.map((p: any) => String(p.id)).filter(Boolean)

    // 1) Migrate stack_items from duplicate profiles → kept profile
    let movedStackItems = 0
    if (duplicateIds.length > 0) {
      const { count: moveCount, error: moveErr } = await (supabase
        .from('stack_items') as any)
        .update({ profile_id: String(keepProfile.id) })
        .in('profile_id', duplicateIds)
        .select('id', { count: 'exact', head: true })
      if (moveErr) {
        console.error('Error migrating stack_items from duplicate profiles:', moveErr)
        return NextResponse.json({
          error: 'Failed to migrate stack items from duplicate profiles',
          details: moveErr.message
        }, { status: 500 })
      }
      movedStackItems = Number(moveCount || 0)
    }

    // 2) Delete duplicate profiles (after migration)
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
        id: (keepProfile as any).id,
        display_name: (keepProfile as any).display_name,
        slug: (keepProfile as any).slug
      },
      deletedProfiles: duplicateIds.length,
      movedStackItems
    })

  } catch (error) {
    console.error('Profile cleanup error:', error)
    return NextResponse.json({ 
      error: 'Profile cleanup failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
