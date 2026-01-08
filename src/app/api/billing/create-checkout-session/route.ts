import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { stripe } from '../../../../lib/stripe'
import { getPriceId } from '../../../../lib/stripe'
import { Database } from '../../../../lib/types'

export async function POST(request: NextRequest) {
  // Top-level guard to ensure JSON is always returned
  try {
    console.log('[checkout] Step 1: Got request')
    const body = await request.json()
    const { plan, period, promoCode, userId, userEmail } = body || {}
    console.log('[checkout] Step 2: Parsed body:', { plan, period, userId, userEmail, hasPromo: Boolean(promoCode) })
    
    // Validate required parameters
    if (!userId || !userEmail) {
      return NextResponse.json({ error: 'User ID and email are required' }, { status: 400 })
    }

    console.log('[checkout] Step 3: Using userId/email', { userId, userEmail })
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3009'

    // Create a simple Supabase client for database queries (no auth needed)
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return [] },
          setAll() {},
        },
      }
    )

    // Get user's profile for metadata
    const { data: profile } = await supabase
      .from('profiles')
      .select('slug, display_name')
      .eq('user_id', userId)
      .single()

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
      return NextResponse.json({ error: 'Billing not configured' }, { status: 503 })
    }
    console.log('[checkout] Step 5: Creating Stripe session...')
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
      cancel_url: `${origin}/pricing`,
      metadata: {
        user_id: userId,
        plan: effectivePlan,
        period: period,
        profile_slug: profile?.slug || '',
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