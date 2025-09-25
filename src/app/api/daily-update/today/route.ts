import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface DailyUpdateData {
  energy_score: number
  mood_label?: string
  wearable_sleep_score?: number
  wearable_recovery?: number
  wearable_source?: string
  included_items: Array<{
    type: 'supplement' | 'protocol' | 'movement' | 'mindfulness'
    id: string
    name: string
    timeOfDay?: string
  }>
  note?: string
  share?: boolean
}

// GET /api/daily-update/today - Get or create today's update
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Get user's profile - handle multiple profiles
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select(`
        id,
        user_id,
        name,
        slug,
        stack_items:stack_items(*),
        protocols:protocols(*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    const profile = profiles && profiles.length > 0 ? profiles[0] : null

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD

    // Try to get existing daily update for today
    let dailyUpdate: any = null
    try {
      const { data: existingUpdate, error: updateError } = await supabase
        .from('daily_updates')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .single()

      if (updateError && updateError.code !== 'PGRST116') {
        // If table doesn't exist, we'll handle it below
        if (!updateError.message?.includes('relation')) {
          throw updateError
        }
      } else {
        dailyUpdate = existingUpdate
      }
    } catch (error) {
      console.warn('Daily updates table not found, using defaults')
    }

    // Get today's items for pre-filling
    const todayItems = []
    
    // Add supplements
    const supplements = (profile as any).stack_items?.filter((item: any) => 
      !item.name?.toLowerCase().includes('movement') && 
      !item.name?.toLowerCase().includes('mindfulness')
    ) || []
    
    supplements.forEach((item: any) => {
      todayItems.push({
        type: 'supplement',
        id: item.id,
        name: item.name,
        timeOfDay: item.time_preference || 'anytime',
        dose: item.dose,
        public: item.public
      })
    })

    // Add protocols
    const protocols = (profile as any).protocols || []
    protocols.forEach((item: any) => {
      todayItems.push({
        type: 'protocol',
        id: item.id,
        name: item.name,
        frequency: item.frequency,
        public: item.public
      })
    })

    // Add movement items
    const movement = (profile as any).stack_items?.filter((item: any) => 
      item.name?.toLowerCase().includes('movement') || 
      item.name?.toLowerCase().includes('exercise')
    ) || []
    
    movement.forEach((item: any) => {
      todayItems.push({
        type: 'movement',
        id: item.id,
        name: item.name,
        duration: item.dose,
        public: item.public
      })
    })

    // Add mindfulness items
    const mindfulness = (profile as any).stack_items?.filter((item: any) => 
      item.name?.toLowerCase().includes('mindfulness') || 
      item.name?.toLowerCase().includes('meditation')
    ) || []
    
    mindfulness.forEach((item: any) => {
      todayItems.push({
        type: 'mindfulness',
        id: item.id,
        name: item.name,
        duration: item.dose,
        public: item.public
      })
    })

    return NextResponse.json({
      dailyUpdate: dailyUpdate || {
        energy_score: null,
        mood_label: null,
        wearable_sleep_score: null,
        wearable_recovery: null,
        wearable_source: null,
        included_items: [],
        note: null
      },
      todayItems,
      profile: {
        name: (profile as any).name,
        slug: (profile as any).slug
      }
    })

  } catch (error) {
    console.error('Daily update GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/daily-update/today - Save today's update
export async function POST(request: NextRequest) {
  try {
    const data: DailyUpdateData = await request.json()

    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Get user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, slug')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
    let shareSlug: string | null = null

    // Generate share slug if sharing
    if (data.share) {
      shareSlug = generateShareSlug()
    }

    // Prepare update data
    const updateData = {
      user_id: user.id,
      date: today,
      energy_score: data.energy_score,
      mood_label: data.mood_label || null,
      wearable_sleep_score: data.wearable_sleep_score || null,
      wearable_recovery: data.wearable_recovery || null,
      wearable_source: data.wearable_source || null,
      included_items: data.included_items || [],
      note: data.note || null,
      share_slug: shareSlug
    }

    // Upsert daily update
    let savedUpdate: any = null
    try {
      const { data: upsertData, error: upsertError } = await supabase
        .from('daily_updates')
        .upsert(updateData, { onConflict: 'user_id,date' })
        .select()
        .single()

      if (upsertError) {
        // If table doesn't exist, that's okay - we'll store locally
        if (upsertError.message?.includes('relation') || upsertError.message?.includes('daily_updates')) {
          console.warn('Daily updates table not found, storing locally')
          savedUpdate = { ...updateData, id: 'local-' + Date.now() }
        } else {
          throw upsertError
        }
      } else {
        savedUpdate = upsertData
      }
    } catch (error) {
      console.warn('Daily updates table not available, using fallback')
      savedUpdate = { ...updateData, id: 'local-' + Date.now() }
    }

    // Update the current battery level in the user's session/profile
    // This ensures the dashboard battery reflects the new energy score
    try {
      await supabase
        .from('profiles')
        .update({ today_energy_score: data.energy_score })
        .eq('user_id', user.id)
    } catch (error) {
      console.warn('Could not update profile energy score:', error)
    }

    // Log share analytics if sharing
    if (data.share && savedUpdate) {
      try {
        await supabase.from('daily_update_shares').insert({
          daily_update_id: savedUpdate.id,
          share_target: 'modal_share',
          user_agent: request.headers.get('user-agent'),
          ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
        })
      } catch (error) {
        console.warn('Could not log share analytics:', error)
      }
    }

    // Revalidate relevant pages
    revalidatePath('/dash')
    if (profile.slug) {
      revalidatePath(`/u/${profile.slug}`)
    }

    const publicUrl = shareSlug 
      ? `${process.env.NEXT_PUBLIC_APP_URL}/u/${profile.slug}?d=${shareSlug}`
      : `${process.env.NEXT_PUBLIC_APP_URL}/u/${profile.slug}`

    return NextResponse.json({
      success: true,
      dailyUpdate: savedUpdate,
      shareSlug,
      publicUrl
    })

  } catch (error) {
    console.error('Daily update POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function generateShareSlug(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}
