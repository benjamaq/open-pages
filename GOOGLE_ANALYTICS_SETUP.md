# Google Analytics 4 Setup Guide

## 🎯 Overview
Google Analytics 4 (GA4) has been installed and configured to track visitor behavior, page views, and user interactions on your BioStackr site.

## 📊 What We're Tracking

### **Automatic Tracking:**
- **Page Views** - Every page visit
- **User Sessions** - How long users stay on your site
- **Traffic Sources** - Where visitors come from (Google, social media, direct, etc.)
- **Device & Browser Info** - Mobile vs desktop usage
- **Geographic Data** - Where your users are located
- **Bounce Rate** - How many users leave after viewing one page

### **Key Metrics You'll See:**
- **Real-time visitors** - Who's on your site right now
- **Daily/Monthly active users**
- **Most popular pages** - Which content resonates
- **Conversion tracking** - Sign-ups, upgrades, etc.
- **User flow** - How people navigate your site

## 🚀 Setup Instructions

### **Step 1: Create Google Analytics Account**
1. Go to [Google Analytics](https://analytics.google.com/)
2. Click "Start measuring" or "Create Account"
3. Enter account name: "BioStackr" (or your preferred name)
4. Choose "Web" as your platform

### **Step 2: Create GA4 Property**
1. Enter property name: "BioStackr Website"
2. Select your country and timezone
3. Choose your currency
4. Click "Create"

### **Step 3: Get Your Measurement ID**
1. In your GA4 property, go to **Admin** (gear icon)
2. Under **Property**, click **Data Streams**
3. Click **Add stream** → **Web**
4. Enter your website URL: `https://biostackr.io`
5. Enter stream name: "BioStackr Website"
6. Click **Create stream**
7. Copy the **Measurement ID** (starts with `G-`)

### **Step 4: Add to Environment Variables**
1. Open your `.env.local` file
2. Add this line:
   ```env
   NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
   ```
3. Replace `G-XXXXXXXXXX` with your actual measurement ID
4. Save the file

### **Step 5: Deploy to Production**
1. Add the same environment variable to your production environment (Vercel, Netlify, etc.)
2. Redeploy your site
3. Google Analytics will start tracking immediately

## 📈 Key Reports to Monitor

### **1. Real-time Overview**
- **Location**: Real-time → Overview
- **What it shows**: Current active users, top pages, traffic sources

### **2. Acquisition Report**
- **Location**: Reports → Acquisition → Traffic acquisition
- **What it shows**: Where your visitors come from (Google, social media, direct)

### **3. Engagement Report**
- **Location**: Reports → Engagement → Pages and screens
- **What it shows**: Most popular pages, time on page, bounce rate

### **4. Conversions**
- **Location**: Reports → Engagement → Conversions
- **What it shows**: Key actions users take (sign-ups, upgrades, etc.)

## 🎯 Setting Up Goals & Conversions

### **Track These Key Actions:**
1. **User Sign-ups** - New account registrations
2. **Pro Upgrades** - Users upgrading to paid plans
3. **Profile Views** - Public profile page visits
4. **Contact Form Submissions** - Lead generation

### **How to Set Up Goals:**
1. Go to **Admin** → **Events**
2. Click **Create event**
3. Name your event (e.g., "user_signup")
4. Set up the trigger (e.g., when someone visits `/dash` after signup)
5. Mark as conversion if it's a key business goal

## 📱 Mobile vs Desktop Insights

### **What to Look For:**
- **Mobile usage percentage** - How many users are on mobile
- **Mobile bounce rate** - Are mobile users staying or leaving quickly?
- **Mobile conversion rate** - Are mobile users signing up/upgrading?

### **Mobile Optimization Opportunities:**
- If mobile bounce rate is high, check mobile UX
- If mobile conversion is low, optimize mobile checkout flow
- If mobile traffic is high, ensure mobile-first design

## 🔍 Advanced Tracking (Optional)

### **Custom Events** (for developers):
```javascript
// Track button clicks
gtag('event', 'click', {
  event_category: 'engagement',
  event_label: 'upgrade_button'
});

// Track form submissions
gtag('event', 'form_submit', {
  event_category: 'engagement',
  event_label: 'contact_form'
});
```

### **E-commerce Tracking** (for Stripe integration):
- Track revenue from Pro/Creator subscriptions
- Monitor conversion funnel from pricing to payment
- Track subscription lifecycle events

## 📊 Weekly Review Checklist

### **Every Monday, Check:**
- [ ] **Traffic trends** - Is traffic growing?
- [ ] **Top pages** - What content is most popular?
- [ ] **Traffic sources** - Where are users coming from?
- [ ] **Mobile vs desktop** - Any UX issues?
- [ ] **Conversion rates** - Are users taking desired actions?

### **Monthly Deep Dive:**
- [ ] **User journey analysis** - How do users navigate your site?
- [ ] **Content performance** - Which pages drive the most engagement?
- [ ] **Traffic source ROI** - Which channels bring the best users?
- [ ] **Conversion optimization** - Where are users dropping off?

## 🚨 Important Notes

### **Privacy Compliance:**
- Google Analytics is GDPR compliant
- Users can opt out via browser settings
- No personal data is collected without consent

### **Data Retention:**
- GA4 retains data for 14 months by default
- Can be extended to 38 months if needed
- Raw data is processed and aggregated

### **Performance Impact:**
- Minimal impact on site speed
- Loads asynchronously
- Won't affect user experience

## 🎉 You're All Set!

Once you add your measurement ID to the environment variables, Google Analytics will start tracking immediately. You'll see data flowing in within 24-48 hours.

**Next Steps:**
1. Set up your GA4 property
2. Add the measurement ID to `.env.local`
3. Deploy to production
4. Start monitoring your first reports!

---

**Need Help?** Check the [Google Analytics Help Center](https://support.google.com/analytics) or reach out if you need assistance with setup.
