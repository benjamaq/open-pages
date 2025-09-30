import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { stripe } from '../../../../lib/stripe'
import { getPriceId } from '../../../../lib/stripe'
import { Database } from '../../../../lib/types'

export async function POST(request: NextRequest) {
  try {
    // Create Supabase client with request cookies
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            // This is a server-side API route, we can't set cookies here
            // The client will handle session management
          },
        },
      }
    )

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    console.log('API Route - User check:', { user: !!user, error: userError })
    console.log('API Route - Cookies:', request.cookies.getAll().map(c => ({ name: c.name, value: c.value.substring(0, 20) + '...' })))
    
    if (userError || !user) {
      console.error('Authentication error:', userError)
      return NextResponse.json({ error: 'User must be authenticated' }, { status: 401 })
    }

    const { plan, period, promoCode } = await request.json()
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3009'

    // Get user's profile for metadata
    const { data: profile } = await supabase
      .from('profiles')
      .select('slug, display_name')
      .eq('user_id', user.id)
      .single()

    const priceId = getPriceId(plan, period)
    
    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer_email: user.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${origin}/dash?welcome=pro`,
      cancel_url: `${origin}/pricing`,
      metadata: {
        user_id: user.id,
        plan: plan,
        period: period,
        profile_slug: profile?.slug || '',
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          plan: plan,
          period: period,
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
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}