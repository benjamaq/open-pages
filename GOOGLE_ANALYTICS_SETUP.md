# Google Analytics Setup Guide

## 🎯 **Quick Setup (5 minutes)**

### 1. Create Google Analytics Account
1. Go to [Google Analytics](https://analytics.google.com/)
2. Click "Start measuring" or "Create Account"
3. Enter your account name (e.g., "BioStackr")
4. Choose your data sharing settings

### 2. Create Property
1. Enter property name: "BioStackr"
2. Select reporting time zone
3. Choose currency
4. Select "Web" as platform

### 3. Get Measurement ID
1. In your property, go to **Data Streams**
2. Click **Add stream** → **Web**
3. Enter website URL: `https://biostackr.io`
4. Enter stream name: "BioStackr Website"
5. Click **Create stream**
6. Copy the **Measurement ID** (starts with `G-`)

### 4. Add to Environment Variables
1. Open `.env.local` file
2. Replace `G-XXXXXXXXXX` with your actual Measurement ID:
   ```bash
   NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
   ```
3. Save the file

### 5. Deploy to Production
1. Add the same environment variable to your Vercel dashboard:
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add `NEXT_PUBLIC_GA_MEASUREMENT_ID` with your Measurement ID
   - Redeploy your site

## ✅ **Verification**

### Test Locally
1. Start your development server: `npm run dev`
2. Open browser console
3. Look for: `Google Analytics measurement ID not found` (should be gone)
4. Check Network tab for GA requests

### Test Production
1. Visit your live site
2. Open browser console
3. Look for GA requests in Network tab
4. Check Google Analytics dashboard for real-time data

## 📊 **What's Tracked**

The app automatically tracks:
- **Page views** (all pages)
- **User interactions** (button clicks, form submissions)
- **Custom events** (mood tracking, stack additions)
- **User flows** (signup → dashboard → public profile)

## 🔧 **Advanced Configuration**

### Custom Events (Optional)
You can add custom event tracking by importing the GA component:

```typescript
import { GoogleAnalytics } from '@next/third-parties/google'

// Track custom events
const trackEvent = (eventName: string, parameters?: any) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, parameters)
  }
}

// Example usage
trackEvent('mood_entry_created', {
  mood_score: 8,
  sleep_quality: 7,
  pain_level: 2
})
```

### Enhanced Ecommerce (Optional)
For tracking subscription conversions:

```typescript
// Track subscription purchase
trackEvent('purchase', {
  transaction_id: 'sub_123',
  value: 29.99,
  currency: 'USD',
  items: [{
    item_id: 'pro_monthly',
    item_name: 'Pro Monthly',
    category: 'subscription',
    quantity: 1,
    price: 29.99
  }]
})
```

## 🚨 **Troubleshooting**

### Common Issues

1. **"Measurement ID not found" warning**
   - Check `.env.local` has correct `NEXT_PUBLIC_GA_MEASUREMENT_ID`
   - Restart development server
   - Verify no typos in variable name

2. **No data in GA dashboard**
   - Wait 24-48 hours for data to appear
   - Check if ad blockers are blocking GA
   - Verify Measurement ID is correct
   - Check Vercel environment variables

3. **GA not loading on production**
   - Verify environment variable is set in Vercel
   - Check Vercel deployment logs
   - Ensure variable name matches exactly

### Debug Mode
Enable debug mode in GA:
1. Go to GA → Admin → Data Streams
2. Click your web stream
3. Enable "Enhanced measurement"
4. Add debug parameter: `?debug_mode=true` to your URL

## 📈 **Next Steps**

1. **Set up Goals** in GA for key actions (signups, subscriptions)
2. **Create Audiences** for user segmentation
3. **Set up Conversion Tracking** for subscription purchases
4. **Configure Custom Dimensions** for user tiers (free/pro/creator)

## 🔒 **Privacy & Compliance**

- GA4 is GDPR compliant by default
- No personal data is collected without consent
- Users can opt out via browser settings
- Consider adding cookie consent banner for EU users

---

**Need help?** Check the [Google Analytics Help Center](https://support.google.com/analytics) or contact support.