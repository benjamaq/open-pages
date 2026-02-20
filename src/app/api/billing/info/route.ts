import { createClient } from '../../../../lib/supabase/server'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { isProActive } from '@/lib/entitlements/pro'

// Initialize Stripe (with error handling for missing env vars)
if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('STRIPE_SECRET_KEY not found - billing features will be disabled')
}

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY as string) : null

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const debug = (() => {
      try {
        const u = new URL(request.url)
        return u.searchParams.get('debug') === '1'
      } catch {
        return false
      }
    })()

    // If Stripe is not configured, still return isPaid using profile tier
    if (!stripe) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('tier,pro_expires_at')
        .eq('user_id', user.id)
        .single()
      const tierLc = String((profile as any)?.tier || '').toLowerCase()
      const isPaidByTier = isProActive({ tier: (profile as any)?.tier, pro_expires_at: (profile as any)?.pro_expires_at })
      // eslint-disable-next-line no-console
      console.log('[billing/info] user.id:', user.id)
      // eslint-disable-next-line no-console
      console.log('[billing/info] profile:', profile)
      // eslint-disable-next-line no-console
      console.log('[billing/info] tierLc:', tierLc)
      // eslint-disable-next-line no-console
      console.log('[billing/info] isPaidByTier:', isPaidByTier)
      return NextResponse.json({
        subscription: null,
        payment_method: null,
        invoices: [],
        usage: {
          current_period_start: new Date().toISOString(),
          current_period_end: new Date().toISOString(),
          features: []
        },
        tier: (profile as any)?.tier ?? null,
        pro_expires_at: (profile as any)?.pro_expires_at ?? null,
        isPaid: Boolean(isPaidByTier),
        ...(debug ? { _debug: { userId: user.id, email: user.email, tierLc, isPaidByTier, stripeConfigured: false } } : {})
      })
    }

    // Get user's subscription from database
    const { data: subscription }: { data: { stripe_customer_id?: string | null; stripe_subscription_id?: string | null } | null } = await supabase
      .from('user_usage')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // If no subscription in DB, return free plan info
    if (!subscription || !subscription.stripe_customer_id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('tier,pro_expires_at')
        .eq('user_id', user.id)
        .single()
      const tierLc = String((profile as any)?.tier || '').toLowerCase()
      const isPaidByTier = isProActive({ tier: (profile as any)?.tier, pro_expires_at: (profile as any)?.pro_expires_at })
      // eslint-disable-next-line no-console
      console.log('[billing/info] user.id:', user.id)
      // eslint-disable-next-line no-console
      console.log('[billing/info] profile:', profile)
      // eslint-disable-next-line no-console
      console.log('[billing/info] tierLc:', tierLc)
      // eslint-disable-next-line no-console
      console.log('[billing/info] isPaidByTier:', isPaidByTier)
      return NextResponse.json({
        subscription: null,
        payment_method: null,
        invoices: [],
        usage: await getUserUsage(supabase, user.id),
        tier: (profile as any)?.tier ?? null,
        pro_expires_at: (profile as any)?.pro_expires_at ?? null,
        isPaid: Boolean(isPaidByTier),
        ...(debug ? { _debug: { userId: user.id, email: user.email, tierLc, isPaidByTier, hasStripeCustomerId: false } } : {})
      })
    }

    // Get detailed info from Stripe
    const [stripeSubscription, paymentMethods, invoices] = await Promise.all([
      subscription.stripe_subscription_id 
        ? stripe.subscriptions.retrieve(subscription.stripe_subscription_id, {
            expand: ['default_payment_method']
          })
        : null,
      stripe.paymentMethods.list({
        customer: subscription.stripe_customer_id,
        type: 'card'
      }),
      stripe.invoices.list({
        customer: subscription.stripe_customer_id,
        limit: 10
      })
    ])

    // Format subscription info
    const subAny = stripeSubscription as any
    const subscriptionInfo = stripeSubscription ? {
      id: subAny.id,
      status: subAny.status,
      plan_name: subAny.items?.data?.[0]?.price?.nickname || 'Pro',
      plan_amount: subAny.items?.data?.[0]?.price?.unit_amount || 0,
      currency: subAny.items?.data?.[0]?.price?.currency || 'usd',
      current_period_start: new Date((subAny.current_period_start || 0) * 1000).toISOString(),
      current_period_end: new Date((subAny.current_period_end || 0) * 1000).toISOString(),
      cancel_at_period_end: subAny.cancel_at_period_end,
      trial_end: subAny.trial_end 
        ? new Date(subAny.trial_end * 1000).toISOString() 
        : null
    } : null

    // Format payment method info
    const paymentMethodInfo = paymentMethods.data[0] ? {
      id: paymentMethods.data[0].id,
      type: paymentMethods.data[0].type,
      card: paymentMethods.data[0].card
    } : null

    // Format invoice info
    const invoiceInfo = invoices.data.map(invoice => ({
      id: invoice.id,
      amount_paid: invoice.amount_paid,
      currency: invoice.currency,
      status: invoice.status,
      created: new Date(invoice.created * 1000).toISOString(),
      invoice_pdf: invoice.invoice_pdf,
      hosted_invoice_url: invoice.hosted_invoice_url
    }))

    // Also check database profile tier as a paid signal
    const { data: profileTierRow } = await supabase
      .from('profiles')
      .select('tier,pro_expires_at')
      .eq('user_id', user.id)
      .single()
    const tierVal = (profileTierRow as any)?.tier
    const tierLc = String(tierVal || '').toLowerCase()
    const isPaidByTier = isProActive({ tier: (profileTierRow as any)?.tier, pro_expires_at: (profileTierRow as any)?.pro_expires_at })
    const hasActiveSubscription = subscriptionInfo?.status === 'active' || subscriptionInfo?.status === 'trialing'
    const finalIsPaid = Boolean(isPaidByTier || hasActiveSubscription)
    // eslint-disable-next-line no-console
    console.log('[billing/info] user.id:', user.id)
    // eslint-disable-next-line no-console
    console.log('[billing/info] profile.tier (lc):', tierLc)
    // eslint-disable-next-line no-console
    console.log('[billing/info] subscription.status:', subscriptionInfo?.status)
    // eslint-disable-next-line no-console
    console.log('[billing/info] isPaidByTier:', isPaidByTier, 'final isPaid:', finalIsPaid)

    return NextResponse.json({
      subscription: subscriptionInfo,
      payment_method: paymentMethodInfo,
      invoices: invoiceInfo,
      usage: await getUserUsage(supabase, user.id),
      tier: (profileTierRow as any)?.tier ?? null,
      pro_expires_at: (profileTierRow as any)?.pro_expires_at ?? null,
      isPaid: finalIsPaid,
      ...(debug ? { _debug: { userId: user.id, email: user.email, tierLc, isPaidByTier, hasActiveSubscription, finalIsPaid } } : {})
    })

  } catch (error) {
    console.error('Billing info error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch billing information' },
      { status: 500 }
    )
  }
}

async function getUserUsage(supabase: any, userId: string) {
  // Get current usage counts
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  const [stackItems, protocols, uploads, movements, mindfulness] = await Promise.all([
    supabase.from('stack_items').select('id').eq('user_id', userId),
    supabase.from('protocols').select('id').eq('user_id', userId),
    supabase.from('uploads').select('id').eq('user_id', userId),
    supabase.from('stack_items').select('id').eq('user_id', userId).eq('item_type', 'movement'),
    supabase.from('stack_items').select('id').eq('user_id', userId).eq('item_type', 'mindfulness')
  ])

  // Determine limits from profile tier.
  // NOTE: some DBs do not have `user_usage.tier` (even though `user_usage` exists for Stripe ids),
  // so using profiles.tier avoids false "free" limits for friend/special Pro accounts.
  let isPro = false
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('tier,pro_expires_at')
      .eq('user_id', userId)
      .maybeSingle()
    isPro = isProActive({ tier: (profile as any)?.tier, pro_expires_at: (profile as any)?.pro_expires_at })
  } catch {}

  return {
    current_period_start: startOfMonth.toISOString(),
    current_period_end: endOfMonth.toISOString(),
    features: [
      {
        name: 'supplements',
        limit: isPro ? null : 12,
        used: (stackItems.data as any[] | undefined)?.filter((item: any) => item.item_type === 'supplements').length || 0,
        is_unlimited: isPro
      },
      {
        name: 'protocols',
        limit: isPro ? null : 12,
        used: protocols.data?.length || 0,
        is_unlimited: isPro
      },
      {
        name: 'uploads',
        limit: isPro ? null : 5,
        used: uploads.data?.length || 0,
        is_unlimited: isPro
      },
      {
        name: 'movement',
        limit: isPro ? null : 12,
        used: movements.data?.length || 0,
        is_unlimited: isPro
      },
      {
        name: 'mindfulness',
        limit: isPro ? null : 12,
        used: mindfulness.data?.length || 0,
        is_unlimited: isPro
      }
    ]
  }
}
