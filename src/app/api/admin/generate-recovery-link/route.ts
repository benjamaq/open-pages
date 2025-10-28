import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'

function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createSupabaseAdmin(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

function isProd() {
  return process.env.NODE_ENV === 'production'
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('user_id') || undefined
    const email = searchParams.get('email') || undefined

    if (!userId && !email) {
      return NextResponse.json({ ok: false, error: 'Provide user_id or email' }, { status: 400 })
    }

    // Simple protection: require X-Admin-Key in production
    if (isProd()) {
      const headerKey = req.headers.get('x-admin-key')
      if (!headerKey || headerKey !== process.env.ADMIN_API_KEY) {
        return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
      }
    }

    const admin = supabaseAdmin()
    const payload: any = { type: 'recovery' }
    if (userId) payload.userId = userId
    if (email) payload.email = email

    const { data, error } = await (admin as any).auth.admin.generateLink(payload)
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true, link: data?.action_link, email: data?.email })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Server error' }, { status: 500 })
  }
}


