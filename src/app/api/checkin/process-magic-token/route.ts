import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createSupabaseAdmin(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

export async function POST(req: NextRequest) {
  try {
    const { token: bodyToken } = await req.json().catch(() => ({}))
    const url = new URL(req.url)
    const qpToken = url.searchParams.get('token')
    const token = (bodyToken || qpToken || '').toString().trim()
    if (!token) return NextResponse.json({ ok: false, error: 'Missing token' }, { status: 400 })

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
    const supabase = admin()

    // 1) Verify token
    const { data: tokenRow, error: tokenErr } = await supabase
      .from('magic_checkin_tokens')
      .select('id, user_id, expires_at, used_at, revoked')
      .eq('token_hash', tokenHash)
      .limit(1)
      .maybeSingle()
    if (tokenErr) return NextResponse.json({ ok: false, error: tokenErr.message }, { status: 500 })
    if (!tokenRow) return NextResponse.json({ ok: false, error: 'Invalid token' }, { status: 400 })
    if (tokenRow.revoked) return NextResponse.json({ ok: false, error: 'Token revoked' }, { status: 400 })
    if (tokenRow.used_at) return NextResponse.json({ ok: false, error: 'Token already used' }, { status: 400 })
    if (tokenRow.expires_at && new Date(tokenRow.expires_at).getTime() < Date.now()) {
      return NextResponse.json({ ok: false, error: 'Token expired' }, { status: 400 })
    }

    const userId = tokenRow.user_id as string

    // Resolve yesterday (server-midnight window)
    const todayStart = new Date(); todayStart.setHours(0,0,0,0)
    const yesterdayStart = new Date(todayStart); yesterdayStart.setDate(todayStart.getDate() - 1)

    // 3) Get yesterday's entry
    const { data: yEntry, error: yErr } = await supabase
      .from('daily_entries')
      .select('id, pain, mood, sleep_quality, meds, protocols')
      .eq('user_id', userId)
      .gte('created_at', yesterdayStart.toISOString())
      .lt('created_at', todayStart.toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (yErr) return NextResponse.json({ ok: false, error: yErr.message }, { status: 500 })
    if (!yEntry) return NextResponse.json({ ok: false, error: 'No previous entry' }, { status: 404 })

    // 4) If already has a non-placeholder today, mark used and exit OK idempotent
    const { data: todayExisting } = await supabase
      .from('daily_entries')
      .select('id, is_placeholder')
      .eq('user_id', userId)
      .gte('created_at', todayStart.toISOString())
      .limit(1)
    if (todayExisting && todayExisting.length > 0 && !todayExisting[0]?.is_placeholder) {
      await supabase.from('magic_checkin_tokens').update({ used_at: new Date().toISOString() }).eq('id', tokenRow.id)
      return NextResponse.json({ ok: true, already: true })
    }

    // 4b) Create today's placeholder using yesterday's data
    const insertPayload: any = {
      user_id: userId,
      pain: yEntry.pain ?? null,
      mood: yEntry.mood ?? null,
      sleep_quality: yEntry.sleep_quality ?? null,
      meds: yEntry.meds ?? null,
      protocols: yEntry.protocols ?? null,
      is_placeholder: true,
      checkin_method: 'magic',
    }
    const { error: insErr } = await supabase.from('daily_entries').insert(insertPayload)
    if (insErr) return NextResponse.json({ ok: false, error: insErr.message }, { status: 500 })

    // 5) Mark token used
    await supabase.from('magic_checkin_tokens').update({ used_at: new Date().toISOString() }).eq('id', tokenRow.id)

    // 6) Return success
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Server error' }, { status: 500 })
  }
}


