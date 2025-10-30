import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { formatInTimeZone } from 'date-fns-tz'
import { format } from 'date-fns'

function getServiceClient() {
  const { createClient } = require('@supabase/supabase-js')
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing Supabase env. Require NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

async function handleMagic(request: NextRequest): Promise<NextResponse> {
  try { console.log('🔴🔴🔴 MAGIC ENDPOINT HIT 🔴🔴🔴'); } catch {}
  try {
    const url = new URL(request.url)
    const method = request.method.toUpperCase()
    let token = url.searchParams.get('token') || ''
    try { console.log('🔴 Raw token from URL:', token); } catch {}
    try { console.log('🔴 Token length:', token.length); } catch {}
    if (!token && method === 'POST') {
      try {
        const body = await request.json()
        token = body?.token || ''
      } catch {}
    }
    if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 })
    }

    const supabase = getServiceClient()

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
    try { console.log('🔴 Token hash:', tokenHash); } catch {}
    const { data: tokenRow, error: tokenErr } = await supabase
      .from('magic_checkin_tokens')
      .select('*')
      .eq('token_hash', tokenHash)
      .eq('revoked', false)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle()

    try { console.log('🔴 Token lookup result:', { found: !!tokenRow, error: tokenErr }); } catch {}
    try { console.log('🔴 User ID from token:', tokenRow?.user_id); } catch {}
    if (tokenErr || !tokenRow) {
      try { console.log('❌ Token invalid - redirecting'); } catch {}
      const errUrl = new URL('/checkin/success', url.origin)
      errUrl.searchParams.set('error', 'invalid_token')
      return NextResponse.redirect(errUrl)
    }

    const userId: string = tokenRow.user_id

    // Resolve timezone
    const { data: pref } = await supabase
      .from('profiles')
      .select('id, notification_preferences:notification_preferences(timezone)')
      .eq('user_id', userId)
      .maybeSingle()

    const timezone: string = (pref as any)?.notification_preferences?.timezone || 'UTC'
    try { console.log('🔴 Timezone resolved:', timezone); } catch {}

    // Compute local dates
    const now = new Date()
    const localTodayStr = formatInTimeZone(now, timezone, 'yyyy-MM-dd')
    // Simple yesterday calculation based on the local date string
    const yesterday = new Date(localTodayStr)
    yesterday.setDate(yesterday.getDate() - 1)
    const localYesterdayStr = format(yesterday, 'yyyy-MM-dd')
    try { console.log('🔴 Local dates:', { localTodayStr, localYesterdayStr }); } catch {}

    // If already checked in today (non-placeholder), no-op
    const { data: todayExisting } = await supabase
      .from('daily_entries')
      .select('id, is_placeholder')
      .eq('user_id', userId)
      .eq('local_date', localTodayStr)
      .maybeSingle()

    try { console.log('🔴 Today existing entry:', todayExisting); } catch {}
    if (todayExisting && todayExisting.is_placeholder === false) {
      // Mark token used to avoid reuse
      await supabase
        .from('magic_checkin_tokens')
        .update({ used_at: new Date().toISOString() })
        .eq('id', tokenRow.id)
      try { console.log('🔴 Marked token used; already checked in today'); } catch {}
      // Redirect to success with today date and pull today's entry values
      const { data: todayEntry } = await supabase
        .from('daily_entries')
        .select('pain,mood,sleep_quality,local_date')
        .eq('user_id', userId)
        .eq('local_date', localTodayStr)
        .maybeSingle()
      const okUrl = new URL('/checkin/success', url.origin)
      okUrl.searchParams.set('date', localTodayStr)
      if ((todayEntry as any)?.pain != null) okUrl.searchParams.set('pain', String((todayEntry as any).pain))
      if ((todayEntry as any)?.mood != null) okUrl.searchParams.set('mood', String((todayEntry as any).mood))
      if ((todayEntry as any)?.sleep_quality != null) okUrl.searchParams.set('sleep', String((todayEntry as any).sleep_quality))
      return NextResponse.redirect(okUrl)
    }

    // Get yesterday's entry
    const { data: y } = await supabase
      .from('daily_entries')
      .select('*')
      .eq('user_id', userId)
      .eq('local_date', localYesterdayStr)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    try { console.log('🔴 Yesterday entry exists:', !!y); } catch {}
    if (!y) {
      // No yesterday to copy; mark used and redirect with gentle message
      await supabase
        .from('magic_checkin_tokens')
        .update({ used_at: new Date().toISOString() })
        .eq('id', tokenRow.id)
      try { console.log('🔴 Marked token used; no yesterday to copy'); } catch {}
      const errUrl = new URL('/checkin/success', url.origin)
      errUrl.searchParams.set('error', 'no_yesterday_to_copy')
      return NextResponse.redirect(errUrl)
    }

    // Upsert today's entry using RPC to keep meds/protocols in sync
    const rpcPayload: Record<string, any> = {
      p_user_id: userId,
      p_local_date: localTodayStr,
      p_mood: y.mood ?? null,
      p_sleep_quality: y.sleep_quality ?? null,
      p_pain: y.pain ?? null,
      p_sleep_hours: y.sleep_hours ?? null,
      p_night_wakes: y.night_wakes ?? null,
      p_tags: y.tags ?? null,
      p_journal: y.journal ?? null,
      p_symptoms: y.symptoms ?? [],
      p_pain_locations: y.pain_locations ?? [],
      p_pain_types: y.pain_types ?? [],
      p_custom_symptoms: y.custom_symptoms ?? [],
      p_completed_items: null,
      p_wearables: y.wearables ?? {}
    }

    const { error: rpcErr } = await supabase.rpc('upsert_daily_entry_and_snapshot', rpcPayload)
    try { console.log('🔴 RPC upsert error (if any):', rpcErr); } catch {}
    if (rpcErr) {
      const errUrl = new URL('/checkin/success', url.origin)
      errUrl.searchParams.set('error', 'magic_failed')
      return NextResponse.redirect(errUrl)
    }

    // Mark as magic placeholder
    await supabase
      .from('daily_entries')
      .update({ checkin_method: 'magic', is_placeholder: true, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('local_date', localTodayStr)
    try { console.log('🔴 Marked today as magic placeholder'); } catch {}

    // Mark token used
    await supabase
      .from('magic_checkin_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', tokenRow.id)
    try { console.log('🔴 Marked token as used'); } catch {}

    try { console.log('✅ Redirecting: magic_success'); } catch {}
    const okUrl = new URL('/checkin/success', url.origin)
    okUrl.searchParams.set('date', localTodayStr)
    if (y.pain != null) okUrl.searchParams.set('pain', String(y.pain))
    if (y.mood != null) okUrl.searchParams.set('mood', String(y.mood))
    if (y.sleep_quality != null) okUrl.searchParams.set('sleep', String(y.sleep_quality))
    return NextResponse.redirect(okUrl)
  } catch (e) {
    console.error('Magic check-in error:', e)
    const errUrl = new URL('/checkin/success', new URL(request.url).origin)
    errUrl.searchParams.set('error', 'magic_error')
    return NextResponse.redirect(errUrl)
  }
}

export async function GET(request: NextRequest) {
  return handleMagic(request)
}

export async function POST(request: NextRequest) {
  return handleMagic(request)
}


