import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../lib/supabase/server'

// POST /api/beta/validate - Validate and use beta code
export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json()

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Beta code is required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Check if user already used a beta code
    const { data: existingBeta } = await supabase
      .from('beta_codes')
      .select('*')
      .eq('used_by', user.id)
      .not('used_at', 'is', null)
      .single()

    if (existingBeta) {
      return NextResponse.json({ 
        error: 'You have already used a beta code',
        isBetaUser: true 
      }, { status: 400 })
    }

    // Find and validate beta code
    const { data: betaCode, error: codeError } = await supabase
      .from('beta_codes')
      .select('*')
      .eq('code', code.toUpperCase())
      .is('used_by', null)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (codeError || !betaCode) {
      return NextResponse.json({ 
        error: 'Invalid or expired beta code' 
      }, { status: 400 })
    }

    // Mark beta code as used
    const { error: updateError } = await supabase
      .from('beta_codes')
      .update({ 
        used_by: user.id, 
        used_at: new Date().toISOString() 
      })
      .eq('code', code.toUpperCase())

    if (updateError) {
      console.error('Error updating beta code:', updateError)
      return NextResponse.json({ error: 'Failed to activate beta code' }, { status: 500 })
    }

    // Update user's profile to mark beta code used
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ beta_code_used_at: new Date().toISOString() })
      .eq('user_id', user.id)

    if (profileError) {
      console.error('Error updating profile:', profileError)
      // Don't fail here, beta code is already used
    }

    return NextResponse.json({ 
      success: true,
      message: 'Beta code activated! You now have Pro access for 6 months.',
      expiresAt: betaCode.expires_at
    })

  } catch (error) {
    console.error('Beta code validation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
