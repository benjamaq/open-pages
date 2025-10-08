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
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      console.error('Profile not found:', profileError)
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
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
        schedule_days: [1, 2, 3, 4, 5, 6, 7], // Default to all days
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
