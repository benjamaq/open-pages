import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({})) as any
  const code = String(body?.code || '').trim().toUpperCase()
  if (!code) return NextResponse.json({ error: 'Code not found' }, { status: 400 })

  try {
    // Use new DB tables:
    // - public.promo_codes(id, code, max_redemptions, days_granted, expires_at, created_at)
    // - public.promo_redemptions(id, user_id, promo_code_id, redeemed_at, UNIQUE(user_id,promo_code_id))
    const { data: promo, error: promoErr } = await supabaseAdmin
      .from('promo_codes')
      .select('id,code,max_redemptions,days_granted,expires_at')
      .eq('code', code)
      .maybeSingle()
    if (promoErr) return NextResponse.json({ error: promoErr.message }, { status: 500 })
    if (!promo?.id) return NextResponse.json({ error: 'Code not found' }, { status: 404 })

    // Expiry
    try {
      const exp = (promo as any)?.expires_at ? new Date(String((promo as any).expires_at)) : null
      if (exp && Number.isFinite(exp.getTime()) && exp.getTime() <= Date.now()) {
        return NextResponse.json({ error: 'Code expired' }, { status: 410 })
      }
    } catch {}

    // Max redemptions
    const max = Number((promo as any)?.max_redemptions ?? 0) || 0
    if (max > 0) {
      const { count, error: countErr } = await supabaseAdmin
        .from('promo_redemptions')
        .select('id', { count: 'exact', head: true })
        .eq('promo_code_id', String((promo as any).id))
      if (countErr) return NextResponse.json({ error: countErr.message }, { status: 500 })
      if (Number(count || 0) >= max) {
        return NextResponse.json({ error: 'No redemptions left' }, { status: 410 })
      }
    }

    // Already redeemed for this user
    const { data: existing, error: existErr } = await supabaseAdmin
      .from('promo_redemptions')
      .select('id')
      .eq('user_id', user.id)
      .eq('promo_code_id', String((promo as any).id))
      .maybeSingle()
    if (existErr) return NextResponse.json({ error: existErr.message }, { status: 500 })
    if (existing?.id) return NextResponse.json({ error: 'Already redeemed' }, { status: 409 })

    // Insert redemption (unique constraint is a backstop)
    const { error: insErr } = await supabaseAdmin
      .from('promo_redemptions')
      .insert({
        user_id: user.id,
        promo_code_id: String((promo as any).id),
      } as any)
    if (insErr) {
      const msg = String((insErr as any)?.message || '')
      // Best-effort mapping for unique violations
      if (String((insErr as any)?.code || '') === '23505' || /duplicate key/i.test(msg)) {
        return NextResponse.json({ error: 'Already redeemed' }, { status: 409 })
      }
      return NextResponse.json({ error: msg || 'Failed' }, { status: 500 })
    }

    // Grant trial: set pro_expires_at = max(existing, now) + days_granted
    const grantsDays = Math.max(1, Math.floor(Number((promo as any)?.days_granted ?? 30) || 30))
    const { data: prof } = await supabaseAdmin
      .from('profiles')
      .select('pro_expires_at')
      .eq('user_id', user.id)
      .maybeSingle()
    const baseMs = (() => {
      try {
        const ms = prof?.pro_expires_at ? Date.parse(String((prof as any).pro_expires_at)) : NaN
        if (Number.isFinite(ms) && ms > Date.now()) return ms
      } catch {}
      return Date.now()
    })()
    const newExpiry = new Date(baseMs + grantsDays * 24 * 60 * 60 * 1000).toISOString()
    const { error: upErr } = await (supabaseAdmin as any)
      .from('profiles')
      .update({ pro_expires_at: newExpiry } as any)
      .eq('user_id', user.id)
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })

    return NextResponse.json({
      ok: true,
      message: `🎉 Pro unlocked for ${grantsDays} days — welcome from Product Hunt!`,
      pro_expires_at: newExpiry,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 })
  }
}


