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
    const { data, error } = await (supabaseAdmin as any).rpc('redeem_promo_code', {
      p_code: code,
      p_user_id: user.id,
    })
    if (error) {
      const raw = String(error?.message || 'Failed')
      // Supabase/PostgREST may prefix exception messages; normalize to user-facing canonical strings.
      const msg = (() => {
        const s = raw.replace(/^([^:]+:)+\s*/, '').trim() // strip "P0001:" etc
        const lc = s.toLowerCase()
        if (lc.includes('code expired')) return 'Code expired'
        if (lc.includes('no redemptions left')) return 'No redemptions left'
        if (lc.includes('already redeemed')) return 'Already redeemed'
        if (lc.includes('code not found')) return 'Code not found'
        return s || 'Failed'
      })()
      return NextResponse.json({ error: msg }, { status: 400 })
    }

    return NextResponse.json({
      ok: true,
      message: '🎉 Pro unlocked for 30 days — welcome from Product Hunt!',
      data,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 })
  }
}


