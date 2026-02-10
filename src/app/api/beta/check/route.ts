import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../lib/supabase/server'

// POST /api/beta/check - Check if beta code is valid (no auth required)
export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json()

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Beta code is required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Find and validate beta code (no auth required for checking)
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

    return NextResponse.json({ 
      success: true,
      message: 'Beta code is valid!',
      code: (betaCode as any).code,
      expiresAt: (betaCode as any).expires_at
    })

  } catch (error) {
    console.error('Beta code check error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
