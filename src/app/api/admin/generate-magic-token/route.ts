import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@/lib/supabase/server'

function getServiceClient() {
  const { createClient: createServiceClient } = require('@supabase/supabase-js')
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing Supabase env. Require NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  }
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const hoursParam = url.searchParams.get('hours')
    const expiryHours = Math.max(1, Math.min(168, Number(hoursParam ?? 48))) // clamp 1h..7d

    // Prefer the logged-in user's session; allow dev fallback via query param
    const supabaseAuth = await createClient()
    const { data: { user } } = await supabaseAuth.auth.getUser()
    let targetUserId: string | undefined
    if (user) {
      targetUserId = user.id
    } else if (process.env.NODE_ENV !== 'production') {
      const devUserId = url.searchParams.get('user_id') || undefined
      if (!devUserId) {
        return NextResponse.json({ success: false, error: 'user_id required in development when not logged in' }, { status: 400 })
      }
      if (!/^[-a-f0-9]{36}$/i.test(devUserId)) {
        return NextResponse.json({ success: false, error: 'Invalid user_id format' }, { status: 400 })
      }
      targetUserId = devUserId
    } else {
      return NextResponse.json({ success: false, error: 'Not logged in' }, { status: 401 })
    }

    const supabase = getServiceClient()

    // Generate raw token and hash
    const rawToken = crypto.randomBytes(32).toString('hex')
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
    const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000).toISOString()

    const { error } = await supabase
      .from('magic_checkin_tokens')
      .insert({ user_id: targetUserId, token_hash: tokenHash, expires_at: expiresAt })

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || url.origin
    const magicUrl = `${baseUrl}/api/checkin/magic?token=${rawToken}`

    return NextResponse.json({
      success: true,
      token: rawToken,
      url: magicUrl,
      expires_at: expiresAt,
    })
  } catch (e: any) {
    console.error('generate-magic-token error:', e)
    return NextResponse.json({ success: false, error: e?.message || 'Unknown error' }, { status: 500 })
  }
}


