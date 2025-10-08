import { createClient } from '../../../../lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

async function handleUpdate(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const updates = await request.json()
    console.log('Profile update request:', updates)
    
    // Validate allowed fields
    const allowedFields = [
      'display_name', 
      'bio', 
      'avatar_url',
      'onboarding_completed',
      'onboarding_step',
      'first_checkin_completed',
      'first_supplement_added',
      'profile_created',
      'public_page_viewed',
      'mission_statement',
      'allow_stack_follow'
    ]
    const filteredUpdates = Object.keys(updates)
      .filter(key => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = updates[key]
        return obj
      }, {} as any)
    
    console.log('Filtered updates:', filteredUpdates)

    if (Object.keys(filteredUpdates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    // Update the profile
    const { data: profiles, error } = await supabase
      .from('profiles')
      .update(filteredUpdates)
      .eq('user_id', user.id)
      .select()
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Profile update error:', error)
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    const data = profiles && profiles.length > 0 ? profiles[0] : null
    console.log('Profile update result:', data)

    if (!data) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Invalidate the dashboard cache to force fresh data on next request
    revalidatePath('/dash')
    console.log('Cache invalidated for /dash')

    return NextResponse.json({ success: true, profile: data })

  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}

// Export both PATCH and POST to support different calling methods
export async function PATCH(request: NextRequest) {
  return handleUpdate(request)
}

export async function POST(request: NextRequest) {
  return handleUpdate(request)
}