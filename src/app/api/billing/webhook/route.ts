import { createClient } from '../../../../lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

// Initialize Stripe (with error handling for missing env vars)
if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('STRIPE_SECRET_KEY not found - billing features will be disabled')
}

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20'
}) : null

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

export async function POST(request: NextRequest) {
  try {
    // Check if Stripe is configured
    if (!stripe || !webhookSecret) {
      return NextResponse.json({ error: 'Billing not configured' }, { status: 503 })
    }

    const body = await request.text()
    const signature = request.headers.get('stripe-signature')!

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const supabase = await createClient()

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session, supabase)
        break

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionChange(event.data.object as Stripe.Subscription, supabase)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription, supabase)
        break

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice, supabase)
        break

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice, supabase)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session, supabase: ReturnType<typeof createClient>) {
  const userId = session.metadata?.user_id
  if (!userId) return

  if (session.mode === 'subscription' && session.subscription) {
    // Get subscription details
    const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
    
    await supabase
      .from('user_subscriptions')
      .upsert({
        user_id: userId,
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: subscription.id,
        plan_type: 'pro',
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
        updated_at: new Date().toISOString()
      })
  }
}

async function handleSubscriptionChange(subscription: Stripe.Subscription, supabase: ReturnType<typeof createClient>) {
  const customer = await stripe.customers.retrieve(subscription.customer as string)
  
  if (customer.deleted || !customer.metadata?.user_id) {
    console.error('Customer not found or missing user_id')
    return
  }

  const userId = customer.metadata.user_id

  await supabase
    .from('user_subscriptions')
    .upsert({
      user_id: userId,
      stripe_customer_id: subscription.customer as string,
      stripe_subscription_id: subscription.id,
      plan_type: subscription.status === 'active' ? 'pro' : 'free',
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      updated_at: new Date().toISOString()
    })
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription, supabase: ReturnType<typeof createClient>) {
  const customer = await stripe.customers.retrieve(subscription.customer as string)
  
  if (customer.deleted || !customer.metadata?.user_id) {
    console.error('Customer not found or missing user_id')
    return
  }

  const userId = customer.metadata.user_id

  await supabase
    .from('user_subscriptions')
    .update({
      plan_type: 'free',
      status: 'canceled',
      stripe_subscription_id: null,
      cancel_at_period_end: false,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId)
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice, supabase: ReturnType<typeof createClient>) {
  // Log successful payment, update subscription status if needed
  console.log(`Payment succeeded for invoice: ${invoice.id}`)
}

async function handlePaymentFailed(invoice: Stripe.Invoice, supabase: ReturnType<typeof createClient>) {
  const customer = await stripe.customers.retrieve(invoice.customer as string)
  
  if (customer.deleted || !customer.metadata?.user_id) {
    console.error('Customer not found or missing user_id')
    return
  }

  const userId = customer.metadata.user_id

  // Update subscription status to past_due
  await supabase
    .from('user_subscriptions')
    .update({
      status: 'past_due',
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId)

  console.log(`Payment failed for user: ${userId}, invoice: ${invoice.id}`)
}
