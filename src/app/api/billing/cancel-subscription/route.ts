import { createClient } from '../../../../lib/supabase/server'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

// Initialize Stripe (with error handling for missing env vars)
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY as string, { apiVersion: '2024-06-20' } as any)
  : null

export async function POST() {
  try {
    if (!stripe) {
      return NextResponse.json({ error: 'Billing not configured' }, { status: 503 })
    }

    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's subscription
    const { data: subscription }: { data: { stripe_subscription_id: string | null } | null } = await supabase
      .from('user_usage')
      .select('stripe_subscription_id')
      .eq('user_id', user.id)
      .single()

    if (!subscription?.stripe_subscription_id) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 400 })
    }

    // Cancel subscription at period end in Stripe
    const updatedSubscription = await stripe.subscriptions.update(
      subscription.stripe_subscription_id,
      {
        cancel_at_period_end: true
      }
    )
    const cancelAtPeriodEnd = (updatedSubscription as any).cancel_at_period_end as boolean
    const currentPeriodEndSec = (updatedSubscription as any).current_period_end as number | undefined

    // Update database
    await (supabase as any)
      .from('user_usage')
      .update({
        cancel_at_period_end: true,
        updated_at: new Date().toISOString()
      } as any)
      .eq('user_id', user.id)

    return NextResponse.json({ 
      success: true,
      cancel_at_period_end: cancelAtPeriodEnd,
      current_period_end: currentPeriodEndSec ? new Date(currentPeriodEndSec * 1000).toISOString() : null
    })

  } catch (error) {
    console.error('Cancel subscription error:', error)
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    )
  }
}
