import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const subscription = body?.subscription
    if (!subscription || !subscription.endpoint) {
      return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 })
    }

    // Attempt to upsert into push_subscriptions; tolerate missing table in early environments
    try {
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: user.id,
          endpoint: subscription.endpoint,
          expiration_time: subscription.expirationTime ?? null,
          subscription
        }, { onConflict: 'user_id' })

      if (error) {
        // If table missing, return success so client flow can proceed
        if (error.message?.includes('relation') || error.message?.includes('table')) {
          return NextResponse.json({ ok: true, note: 'push_subscriptions table missing; skipped persist' })
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


