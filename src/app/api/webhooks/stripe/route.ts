import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '../../../../lib/stripe'
import { createClient } from '../../../../lib/supabase/server'
import Stripe from 'stripe'

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: NextRequest) {
  // eslint-disable-next-line no-console
  console.log('[stripe-webhook] Received event')
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
    // Basic diagnostics
    // eslint-disable-next-line no-console
    console.log('[stripe-webhook] Event type:', event.type)
    try {
      // eslint-disable-next-line no-console
      console.log('[stripe-webhook] Customer:', (event.data as any)?.object?.customer || (event.data?.object as any)?.customer || null)
    } catch {}

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const result = await handleCheckoutCompleted(session, supabase)
        // eslint-disable-next-line no-console
        console.log('[stripe-webhook] DB update result:', result)
        // Fire Meta CAPI Purchase (server-to-server) if desired
        try {
          const metaToken = process.env.META_ACCESS_TOKEN
          const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID || '704287959370274'
          if (metaToken && pixelId) {
            const payload = {
              data: [{
                event_name: 'Purchase',
                event_time: Math.floor(Date.now()/1000),
                event_source_url: process.env.NEXT_PUBLIC_APP_URL + '/dash',
                action_source: 'website',
                custom_data: {
                  value: 0,
                  currency: 'EUR',
                  first_touch: (session.metadata as any)?.first_touch || '',
                  last_touch: (session.metadata as any)?.last_touch || ''
                }
              }]
            }
            await fetch(`https://graph.facebook.com/v16.0/${pixelId}/events?access_token=${metaToken}`, {
              method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
            })
          }
        } catch (e) { console.warn('Meta CAPI send failed', e) }
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const result = await handleSubscriptionChange(subscription, supabase)
        // eslint-disable-next-line no-console
        console.log('[stripe-webhook] DB update result:', result)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const result = await handleSubscriptionDeleted(subscription, supabase)
        // eslint-disable-next-line no-console
        console.log('[stripe-webhook] DB update result:', result)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        const result = await handlePaymentSucceeded(invoice, supabase)
        // eslint-disable-next-line no-console
        console.log('[stripe-webhook] DB update result:', result)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const result = await handlePaymentFailed(invoice, supabase)
        // eslint-disable-next-line no-console
        console.log('[stripe-webhook] DB update result:', result)
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
): Promise<{ ok: boolean; message?: string }> {
  const userId = session.metadata?.user_id
  const plan = session.metadata?.plan as 'pro' | 'premium' | 'creator'
  const customerId = session.customer as string

  if (!userId || !plan) {
    console.error('Missing metadata in checkout session:', session.metadata)
    return { ok: false, message: 'missing_metadata' }
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
    return { ok: false, message: 'user_usage_update_error' }
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
    return { ok: false, message: 'profile_update_error' }
  }

  console.log(`User ${userId} upgraded to ${plan}`)
  return { ok: true }
}

async function handleSubscriptionChange(
  subscription: Stripe.Subscription,
  supabase: ReturnType<typeof createClient>
): Promise<{ ok: boolean; message?: string }> {
  const userId = subscription.metadata?.user_id
  const plan = subscription.metadata?.plan as 'pro' | 'premium' | 'creator'

  if (!userId) {
    console.error('Missing user_id in subscription metadata')
    return { ok: false, message: 'missing_user_id' }
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
    return { ok: false, message: 'user_usage_update_error' }
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
    return { ok: false, message: 'profile_update_error' }
  }

  console.log(`Subscription ${subscription.id} updated for user ${userId}`)
  return { ok: true }
}

async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
  supabase: ReturnType<typeof createClient>
): Promise<{ ok: boolean; message?: string }> {
  const userId = subscription.metadata?.user_id

  if (!userId) {
    console.error('Missing user_id in subscription metadata')
    return { ok: false, message: 'missing_user_id' }
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
    return { ok: false, message: 'user_usage_update_error' }
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
    return { ok: false, message: 'profile_update_error' }
  }

  console.log(`User ${userId} downgraded to free tier`)
  return { ok: true }
}

async function handlePaymentSucceeded(
  invoice: Stripe.Invoice,
  _supabase: ReturnType<typeof createClient>
): Promise<{ ok: boolean }> {
  // Handle successful payment - could send confirmation email, etc.
  console.log(`Payment succeeded for invoice ${invoice.id}`)
  return { ok: true }
}

async function handlePaymentFailed(
  invoice: Stripe.Invoice,
  _supabase: ReturnType<typeof createClient>
): Promise<{ ok: boolean }> {
  // Handle failed payment - could send notification email, etc.
  console.log(`Payment failed for invoice ${invoice.id}`)
  return { ok: true }
}
