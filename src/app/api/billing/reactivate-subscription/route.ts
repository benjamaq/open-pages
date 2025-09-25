import { createClient } from '../../../../lib/supabase/server'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

// Initialize Stripe (with error handling for missing env vars)
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20'
}) : null

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
    const { data: subscription } = await supabase
      .from('user_usage')
      .select('stripe_subscription_id')
      .eq('user_id', user.id)
      .single()

    if (!subscription?.stripe_subscription_id) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 400 })
    }

    // Reactivate subscription in Stripe
    const updatedSubscription = await stripe.subscriptions.update(
      subscription.stripe_subscription_id,
      {
        cancel_at_period_end: false
      }
    )

    // Update database
    await supabase
      .from('user_usage')
      .update({
        cancel_at_period_end: false,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)

    return NextResponse.json({ 
      success: true,
      cancel_at_period_end: updatedSubscription.cancel_at_period_end
    })

  } catch (error) {
    console.error('Reactivate subscription error:', error)
    return NextResponse.json(
      { error: 'Failed to reactivate subscription' },
      { status: 500 }
    )
  }
}
