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

    // Resolve YYYY-MM-DD strings (UTC-based). If your system stores per-user local dates,
    // consider deriving these with the user's timezone.
    const todayStr = new Date().toISOString().slice(0, 10)
    const yDate = new Date()
    yDate.setUTCDate(yDate.getUTCDate() - 1)
    const yesterdayStr = yDate.toISOString().slice(0, 10)

    // 3) Get yesterday's entry by composite key (user_id, local_date)
    const { data: yEntry, error: yErr } = await supabase
      .from('daily_entries')
      .select('pain, mood, sleep_quality, meds, protocols, local_date')
      .eq('user_id', userId)
      .eq('local_date', yesterdayStr)
      .maybeSingle()
    if (yErr) return NextResponse.json({ ok: false, error: yErr.message }, { status: 500 })
    if (!yEntry) return NextResponse.json({ ok: false, error: 'No previous entry' }, { status: 404 })

    // 4) If already has a non-placeholder today, mark used and exit OK idempotent
    const { data: todayExisting } = await supabase
      .from('daily_entries')
      .select('is_placeholder, local_date')
      .eq('user_id', userId)
      .eq('local_date', todayStr)
      .maybeSingle()
    if (todayExisting && !todayExisting.is_placeholder) {
      await supabase.from('magic_checkin_tokens').update({ used_at: new Date().toISOString() }).eq('id', tokenRow.id)
      return NextResponse.json({ ok: true, already: true })
    }

    // 4b) Create today's placeholder using yesterday's data (no id column; composite key)
    const insertPayload: any = {
      user_id: userId,
      local_date: todayStr,
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


