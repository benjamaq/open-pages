import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '../../../lib/stripe'

export async function GET(request: NextRequest) {
  try {
    // Test if Stripe is properly configured
    const stripeConfig = {
      hasSecretKey: !!process.env.STRIPE_SECRET_KEY,
      hasPublishableKey: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      secretKeyPrefix: process.env.STRIPE_SECRET_KEY?.substring(0, 7),
      publishableKeyPrefix: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.substring(0, 7),
    }

    // Try to create a simple Stripe object to test connection
    let stripeTest = null
    try {
      stripeTest = await stripe.prices.list({ limit: 1 })
    } catch (stripeError) {
      return NextResponse.json({ 
        config: stripeConfig,
        stripeError: stripeError instanceof Error ? stripeError.message : 'Unknown Stripe error'
      })
    }

    return NextResponse.json({ 
      config: stripeConfig,
      stripeTest: 'Success - Stripe connection works',
      priceCount: stripeTest.data.length
    })

  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      config: {
        hasSecretKey: !!process.env.STRIPE_SECRET_KEY,
        hasPublishableKey: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      }
    }, { status: 500 })
  }
}
