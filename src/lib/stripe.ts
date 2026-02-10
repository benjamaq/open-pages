import Stripe from 'stripe'

const STRIPE_KEY = process.env.STRIPE_SECRET_KEY
if (!STRIPE_KEY) {
  console.warn('[stripe] STRIPE_SECRET_KEY not set — Stripe features will be disabled at runtime')
}

export const stripe: any = STRIPE_KEY ? new Stripe(STRIPE_KEY) : null

// Debug environment variables
if (process.env.NEXT_PUBLIC_STRIPE_ENV_LOG === '1') {
  console.log('[stripe] env diagnostics:', {
    hasSecret: Boolean(STRIPE_KEY),
    PRO_MONTHLY: process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID,
    PRO_YEARLY: process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID,
    CREATOR_MONTHLY: process.env.NEXT_PUBLIC_STRIPE_CREATOR_MONTHLY_PRICE_ID,
    CREATOR_YEARLY: process.env.NEXT_PUBLIC_STRIPE_CREATOR_YEARLY_PRICE_ID,
    PREMIUM_MONTHLY: process.env.NEXT_PUBLIC_STRIPE_PREMIUM_MONTHLY_PRICE_ID,
    PREMIUM_YEARLY: process.env.NEXT_PUBLIC_STRIPE_PREMIUM_YEARLY_PRICE_ID,
  })
}

// Stripe product configuration
export const STRIPE_CONFIG = {
  products: {
    premium: {
      monthly: {
        // Prefer dedicated Premium price if present; otherwise fallback to Pro price
        priceId: process.env.NEXT_PUBLIC_STRIPE_PREMIUM_MONTHLY_PRICE_ID || process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID!,
        amount: 1900,
      },
      yearly: {
        priceId: process.env.NEXT_PUBLIC_STRIPE_PREMIUM_YEARLY_PRICE_ID || process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID!,
        amount: 14900,
      },
    },
    pro: {
      monthly: {
        priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID!,
        amount: 2900, // $29.00
      },
      yearly: {
        priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID!,
        amount: 9990, // $99.90 (save 2 months)
      },
    },
    creator: {
      monthly: {
        priceId: process.env.NEXT_PUBLIC_STRIPE_CREATOR_MONTHLY_PRICE_ID!,
        amount: 2995, // $29.95
      },
      yearly: {
        priceId: process.env.NEXT_PUBLIC_STRIPE_CREATOR_YEARLY_PRICE_ID!,
        amount: 19990, // $199.90 (save 2 months)
      },
    },
  },
  // Promo codes
  promoCodes: {
    redditGo: process.env.STRIPE_REDDIT_GO_PROMO_CODE_ID, // 6 months free Pro
  },
} as const

export type PlanType = 'pro' | 'premium' | 'creator'
export type BillingPeriod = 'monthly' | 'yearly'

// Helper function to get price ID
export function getPriceId(plan: PlanType, period: BillingPeriod): string {
  const priceId = STRIPE_CONFIG.products[plan][period].priceId
  console.log(`Getting price ID for ${plan} ${period}:`, priceId)
  if (!priceId) {
    throw new Error(`Price ID not found for ${plan} ${period}. Check environment variables.`)
  }
  return priceId
}

// Helper function to get amount
export function getAmount(plan: PlanType, period: BillingPeriod): number {
  return STRIPE_CONFIG.products[plan][period].amount
}
