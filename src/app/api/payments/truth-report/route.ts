import { NextResponse } from 'next/server'
import Stripe from 'stripe'

export async function POST() {
  const secret = process.env.STRIPE_SECRET_KEY
  const successUrl = process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/unlocked?report=1` : 'http://localhost:3010/unlocked?report=1'
  const cancelUrl = process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/pricing` : 'http://localhost:3010/pricing'
  if (!secret) {
    // Fallback: pretend and redirect to success flow for demo
    return NextResponse.json({ checkout_url: successUrl })
  }
  const stripe = new Stripe(secret, { apiVersion: '2024-11-20.acacia' as any })
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    success_url: successUrl,
    cancel_url: cancelUrl,
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: { name: 'BioStackr Truth Report' },
        unit_amount: 2900,
      },
      quantity: 1
    }]
  })
  return NextResponse.json({ checkout_url: session.url })
}



