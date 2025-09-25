'use server'

import { createClient } from '../supabase/server'
import { stripe, getPriceId, type PlanType, type BillingPeriod } from '../stripe'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

export async function createCheckoutSession(
  plan: PlanType,
  period: BillingPeriod = 'monthly',
  promoCode?: string
) {
  const supabase = await createClient()
  const headersList = await headers()
  const origin = headersList.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3009'

  // Get authenticated user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    throw new Error('User must be authenticated')
  }

  // Get user's profile for metadata
  const { data: profile } = await supabase
    .from('profiles')
    .select('slug, display_name')
    .eq('user_id', user.id)
    .single()

  try {
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

    return { url: session.url }
  } catch (error) {
    console.error('Error creating checkout session:', error)
    throw new Error('Failed to create checkout session')
  }
}

export async function createCustomerPortalSession() {
  const supabase = await createClient()
  const headersList = await headers()
  const origin = headersList.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3009'

  // Get authenticated user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    throw new Error('User must be authenticated')
  }

  // Get user's Stripe customer ID
  const { data: userUsage } = await supabase
    .from('user_usage')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .single()

  if (!userUsage?.stripe_customer_id) {
    throw new Error('No Stripe customer found')
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: userUsage.stripe_customer_id,
      return_url: `${origin}/dash`,
    })

    return { url: session.url }
  } catch (error) {
    console.error('Error creating customer portal session:', error)
    throw new Error('Failed to create customer portal session')
  }
}

export async function handleUpgradeRedirect(plan: PlanType, period: BillingPeriod = 'monthly') {
  try {
    const { url } = await createCheckoutSession(plan, period)
    redirect(url)
  } catch (error) {
    console.error('Error handling upgrade redirect:', error)
    // Don't redirect to pricing page for NEXT_REDIRECT errors (normal redirects)
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error // Re-throw to let the redirect happen
    }
    redirect('/pricing?error=checkout_failed')
  }
}

export async function handlePortalRedirect() {
  try {
    const { url } = await createCustomerPortalSession()
    redirect(url)
  } catch (error) {
    console.error('Error handling portal redirect:', error)
    redirect('/dash?error=portal_failed')
  }
}
