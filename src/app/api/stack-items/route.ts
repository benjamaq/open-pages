import { createClient } from '../../../lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, dose, item_type, frequency } = await request.json()
    
    if (!name || !item_type) {
      return NextResponse.json({ error: 'Name and item_type are required' }, { status: 400 })
    }

    // Get the user's profile
    let { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    // Auto-create a minimal profile if missing (to unblock add flow)
    if (profileError || !profile) {
      const guessName = (user.email || '').split('@')[0] || 'You'
      const { data: created, error: createErr } = await supabase
        .from('profiles')
        .insert({ user_id: user.id, name: guessName })
        .select('id')
        .maybeSingle()
      if (createErr || !created) {
        console.error('Profile not found and failed to create:', profileError || createErr)
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
      }
      profile = created
    }

    // Add the stack item
    const { data, error } = await supabase
      .from('stack_items')
      .insert({
        profile_id: profile.id,
        name,
        dose: dose || null,
        item_type,
        frequency: frequency || 'daily',
        // Default to all days (0=Sun..6=Sat) to match dashboard filtering
        schedule_days: [0, 1, 2, 3, 4, 5, 6],
        notes: null,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error adding stack item:', error)
      return NextResponse.json({ error: 'Failed to add stack item' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Stack item creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
