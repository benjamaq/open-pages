import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '../../../../lib/stripe'
import { getPriceId } from '../../../../lib/stripe'
import { Database } from '../../../../lib/types'

export async function POST(request: NextRequest) {
  // Top-level guard to ensure JSON is always returned
  try {
    console.log('[checkout] Request received')
    const body = await request.json().catch(() => ({}))
    let { plan, period, promoCode, userId, userEmail } = body || {}
    console.log('[checkout] Body:', body)
    console.log('[checkout] STRIPE_SECRET_KEY exists:', Boolean(process.env.STRIPE_SECRET_KEY))

    // Prefer URL origin to respect local dev port (e.g., :3012)
    const origin = new URL(request.url).origin || process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Resolve user from server-side auth if not provided
    const supabase = await createClient()
    if (!userId || !userEmail) {
      try {
        const { data: auth } = await supabase.auth.getUser()
        if (auth?.user) {
          userId = auth.user.id
          userEmail = auth.user.email || userEmail
        }
      } catch (e) {
        console.warn('[checkout] Could not resolve user from auth session', e)
      }
    }
    if (!userId || !userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.log('[checkout] Step 3: Using userId/email', { userId, userEmail })

    // Get user's profile for metadata
    const { data: profile } = await supabase
      .from('profiles')
      .select('slug, display_name')
      .eq('user_id', userId as string)
      .maybeSingle()

    // Map legacy 'pro' to 'premium' for branding while preserving price IDs
    const effectivePlan = (plan === 'premium' || plan === 'creator') ? plan : 'premium'
    let lastComputedPriceId: string | null = null
    const priceId = getPriceId(effectivePlan as any, period)
    lastComputedPriceId = priceId
    console.log('[checkout] Step 4: Price ID resolved:', priceId, 'for', effectivePlan, period)
    console.log('[checkout] Env candidates:', {
      PREMIUM_MONTHLY: process.env.NEXT_PUBLIC_STRIPE_PREMIUM_MONTHLY_PRICE_ID,
      PREMIUM_YEARLY: process.env.NEXT_PUBLIC_STRIPE_PREMIUM_YEARLY_PRICE_ID,
      PRO_MONTHLY: process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID,
      PRO_YEARLY: process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID
    })
    // Verify the price object to ensure billing interval is correct
    try {
      if (stripe?.prices?.retrieve) {
        const priceObj = await stripe.prices.retrieve(priceId)
        console.log('[checkout] Step 4a: Stripe price check:', {
          id: priceObj?.id,
          unit_amount: priceObj?.unit_amount,
          currency: priceObj?.currency,
          recurring: priceObj?.recurring,
          nickname: priceObj?.nickname
        })
      }
    } catch (e: any) {
      console.warn('[checkout] Price retrieve failed:', e?.message || e)
    }
    
    // Read attribution cookies from request for metadata
    const cookieHeader = request.headers.get('cookie') || ''
    const read = (name: string) => {
      const m = cookieHeader.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)'))
      return m ? decodeURIComponent(m[1]) : undefined
    }
    const firstTouch = read('bs_ft')
    const lastTouch = read('bs_lt')

    // Create checkout session
    if (!stripe) {
      console.error('[checkout] Stripe SDK not initialized — missing STRIPE_SECRET_KEY')
      return NextResponse.json({ error: 'Stripe not configured on server' }, { status: 500 })
    }
    console.log('[checkout] Step 5: Creating Stripe session…')
    try {
      const session = await stripe.checkout.sessions.create({
        customer_email: userEmail,
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${origin}/onboarding`,
        cancel_url: `${origin}/dashboard`,
        metadata: {
          user_id: userId,
          plan: effectivePlan,
          period: period,
          profile_slug: (profile as any)?.slug || '',
          first_touch: firstTouch || '',
          last_touch: lastTouch || '',
        },
        subscription_data: {
          metadata: {
            user_id: userId,
            plan: effectivePlan,
            period: period,
            first_touch: firstTouch || '',
            last_touch: lastTouch || '',
          },
        },
        // Add promo code if provided
        ...(promoCode && {
          discounts: [
            {
              coupon: promoCode,
            },
          ],
        }),
        // Allow promotion codes to be entered
        allow_promotion_codes: true,
      })
  
      if (!session.url) {
        throw new Error('Failed to create checkout session')
      }
  
      console.log('[checkout] Step 6: Session created', { id: session.id, url: session.url })
      return NextResponse.json({ url: session.url })
    } catch (stripeErr: any) {
      console.error('[checkout] STRIPE ERROR:', {
        message: stripeErr?.message,
        type: stripeErr?.type,
        code: stripeErr?.code,
        raw: stripeErr?.raw,
      })
      return NextResponse.json({ error: stripeErr?.message || 'Stripe error' }, { status: 500 })
    }
  } catch (error: any) {
    console.error('[checkout] FATAL ERROR:', error)
    // Try to include more actionable info (priceId and env keys) in response for debugging
    return NextResponse.json({
      error: 'Server error',
      details: error?.message || 'Unknown error',
      stack: error?.stack,
      name: error?.name,
      expectedEnvVars: {
        monthlyPrimary: 'NEXT_PUBLIC_STRIPE_PREMIUM_MONTHLY_PRICE_ID',
        yearlyPrimary: 'NEXT_PUBLIC_STRIPE_PREMIUM_YEARLY_PRICE_ID',
        monthlyFallback: 'NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID',
        yearlyFallback: 'NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID'
      }
    }, { status: 500 })
  }
}