import { NextResponse } from 'next/server'
import { createClient } from '../../../../lib/supabase/server'

// GET /api/beta/status - Check if current user is a beta user
export async function GET() {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ isBetaUser: false })
    }

    // Check if user has used a beta code
    const { data: betaCode } = await supabase
      .from('beta_codes')
      .select('*')
      .eq('used_by', user.id)
      .not('used_at', 'is', null)
      .single()

    const isBetaUser = !!betaCode && new Date((betaCode as any).expires_at) > new Date()
    const expiresAt = (betaCode as any)?.expires_at || null
    
    // Calculate days until expiration
    let daysUntilExpiration = null
    if (expiresAt) {
      const expirationDate = new Date(expiresAt)
      const now = new Date()
      const diffTime = expirationDate.getTime() - now.getTime()
      daysUntilExpiration = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    }

    return NextResponse.json({ 
      isBetaUser,
      expiresAt,
      daysUntilExpiration,
      isExpired: betaCode ? new Date((betaCode as any).expires_at) <= new Date() : false
    })

  } catch (error) {
    console.error('Beta status check error:', error)
    return NextResponse.json({ isBetaUser: false })
  }
}
