import { NextRequest, NextResponse } from 'next/server'
import { stripe, getPriceId } from '../../../lib/stripe'
import { createClient } from '../../../lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { 
      payment_method_id, 
      plan_type, 
      billing_period, 
      customer_email, 
      customer_name 
    } = await req.json()

    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'User must be authenticated' }, { status: 401 })
    }

    // Create or retrieve Stripe customer
    let customer
    try {
      const existingCustomers = await stripe.customers.list({
        email: customer_email,
        limit: 1
      })

      if (existingCustomers.data.length > 0) {
        customer = existingCustomers.data[0]
      } else {
        customer = await stripe.customers.create({
          email: customer_email,
          name: customer_name,
          metadata: {
            user_id: user.id,
          },
        })
      }
    } catch (error) {
      console.error('Error creating customer:', error)
      return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 })
    }

    // Attach payment method to customer
    try {
      await stripe.paymentMethods.attach(payment_method_id, {
        customer: customer.id,
      })

      // Set as default payment method
      await stripe.customers.update(customer.id, {
        invoice_settings: {
          default_payment_method: payment_method_id,
        },
      })
    } catch (error) {
      console.error('Error attaching payment method:', error)
      return NextResponse.json({ error: 'Failed to attach payment method' }, { status: 500 })
    }

    // Create subscription
    try {
      const priceId = getPriceId(plan_type, billing_period)
      
      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: priceId }],
        payment_settings: {
          payment_method_types: ['card'],
          save_default_payment_method: 'on_subscription',
        },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          user_id: user.id,
          plan: plan_type,
          period: billing_period,
        },
      })

      // Update user_usage with Stripe info
      const { error: updateError } = await supabase
        .from('user_usage')
        .update({
          stripe_customer_id: customer.id,
          stripe_subscription_id: subscription.id,
          tier: plan_type,
          subscription_status: subscription.status,
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)

      if (updateError) {
        console.error('Error updating user_usage:', updateError)
      }

      // Update profile tier
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          tier: plan_type,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)

      if (profileError) {
        console.error('Error updating profile:', profileError)
      }

      return NextResponse.json({ 
        subscription_id: subscription.id,
        status: subscription.status 
      })
    } catch (error) {
      console.error('Error creating subscription:', error)
      return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 })
    }
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
