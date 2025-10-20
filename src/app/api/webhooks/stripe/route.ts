import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '../../../../lib/stripe'
import { createClient } from '../../../../lib/supabase/server'
import Stripe from 'stripe'

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = await createClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutCompleted(session, supabase)
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionChange(subscription, supabase)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(subscription, supabase)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentSucceeded(invoice, supabase)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentFailed(invoice, supabase)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}

async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
  supabase: ReturnType<typeof createClient>
) {
  const userId = session.metadata?.user_id
  const plan = session.metadata?.plan as 'pro' | 'premium' | 'creator'
  const customerId = session.customer as string

  if (!userId || !plan) {
    console.error('Missing metadata in checkout session:', session.metadata)
    return
  }

  // Update user_usage with Stripe customer ID and subscription info
  const { error: updateError } = await supabase
    .from('user_usage')
    .update({
      stripe_customer_id: customerId,
      tier: plan,
      // End trial since they're now paying
      is_in_trial: false,
      trial_ended_at: new Date().toISOString(),
      trial_used: true,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)

  if (updateError) {
    console.error('Error updating user_usage:', updateError)
    return
  }

  // Update profile with tier info
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      tier: plan,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)

  if (profileError) {
    console.error('Error updating profile:', profileError)
  }

  console.log(`User ${userId} upgraded to ${plan}`)
}

async function handleSubscriptionChange(
  subscription: Stripe.Subscription,
  supabase: ReturnType<typeof createClient>
) {
  const userId = subscription.metadata?.user_id
  const plan = subscription.metadata?.plan as 'pro' | 'premium' | 'creator'

  if (!userId) {
    console.error('Missing user_id in subscription metadata')
    return
  }

  const isActive = subscription.status === 'active'
  const currentPeriodEnd = new Date(subscription.current_period_end * 1000)

  // Update user_usage
  const { error: updateError } = await supabase
    .from('user_usage')
    .update({
      tier: isActive ? plan : 'free',
      stripe_subscription_id: subscription.id,
      subscription_status: subscription.status,
      current_period_end: currentPeriodEnd.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)

  if (updateError) {
    console.error('Error updating user_usage:', updateError)
    return
  }

  // Update profile
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      tier: isActive ? plan : 'free',
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)

  if (profileError) {
    console.error('Error updating profile:', profileError)
  }

  console.log(`Subscription ${subscription.id} updated for user ${userId}`)
}

async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
  supabase: ReturnType<typeof createClient>
) {
  const userId = subscription.metadata?.user_id

  if (!userId) {
    console.error('Missing user_id in subscription metadata')
    return
  }

  // Downgrade user to free tier
  const { error: updateError } = await supabase
    .from('user_usage')
    .update({
      tier: 'free',
      subscription_status: 'canceled',
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)

  if (updateError) {
    console.error('Error updating user_usage:', updateError)
    return
  }

  // Update profile
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      tier: 'free',
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)

  if (profileError) {
    console.error('Error updating profile:', profileError)
  }

  console.log(`User ${userId} downgraded to free tier`)
}

async function handlePaymentSucceeded(
  invoice: Stripe.Invoice,
  _supabase: ReturnType<typeof createClient>
) {
  // Handle successful payment - could send confirmation email, etc.
  console.log(`Payment succeeded for invoice ${invoice.id}`)
}

async function handlePaymentFailed(
  invoice: Stripe.Invoice,
  _supabase: ReturnType<typeof createClient>
) {
  // Handle failed payment - could send notification email, etc.
  console.log(`Payment failed for invoice ${invoice.id}`)
}
