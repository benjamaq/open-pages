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
    const returnToRaw = url.searchParams.get('returnTo') || ''

    // Always prefer the URL's origin so local dev ports are respected (e.g. :3012)
    const origin = url.origin || process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const referer = req.headers.get('referer') || ''
    const safeFrom = (() => {
      try {
        if (returnToRaw) {
          if (returnToRaw.startsWith('/')) return returnToRaw
          const u = new URL(returnToRaw, origin)
          if (u.origin === origin) return u.pathname + (u.search || '') + (u.hash || '')
        }
      } catch {}
      try {
        if (referer) {
          const r = new URL(referer)
          if (r.origin === origin) return r.pathname + (r.search || '') + (r.hash || '')
        }
      } catch {}
      return null
    })()

    const supabase = await createClient()
    const { data: auth } = await supabase.auth.getUser()

    // If not signed in → go to sign-in (with create option), then bounce back here to start Stripe
    if (!auth?.user) {
      const next = `/api/billing/start?plan=${encodeURIComponent(plan)}&period=${encodeURIComponent(period)}${safeFrom ? `&returnTo=${encodeURIComponent(safeFrom)}` : ''}`
      const signin = `${origin}/auth/signin?next=${encodeURIComponent(next)}`
      return NextResponse.redirect(signin)
    }

    if (!stripe) {
      return NextResponse.redirect(`${origin}/pricing/pro?error=stripe_unavailable`)
    }

    // Resolve price
    const priceId = getPriceId(plan as any, period)

    // Create session
    const session = await stripe.checkout.sessions.create({
      customer_email: auth.user.email || undefined,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${origin}/onboarding`,
      cancel_url: `${origin}${safeFrom || '/pricing/pro'}`,
      metadata: { user_id: auth.user.id, plan, period },
      subscription_data: { metadata: { user_id: auth.user.id, plan, period } },
      allow_promotion_codes: true
    })

    if (!session?.url) {
      return NextResponse.redirect(`${origin}${safeFrom || '/pricing/pro'}?error=checkout_failed`)
    }

    return NextResponse.redirect(session.url)
  } catch (e: any) {
    const origin = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    return NextResponse.redirect(`${origin}/pricing/pro?error=${encodeURIComponent(e?.message || 'failed')}`)
  }
}


