import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createSupabaseAdmin(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

async function processTokenAndBuildRedirect(req: NextRequest): Promise<NextResponse> {
  const url = new URL(req.url)
  const qpToken = url.searchParams.get('token')
  let token = (qpToken || '').toString().trim()
  if (!token && req.method === 'POST') {
    try { const body = await req.json(); token = (body?.token || '').toString().trim() } catch {}
  }
  if (!token) {
    const errUrl = new URL('/checkin/success', url.origin)
    errUrl.searchParams.set('error', 'missing_token')
    return NextResponse.redirect(errUrl)
  }

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
  const supabase = admin()

  // Verify token
  const { data: tokenRow, error: tokenErr } = await supabase
    .from('magic_checkin_tokens')
    .select('id, user_id, expires_at, used_at, revoked')
    .eq('token_hash', tokenHash)
    .limit(1)
    .maybeSingle()
  if (tokenErr || !tokenRow || tokenRow.revoked) {
    const errUrl = new URL('/checkin/success', url.origin)
    errUrl.searchParams.set('error', tokenErr ? 'server_error' : (!tokenRow ? 'invalid_token' : 'revoked_token'))
    return NextResponse.redirect(errUrl)
  }
  if (tokenRow.used_at) {
    // If already used, still show success for today
    const todayStr = new Date().toISOString().slice(0, 10)
    const successUrl = new URL('/checkin/success', url.origin)
    successUrl.searchParams.set('date', todayStr)
    return NextResponse.redirect(successUrl)
  }
  if (tokenRow.expires_at && new Date(tokenRow.expires_at).getTime() < Date.now()) {
    const errUrl = new URL('/checkin/success', url.origin)
    errUrl.searchParams.set('error', 'expired_token')
    return NextResponse.redirect(errUrl)
  }

  const userId = tokenRow.user_id as string
  const todayStr = new Date().toISOString().slice(0, 10)
  const yDate = new Date()
  yDate.setUTCDate(yDate.getUTCDate() - 1)
  const yesterdayStr = yDate.toISOString().slice(0, 10)

  // Check today's existing
  const { data: todayExistingFull } = await supabase
    .from('daily_entries')
    .select('pain, mood, sleep_quality, is_placeholder, local_date')
    .eq('user_id', userId)
    .eq('local_date', todayStr)
    .maybeSingle()
  if (todayExistingFull && todayExistingFull.is_placeholder === false) {
    await supabase.from('magic_checkin_tokens').update({ used_at: new Date().toISOString() }).eq('id', tokenRow.id)
    const successUrl = new URL('/checkin/success', url.origin)
    successUrl.searchParams.set('date', todayStr)
    if (todayExistingFull.pain != null) successUrl.searchParams.set('pain', String(todayExistingFull.pain))
    if (todayExistingFull.mood != null) successUrl.searchParams.set('mood', String(todayExistingFull.mood))
    if (todayExistingFull.sleep_quality != null) successUrl.searchParams.set('sleep', String(todayExistingFull.sleep_quality))
    return NextResponse.redirect(successUrl)
  }

  // Get yesterday's entry
  const { data: yEntry, error: yErr } = await supabase
    .from('daily_entries')
    .select('pain, mood, sleep_quality, meds, protocols, local_date')
    .eq('user_id', userId)
    .eq('local_date', yesterdayStr)
    .maybeSingle()
  if (yErr || !yEntry) {
    const errUrl = new URL('/checkin/success', url.origin)
    errUrl.searchParams.set('error', yErr ? 'server_error' : 'no_previous_entry')
    return NextResponse.redirect(errUrl)
  }

  // Create today's placeholder copying values
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
  if (insErr) {
    const errUrl = new URL('/checkin/success', url.origin)
    errUrl.searchParams.set('error', 'insert_failed')
    return NextResponse.redirect(errUrl)
  }

  // Mark token used
  await supabase.from('magic_checkin_tokens').update({ used_at: new Date().toISOString() }).eq('id', tokenRow.id)

  // Redirect to success with details
  const successUrl = new URL('/checkin/success', url.origin)
  successUrl.searchParams.set('date', todayStr)
  if (yEntry.pain != null) successUrl.searchParams.set('pain', String(yEntry.pain))
  if (yEntry.mood != null) successUrl.searchParams.set('mood', String(yEntry.mood))
  if (yEntry.sleep_quality != null) successUrl.searchParams.set('sleep', String(yEntry.sleep_quality))
  return NextResponse.redirect(successUrl)
}

export async function POST(req: NextRequest) {
  try {
    return await processTokenAndBuildRedirect(req)
  } catch (e: any) {
    const url = new URL(req.url)
    const errUrl = new URL('/checkin/success', url.origin)
    errUrl.searchParams.set('error', 'server_error')
    return NextResponse.redirect(errUrl)
  }
}

export async function GET(req: NextRequest) {
  try {
    return await processTokenAndBuildRedirect(req)
  } catch (e: any) {
    const url = new URL(req.url)
    const errUrl = new URL('/checkin/success', url.origin)
    errUrl.searchParams.set('error', 'server_error')
    return NextResponse.redirect(errUrl)
  }
}


