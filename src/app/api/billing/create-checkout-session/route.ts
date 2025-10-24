import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { stripe } from '../../../../lib/stripe'
import { getPriceId } from '../../../../lib/stripe'
import { Database } from '../../../../lib/types'

export async function POST(request: NextRequest) {
  try {
    const { plan, period, promoCode, userId, userEmail } = await request.json()
    
    // Validate required parameters
    if (!userId || !userEmail) {
      return NextResponse.json({ error: 'User ID and email are required' }, { status: 400 })
    }

    console.log('API Route - Received params:', { plan, period, userId, userEmail })
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
    const priceId = getPriceId(effectivePlan as any, period)
    
    // Read attribution cookies from request for metadata
    const cookieHeader = request.headers.get('cookie') || ''
    const read = (name: string) => {
      const m = cookieHeader.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)'))
      return m ? decodeURIComponent(m[1]) : undefined
    }
    const firstTouch = read('bs_ft')
    const lastTouch = read('bs_lt')

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer_email: userEmail,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${origin}/dash?welcome=premium`,
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

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    })
    return NextResponse.json({ 
      error: 'Failed to create checkout session',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}