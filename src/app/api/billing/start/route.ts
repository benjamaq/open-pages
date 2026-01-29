import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe, getPriceId } from '@/lib/stripe'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const plan = String(url.searchParams.get('plan') || 'premium')
    const rawPeriod = String(url.searchParams.get('period') || 'yearly').toLowerCase()
    const period: 'monthly' | 'yearly' = rawPeriod === 'monthly' ? 'monthly' : 'yearly'

    // Always prefer the URL's origin so local dev ports are respected (e.g. :3012)
    const origin = url.origin || process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const supabase = await createClient()
    const { data: auth } = await supabase.auth.getUser()

    // If not signed in → go to sign-in (with create option), then bounce back here to start Stripe
    if (!auth?.user) {
      const next = `/api/billing/start?plan=${encodeURIComponent(plan)}&period=${encodeURIComponent(period)}`
      const signin = `${origin}/auth/signin?next=${encodeURIComponent(next)}`
      return NextResponse.redirect(signin)
    }

    if (!stripe) {
      return NextResponse.redirect(`${origin}/pricing?error=stripe_unavailable`)
    }

    // Resolve price
    const priceId = getPriceId(plan as any, period)

    // Create session
    const session = await stripe.checkout.sessions.create({
      customer_email: auth.user.email || undefined,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${origin}/onboarding`,
      cancel_url: `${origin}/pricing`,
      metadata: { user_id: auth.user.id, plan, period },
      subscription_data: { metadata: { user_id: auth.user.id, plan, period } },
      allow_promotion_codes: true
    })

    if (!session?.url) {
      return NextResponse.redirect(`${origin}/pricing?error=checkout_failed`)
    }

    return NextResponse.redirect(session.url)
  } catch (e: any) {
    const origin = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3009'
    return NextResponse.redirect(`${origin}/pricing?error=${encodeURIComponent(e?.message || 'failed')}`)
  }
}


