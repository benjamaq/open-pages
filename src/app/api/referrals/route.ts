import { createClient } from '../../../lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/referrals - Get referral analytics
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check if user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get referral analytics
    const { data: referrals, error } = await supabase
      .from('profiles')
      .select('referral_code, referral_source, created_at')
      .not('referral_code', 'is', null)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching referrals:', error)
      return NextResponse.json({ error: 'Failed to fetch referrals' }, { status: 500 })
    }

    // Group by referral code and source
    const analytics = referrals.reduce((acc: any, profile: any) => {
      const code = profile.referral_code || 'unknown'
      const source = profile.referral_source || 'unknown'
      
      if (!acc[code]) {
        acc[code] = {
          code,
          count: 0,
          sources: {}
        }
      }
      
      acc[code].count++
      acc[code].sources[source] = (acc[code].sources[source] || 0) + 1
      
      return acc
    }, {})

    return NextResponse.json({
      total_referrals: referrals.length,
      analytics: Object.values(analytics)
    })

  } catch (error) {
    console.error('Referral analytics error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/referrals - Validate referral code
export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json()
    
    if (!code) {
      return NextResponse.json({ error: 'Referral code is required' }, { status: 400 })
    }

    // For now, we'll just validate that it's a known code
    const validCodes = ['redditgo', 'twitter', 'youtube', 'biohacker']
    const isValid = validCodes.includes(code.toLowerCase())
    
    return NextResponse.json({ 
      valid: isValid,
      code: code.toLowerCase(),
      message: isValid ? 'Valid referral code!' : 'Invalid referral code'
    })

  } catch (error) {
    console.error('Referral validation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

