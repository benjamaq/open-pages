import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

function parseToken(t: string): { u: string; d: string; y: any; exp: number } | null {
  try {
    const json = Buffer.from(t.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')
    const obj = JSON.parse(json)
    if (!obj || typeof obj !== 'object') return null
    return obj
  } catch {
    return null
  }
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const token = url.searchParams.get('token') || ''
  // Try DB token first; fallback to legacy base64 token
  let userId = ''
  let day = new Date().toISOString().slice(0,10)
  let yesterday: any = null
  let valid = false
  try {
    const { data: row } = await supabaseAdmin
      .from('email_tokens')
      .select('user_id,token,expires_at,used_at,payload')
      .eq('token', token)
      .eq('type', 'quick_save')
      .maybeSingle()
    if (row && !row.used_at && new Date(row.expires_at).getTime() > Date.now()) {
      userId = String(row.user_id)
      valid = true
      // Optional payload (yesterday values)
      try { yesterday = row.payload ? JSON.parse(row.payload) : null } catch { yesterday = null }
      try {
        await supabaseAdmin.from('email_tokens').update({ used_at: new Date().toISOString() } as any).eq('token', token)
      } catch {}
    }
  } catch {}
  if (!valid) {
    const parsed = parseToken(token)
    if (!parsed) {
      return NextResponse.redirect(new URL('/dashboard?notice=invalid-token', req.url))
    }
    userId = parsed.u
    day = parsed.d
    yesterday = parsed.y
    const exp = parsed.exp
    if (!userId || !day || !exp || Date.now() > Number(exp)) {
      return NextResponse.redirect(new URL('/dashboard?notice=expired-token', req.url))
    }
  }
  try {
    // If there's already a daily entry for today, just redirect success
    const { data: existing } = await supabaseAdmin
      .from('daily_entries')
      .select('id')
      .eq('user_id', userId)
      .eq('local_date', day)
      .limit(1)
    if (!existing || existing.length === 0) {
      await supabaseAdmin
        .from('daily_entries')
        .upsert({
          user_id: userId,
          local_date: day,
          mood: yesterday?.mood ?? null,
          energy: yesterday?.energy ?? null,
          focus: yesterday?.focus ?? null,
          tags: null,
          supplement_intake: null,
          skipped_supplements: null,
        } as any, { onConflict: 'user_id,local_date', ignoreDuplicates: true })
    }
  } catch {
    // ignore and still redirect; user can check-in manually
  }
  return NextResponse.redirect(new URL('/dashboard?quicksave=success', req.url))
}

export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const body = await req.json().catch(() => ({}))
    const token = (body && body.token) || url.searchParams.get('token') || ''
    if (!token) return NextResponse.json({ ok: false, error: 'token required' }, { status: 400 })
    // DB token required for POST
    const { data: row } = await supabaseAdmin
      .from('email_tokens')
      .select('user_id,token,expires_at,used_at,payload')
      .eq('token', token)
      .eq('type', 'quick_save')
      .maybeSingle()
    if (!row) return NextResponse.json({ ok: false, error: 'invalid token' }, { status: 400 })
    if (row.used_at) return NextResponse.json({ ok: false, error: 'token used' }, { status: 400 })
    if (new Date(row.expires_at).getTime() <= Date.now()) return NextResponse.json({ ok: false, error: 'token expired' }, { status: 400 })
    const userId = String(row.user_id)
    const today = new Date().toISOString().slice(0,10)
    let yesterday: any = null
    try { yesterday = row.payload ? JSON.parse(row.payload) : null } catch {}
    // Upsert today's row
    const { data: existing } = await supabaseAdmin
      .from('daily_entries')
      .select('id')
      .eq('user_id', userId)
      .eq('local_date', today)
      .limit(1)
    if (!existing || existing.length === 0) {
      const { error: upErr } = await supabaseAdmin
        .from('daily_entries')
        .upsert({
          user_id: userId,
          local_date: today,
          mood: yesterday?.mood ?? null,
          energy: yesterday?.energy ?? null,
          focus: yesterday?.focus ?? null,
          tags: null,
          supplement_intake: null,
          skipped_supplements: null,
        } as any, { onConflict: 'user_id,local_date', ignoreDuplicates: true })
      if (upErr) return NextResponse.json({ ok: false, error: upErr.message }, { status: 500 })
    }
    await supabaseAdmin.from('email_tokens').update({ used_at: new Date().toISOString() } as any).eq('token', token)
    return NextResponse.json({ ok: true, redirect: '/dashboard?quicksave=success' })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'failed' }, { status: 500 })
  }
}


