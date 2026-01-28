import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!stripe) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
    }

    // Lookup Stripe customer id from user_usage or fallback by email
    let customerId: string | null = null
    try {
      const { data: usage } = await supabase
        .from('user_usage')
        .select('stripe_customer_id')
        .eq('user_id', user.id)
        .maybeSingle()
      customerId = (usage as any)?.stripe_customer_id || null
    } catch {}

    if (!customerId && user.email && stripe.customers?.search) {
      const search = await stripe.customers.search({ query: `email:'${user.email}'` })
      const c = search.data?.[0]
      customerId = c?.id || null
    }

    if (!customerId) {
      return NextResponse.json({ error: 'Stripe customer not found' }, { status: 400 })
    }

    const portal = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3012/settings'
    })
    return NextResponse.redirect(portal.url, { status: 303 })
  } catch (e: any) {
    console.error('[billing/portal] ERROR:', e?.message || e)
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 })
  }
}


