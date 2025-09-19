import { createClient } from '../../../../lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

// Initialize Stripe (with error handling for missing env vars)
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20'
}) : null

export async function POST(request: NextRequest) {
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

    const { success_url, cancel_url } = await request.json()

    // Get user's Stripe customer ID
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    if (!subscription?.stripe_customer_id) {
      return NextResponse.json({ error: 'No customer found' }, { status: 400 })
    }

    // Create Stripe setup session for updating payment method
    const session = await stripe.checkout.sessions.create({
      customer: subscription.stripe_customer_id,
      payment_method_types: ['card'],
      mode: 'setup',
      success_url: success_url || `${process.env.NEXT_PUBLIC_APP_URL}/dash/billing?payment_updated=true`,
      cancel_url: cancel_url || `${process.env.NEXT_PUBLIC_APP_URL}/dash/billing`,
    })

    return NextResponse.json({ url: session.url })

  } catch (error) {
    console.error('Create setup session error:', error)
    return NextResponse.json(
      { error: 'Failed to create setup session' },
      { status: 500 }
    )
  }
}
