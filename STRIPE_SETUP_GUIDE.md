# Stripe Integration Setup Guide

This guide will help you set up Stripe for BioStackr's payment processing.

## 1. Create Stripe Account

1. Go to [stripe.com](https://stripe.com) and create an account
2. Complete your account verification
3. Switch to Test mode for development

## 2. Get API Keys

1. In your Stripe Dashboard, go to **Developers > API keys**
2. Copy your **Publishable key** and **Secret key**
3. Add them to your `.env.local` file:

```env
STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
STRIPE_SECRET_KEY=sk_test_your_key_here
```

## 3. Create Products and Prices

### Create Products

1. Go to **Products** in your Stripe Dashboard
2. Create two products:
   - **BioStackr Pro** - Description: "Unlimited health optimization tools"
   - **BioStackr Creator** - Description: "Pro features plus monetization and branding"

### Create Prices

For each product, create monthly and yearly prices:

**BioStackr Pro:**
- Monthly: $9.99 USD, recurring monthly
- Yearly: $99.90 USD, recurring yearly (save $19.98)

**BioStackr Creator:**
- Monthly: $29.95 USD, recurring monthly  
- Yearly: $199.90 USD, recurring yearly (save $159.50)

### Add Price IDs to Environment

After creating prices, copy their IDs and add to `.env.local`:

```env
NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID=price_1234567890
NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID=price_0987654321
NEXT_PUBLIC_STRIPE_CREATOR_MONTHLY_PRICE_ID=price_1122334455
NEXT_PUBLIC_STRIPE_CREATOR_YEARLY_PRICE_ID=price_5544332211
```

## 4. Set up Webhooks

1. Go to **Developers > Webhooks** in Stripe Dashboard
2. Click **Add endpoint**
3. Set endpoint URL to: `https://yourdomain.com/api/webhooks/stripe`
4. Select these events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the **Signing secret** and add to `.env.local`:

```env
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

## 5. Create Promo Codes (Optional)

### Reddit Go Promo Code

1. Go to **Products > Coupons** in Stripe Dashboard
2. Create a new coupon:
   - **ID:** `reddit-go-6months`
   - **Type:** Percent discount
   - **Percent off:** 100%
   - **Duration:** Repeating
   - **Duration in months:** 6
   - **Applies to:** Specific products (select BioStackr Pro)

3. Go to **Products > Promotion codes**
4. Create promotion code:
   - **Coupon:** Select the coupon you just created
   - **Code:** `REDDITGO`
   - **Active:** Yes

5. Add to `.env.local`:
```env
STRIPE_REDDIT_GO_PROMO_CODE_ID=promo_your_promo_code_id
```

## 6. Database Setup

Run the Stripe integration SQL script in your Supabase SQL Editor:

```sql
-- Run the contents of database/stripe-integration.sql
```

## 7. Test the Integration

### Test Cards

Use these test card numbers in development:

- **Success:** 4242 4242 4242 4242
- **Declined:** 4000 0000 0000 0002
- **Requires authentication:** 4000 0025 0000 3155

### Test Flow

1. Start your development server: `npm run dev`
2. Go to `/pricing` and click upgrade buttons
3. Complete checkout with test card
4. Verify webhook receives events
5. Check that user tier is updated in database

## 8. Go Live Checklist

Before going to production:

- [ ] Switch Stripe account to Live mode
- [ ] Update API keys in production environment
- [ ] Update webhook URL to production domain
- [ ] Test with real payment method
- [ ] Set up monitoring for failed payments
- [ ] Configure customer portal for subscription management

## Environment Variables Summary

Your final `.env.local` should include:

```env
# Stripe Configuration
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Price IDs
NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_CREATOR_MONTHLY_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_CREATOR_YEARLY_PRICE_ID=price_...

# Promo Codes (optional)
STRIPE_REDDIT_GO_PROMO_CODE_ID=promo_...
```

## Troubleshooting

### Common Issues

1. **Webhook not receiving events**
   - Check webhook URL is correct and accessible
   - Verify webhook secret matches
   - Check webhook is active in Stripe Dashboard

2. **Price ID not found**
   - Verify price IDs are correct in environment variables
   - Ensure prices are active in Stripe Dashboard

3. **User tier not updating**
   - Check webhook handler is processing events correctly
   - Verify database schema includes new Stripe columns
   - Check Supabase logs for errors

### Support

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
- [Webhook Testing](https://stripe.com/docs/webhooks/test)
