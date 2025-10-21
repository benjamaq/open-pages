import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import webpush from 'web-push'

export async function POST(_req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('push_subscriptions')
      .select('subscription')
      .eq('user_id', user.id)
      .maybeSingle()

    if (error && !(error.message?.includes('relation') || error.message?.includes('table'))) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data?.subscription) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 404 })
    }

    const pub = process.env.VAPID_PUBLIC_KEY
    const priv = process.env.VAPID_PRIVATE_KEY
    if (!pub || !priv) {
      return NextResponse.json({ error: 'VAPID keys not configured' }, { status: 500 })
    }

    webpush.setVapidDetails('mailto:support@biostackr.io', pub, priv)
    await webpush.sendNotification(data.subscription, JSON.stringify({
      title: 'BioStackr',
      body: 'Time to check in – it only takes 20 seconds.',
      url: '/dash/today'
    }))

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}


