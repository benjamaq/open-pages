import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = user.id

    const body = await req.json().catch(() => ({}))
    const subscription = body?.subscription
    if (!subscription || !subscription.endpoint) {
      return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 })
    }

    // Attempt to upsert into push_subscriptions; tolerate missing table in early environments
    try {
      const { data, error } = await (supabase as any)
        .from('push_subscriptions')
        .upsert({
          user_id: userId,
          endpoint: subscription.endpoint,
          expiration_time: subscription.expirationTime ?? null,
          subscription
        }, { onConflict: 'endpoint', ignoreDuplicates: false })

      try { console.log('[SUBSCRIBE] user_id:', userId) } catch {}
      try { console.log('[SUBSCRIBE] endpoint:', subscription.endpoint) } catch {}
      try { console.log('[SUBSCRIBE] upsert result:', { data, error }) } catch {}

      if (error) {
        // If table missing, return success so client flow can proceed
        if (error.message?.includes('relation') || error.message?.includes('table')) {
          return NextResponse.json({ ok: true, note: 'push_subscriptions table missing; skipped persist' })
        }
        // If duplicate key error still surfaces, convert to OK and continue
        if ((error as any).code === '23505' || /duplicate key value/i.test(error.message || '')) {
          return NextResponse.json({ ok: true, note: 'duplicate endpoint; treated as upsert' })
        }
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    } catch (err: any) {
      if (err?.message?.includes('relation') || err?.message?.includes('table')) {
        return NextResponse.json({ ok: true, note: 'push_subscriptions table missing; skipped persist' })
      }
      throw err
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}


