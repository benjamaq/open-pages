# BioStackr Launch Checklist 🚀

## Pre-Launch Setup

### ✅ Completed
- [x] Landing page redesigned with premium/professional standards
- [x] Three-tier pricing system (Free, Pro $9.99, Creator $29.95)
- [x] 14-day Pro trial system implemented
- [x] Complete dashboard with all modules
- [x] Public profile system with privacy controls
- [x] Creator tier features (affiliate links, branding)
- [x] Trial system with graceful degradation
- [x] Authentication and database schema
- [x] Stripe integration code complete
- [x] Upgrade pages created (/upgrade/pro, /upgrade/creator)
- [x] Promo code system ("redditgo" for 6 months free)
- [x] Webhook handling for subscription management

### 🔄 Next Steps (Required for Launch)

#### 1. Stripe Configuration
- [ ] Create Stripe account and complete verification
- [ ] Set up products and pricing in Stripe Dashboard
- [ ] Configure webhook endpoint
- [ ] Add all environment variables from `STRIPE_SETUP_GUIDE.md`
- [ ] Test payment flow with test cards

#### 2. Database Updates
- [ ] Run `database/stripe-integration.sql` in Supabase
- [ ] Verify new columns added correctly
- [ ] Test trial system functions work

#### 3. Environment Configuration
- [ ] Copy `env.example` to `.env.local`
- [ ] Fill in all required environment variables
- [ ] Test app starts without errors

#### 4. Final Testing
- [ ] **Authentication Flow**
  - [ ] Sign up new user
  - [ ] Sign in existing user
  - [ ] Password reset
  - [ ] Email verification

- [ ] **Dashboard Modules**
  - [ ] Supplements - add/edit/delete items
  - [ ] Protocols - create and manage protocols
  - [ ] Movement - add movement routines
  - [ ] Mindfulness - add practices
  - [ ] Library - upload and manage files
  - [ ] Gear - add gear items
  - [ ] Today - daily check-in system

- [ ] **Trial System**
  - [ ] New users get 14-day Pro trial
  - [ ] Trial expiration works correctly
  - [ ] Limits enforced after trial ends
  - [ ] Existing data preserved

- [ ] **Pricing & Upgrades**
  - [ ] Pricing page displays correctly
  - [ ] Pro upgrade flow works
  - [ ] Creator upgrade flow works
  - [ ] Promo codes work ("redditgo")
  - [ ] Success page displays after payment
  - [ ] User tier updates in database

- [ ] **Public Profiles**
  - [ ] Public profile displays correctly
  - [ ] Privacy settings work
  - [ ] Follow functionality works
  - [ ] Creator features show for Creator tier

#### 5. Performance & Security
- [ ] Run `npm run build` successfully
- [ ] Test production build locally
- [ ] Check for console errors
- [ ] Verify all images load
- [ ] Test mobile responsiveness
- [ ] Check loading performance

#### 6. Deployment Preparation
- [ ] Set up production domain
- [ ] Configure production environment variables
- [ ] Set up production Stripe webhook
- [ ] Test production deployment
- [ ] Set up monitoring/analytics

## Launch Day Checklist

### Pre-Launch (Final Hour)
- [ ] Final production deployment
- [ ] Smoke test all critical paths
- [ ] Verify Stripe webhooks working
- [ ] Test sign-up flow end-to-end
- [ ] Check email deliverability
- [ ] Monitor error logs

### Launch
- [ ] Deploy to production
- [ ] Update DNS if needed
- [ ] Test from multiple devices/browsers
- [ ] Monitor for errors
- [ ] Have rollback plan ready

### Post-Launch (First 24 Hours)
- [ ] Monitor sign-up conversions
- [ ] Check payment processing
- [ ] Monitor error rates
- [ ] Respond to user feedback
- [ ] Track trial-to-paid conversion

## Testing Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Check for TypeScript errors
npx tsc --noEmit

# Run linting
npm run lint
```

## Key URLs to Test

- `/` - Landing page
- `/pricing` - Pricing page
- `/auth/signup` - Sign up
- `/auth/signin` - Sign in
- `/dash` - Dashboard
- `/upgrade/pro` - Pro upgrade
- `/upgrade/creator` - Creator upgrade
- `/u/[slug]` - Public profile

## Environment Variables Checklist

```env
# Required for basic functionality
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Required for Stripe
STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID=
NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID=
NEXT_PUBLIC_STRIPE_CREATOR_MONTHLY_PRICE_ID=
NEXT_PUBLIC_STRIPE_CREATOR_YEARLY_PRICE_ID=

# Optional
RESEND_API_KEY=
STRIPE_REDDIT_GO_PROMO_CODE_ID=
```

## Support Resources

- `STRIPE_SETUP_GUIDE.md` - Complete Stripe setup instructions
- `database/stripe-integration.sql` - Database schema updates
- Supabase dashboard for database management
- Stripe dashboard for payment management

## Success Metrics to Monitor

- Sign-up conversion rate
- Trial-to-paid conversion rate
- Payment success rate
- User engagement (daily active users)
- Feature usage across dashboard modules

---

**Status: Ready for Stripe setup and final testing** ✨

The core application is complete and ready for launch. The main remaining task is configuring Stripe and doing final testing before going live.
