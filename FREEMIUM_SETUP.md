# Biostackr Freemium + Pro Setup Guide

## 🎯 Overview

This implementation adds a complete freemium pricing model to Biostackr with:

- **Free Tier**: Light quantity limits (10 supplements, 3 protocols, 2 movement, 2 mindfulness)
- **Pro Tier**: $9.99/month with unlimited everything + advanced features
- **Upgrade Modals**: Friendly prompts when limits are reached
- **Journal + Reminders**: Always free for all users

## 📊 Features Implemented

### ✅ Database Schema
- `user_subscriptions` - Track user plan types and billing
- `plan_limits` - Configurable limits per plan
- `user_usage` - Real-time usage tracking
- `pricing_config` - A/B testable pricing ($9.99 → $19 later)

### ✅ Freemium Limits (Scenario B)
- **Supplements**: 10 free, unlimited Pro
- **Protocols**: 3 free, unlimited Pro  
- **Movement**: 2 free, unlimited Pro
- **Mindfulness**: 2 free, unlimited Pro
- **Files**: 5 free (10MB), 100 Pro (1GB)
- **Followers**: 0 free, unlimited Pro

### ✅ Upgrade Experience
- Friendly upgrade modals when limits hit
- Clear Pro feature benefits
- $9.99/month pricing (configurable)
- Direct link to pricing page

### ✅ Pro Features (Upgrade Levers)
- **Unlimited items** in all categories
- **Advanced file storage** (1GB vs 10MB)
- **Unlimited followers** + weekly digest emails
- **Analytics dashboard** (placeholder for trends/insights)
- **Priority support** + advanced privacy controls

### ✅ UI Updates
- **"Today's Update"** button (green outline, distinct from nav)
- **Positioned right** of followers count
- **Modal integration** with existing ShareTodayModal

## 🚀 Setup Instructions

### 1. Database Migration
```sql
-- Run in Supabase SQL Editor
\i database/freemium-schema.sql
```

### 2. Environment Variables
```env
# Add to your .env.local
STRIPE_PUBLISHABLE_KEY=pk_test_...  # For future Stripe integration
STRIPE_SECRET_KEY=sk_test_...       # For future Stripe integration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Test the Implementation

#### Free User Experience:
1. Try adding 11th supplement → Upgrade modal appears
2. Try adding 4th protocol → Upgrade modal appears  
3. Try adding 3rd movement → Upgrade modal appears
4. Journal entries work unlimited ✅

#### Pro User Experience:
1. Upgrade to Pro via pricing page
2. All limits removed
3. Advanced features unlocked

### 4. Pricing Configuration

Update pricing in database:
```sql
-- A/B test pricing
UPDATE pricing_config 
SET price_monthly_cents = 1999  -- $19.99
WHERE plan_type = 'pro';
```

## 🎨 UI Components

### New Components:
- `UpgradeModal.tsx` - Friendly limit reached modal
- `pricing/page.tsx` - Complete pricing page
- Updated `AddStackItemForm.tsx` - Limit checking
- Updated `FollowButton.tsx` - Follower limits

### Updated Components:
- **Dashboard**: "Today's Update" button styling
- **ShareTodayModal**: Already comprehensive (energy slider, mood, wearables, counts, social sharing)

## 🔧 Key Functions

### Server Actions:
- `getUserSubscription()` - Get user's current plan
- `getUserUsage()` - Get usage across all features  
- `checkCanAddItem()` - Check if user can add more items
- `upgradeToProPlan()` - Upgrade user (Stripe integration ready)

### Database Functions:
- `get_user_limit()` - Get limit for user/feature
- `get_user_usage_count()` - Get current usage count
- `check_user_limit()` - Boolean limit check

## 💳 Payment Integration (Future)

The system is ready for Stripe integration:

```typescript
// In UpgradeModal.tsx
const handleUpgrade = async () => {
  // Current: Redirects to pricing page
  // Future: Direct Stripe checkout
  const stripe = await getStripe()
  const { error } = await stripe.redirectToCheckout({
    lineItems: [{ price: 'price_pro_monthly', quantity: 1 }],
    mode: 'subscription',
    successUrl: `${window.location.origin}/dash?upgraded=true`,
    cancelUrl: window.location.href,
  })
}
```

## 📈 Analytics Ready

Pro tier includes analytics placeholder:
- Usage trends over time
- Adherence rates by category  
- Supplement effectiveness tracking
- Custom reporting

## 🎯 Conversion Strategy

### Upgrade Triggers:
1. **Quantity limits** - Most common trigger
2. **Follower requests** - Social proof pressure  
3. **File storage** - Power user needs
4. **Analytics access** - Data-driven users

### Messaging:
- "You've reached your free limit" (not "upgrade now!")
- Show current usage vs limit
- Clear Pro benefits
- $9.99/month positioning

## ✅ Testing Checklist

- [ ] Free user hits supplement limit → Modal appears
- [ ] Free user hits protocol limit → Modal appears  
- [ ] Free user hits movement limit → Modal appears
- [ ] Free user hits mindfulness limit → Modal appears
- [ ] Free user can't receive followers → Owner sees modal
- [ ] Pro user has unlimited everything
- [ ] Pricing page loads correctly
- [ ] "Today's Update" button works
- [ ] ShareTodayModal comprehensive features work

## 🔄 Next Steps

1. **Stripe Integration** - Real payment processing
2. **Analytics Dashboard** - Pro-tier insights
3. **Email Sequences** - Upgrade nurturing
4. **Usage Notifications** - "You're at 8/10 supplements"
5. **Plan Comparison** - In-app feature comparison

The freemium model is now **fully implemented and ready for user testing!** 🚀
