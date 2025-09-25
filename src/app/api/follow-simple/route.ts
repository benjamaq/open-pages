import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { ownerUserId, email } = await request.json()
    
    console.log('🔍 Simple follow API received:', { ownerUserId, email })

    if (!ownerUserId) {
      return NextResponse.json({ error: 'Owner user ID is required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Check if owner allows followers
    const { data: ownerProfile, error: ownerError } = await supabase
      .from('profiles')
      .select('allow_stack_follow, display_name, slug, user_id')
      .eq('user_id', ownerUserId)
      .single()

    if (ownerError || !ownerProfile) {
      console.error('❌ Profile not found:', ownerError)
      return NextResponse.json({ error: 'Owner profile not found' }, { status: 404 })
    }

    if (!ownerProfile.allow_stack_follow) {
      return NextResponse.json({ error: 'This user does not allow followers' }, { status: 400 })
    }

    // Get current user (if signed in)
    const { data: { user } } = await supabase.auth.getUser()

    // Check if already following to prevent duplicates
    const { data: existingFollow } = await supabase
      .from('stack_followers')
      .select('id, verified_at')
      .eq('owner_user_id', ownerUserId)
      .eq('follower_email', email)
      .single()

    if (existingFollow) {
      if (existingFollow.verified_at) {
        return NextResponse.json({ 
          status: 'already_following',
          message: `You're already following ${ownerProfile.display_name}'s stack!`
        })
      } else {
        // Update existing unverified follow
        const { error: updateError } = await supabase
          .from('stack_followers')
          .update({ verified_at: new Date().toISOString() })
          .eq('id', existingFollow.id)

        if (updateError) {
          console.error('Error updating follow:', updateError)
          return NextResponse.json({ error: 'Failed to update follow status' }, { status: 500 })
        }

        return NextResponse.json({ 
          status: 'following',
          message: `You're now following ${ownerProfile.display_name}'s stack!`
        })
      }
    }

    // Try to insert into database
    const { data: newFollow, error: followError } = await supabase
      .from('stack_followers')
      .insert({
        owner_user_id: ownerUserId,
        follower_email: email,
        verified_at: new Date().toISOString() // Auto-verify for now
      })
      .select('id')
      .single()

    if (followError) {
      console.error('Error creating follow:', followError)
      console.error('Follow error details:', JSON.stringify(followError, null, 2))
      
      // Handle specific error cases
      if (followError.code === '23505') { // Unique constraint violation
        return NextResponse.json({ 
          status: 'already_following',
          message: `You're already following ${ownerProfile.display_name}'s stack!`
        })
      }
      
      return NextResponse.json({ 
        error: 'Failed to create follow',
        details: followError.message 
      }, { status: 500 })
    }

    // Create email preferences
    const { error: prefsError } = await supabase
      .from('email_prefs')
      .insert({
        follower_id: newFollow.id,
        cadence: 'weekly'
      })

    if (prefsError) {
      console.error('Error creating email preferences:', prefsError)
      // Don't fail the whole operation for prefs error
    }

    console.log('✅ Follow created in database:', {
      owner: ownerProfile.display_name,
      email: email,
      followId: newFollow.id,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json({ 
      status: 'following',
      message: `You're now following ${ownerProfile.display_name}'s stack!`,
      owner: ownerProfile.display_name
    })

  } catch (error) {
    console.error('❌ Simple follow API error:', error)
    return NextResponse.json({ error: 'Follow failed', details: error.message }, { status: 500 })
  }
}
