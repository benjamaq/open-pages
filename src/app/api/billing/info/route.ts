import { createClient } from '../../../../lib/supabase/server'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

// Initialize Stripe (with error handling for missing env vars)
if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('STRIPE_SECRET_KEY not found - billing features will be disabled')
}

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20'
}) : null

export async function GET() {
  try {
    // Check if Stripe is configured
    if (!stripe) {
      return NextResponse.json({
        subscription: null,
        payment_method: null,
        invoices: [],
        usage: {
          current_period_start: new Date().toISOString(),
          current_period_end: new Date().toISOString(),
          features: []
        }
      })
    }

    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's subscription from database
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // If no subscription in DB, return free plan info
    if (!subscription || !subscription.stripe_customer_id) {
      return NextResponse.json({
        subscription: null,
        payment_method: null,
        invoices: [],
        usage: await getUserUsage(supabase, user.id)
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
    const subscriptionInfo = stripeSubscription ? {
      id: stripeSubscription.id,
      status: stripeSubscription.status,
      plan_name: stripeSubscription.items.data[0]?.price.nickname || 'Pro',
      plan_amount: stripeSubscription.items.data[0]?.price.unit_amount || 0,
      currency: stripeSubscription.items.data[0]?.price.currency || 'usd',
      current_period_start: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: stripeSubscription.cancel_at_period_end,
      trial_end: stripeSubscription.trial_end 
        ? new Date(stripeSubscription.trial_end * 1000).toISOString() 
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

    return NextResponse.json({
      subscription: subscriptionInfo,
      payment_method: paymentMethodInfo,
      invoices: invoiceInfo,
      usage: await getUserUsage(supabase, user.id)
    })

  } catch (error) {
    console.error('Billing info error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch billing information' },
      { status: 500 }
    )
  }
}

async function getUserUsage(supabase: ReturnType<typeof createClient>, userId: string) {
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

  // Get user's subscription to determine limits
  const { data: userSub } = await supabase
    .from('user_subscriptions')
    .select('plan_type')
    .eq('user_id', userId)
    .single()

  const isPro = userSub?.plan_type === 'pro'

  return {
    current_period_start: startOfMonth.toISOString(),
    current_period_end: endOfMonth.toISOString(),
    features: [
      {
        name: 'supplements',
        limit: isPro ? null : 10,
        used: stackItems.data?.filter(item => item.item_type === 'supplements').length || 0,
        is_unlimited: isPro
      },
      {
        name: 'protocols',
        limit: isPro ? null : 3,
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
        limit: isPro ? null : 5,
        used: movements.data?.length || 0,
        is_unlimited: isPro
      },
      {
        name: 'mindfulness',
        limit: isPro ? null : 5,
        used: mindfulness.data?.length || 0,
        is_unlimited: isPro
      }
    ]
  }
}
