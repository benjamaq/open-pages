# Google Analytics Verification Guide

## ✅ **Your Measurement ID: G-BQJWCVNJH0**

### 🔧 **Step 1: Update Environment Variable**

**Local Development:**
1. Open `.env.local` file
2. Update the line to:
   ```bash
   NEXT_PUBLIC_GA_MEASUREMENT_ID=G-BQJWCVNJH0
   ```
3. Save the file
4. Restart your development server: `npm run dev`

**Production (Vercel):**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add/Update: `NEXT_PUBLIC_GA_MEASUREMENT_ID` = `G-BQJWCVNJH0`
3. Redeploy your site

### 🧪 **Step 2: Test Locally**

1. **Start development server:**
   ```bash
   npm run dev
   ```

2. **Open browser console** and look for:
   - ✅ **No warning messages** about missing measurement ID
   - ✅ **Network requests** to `googletagmanager.com`

3. **Check Network tab:**
   - Look for requests to `https://www.googletagmanager.com/gtag/js?id=G-BQJWCVNJH0`
   - Should see `gtag` function calls

### 🌐 **Step 3: Test Production**

1. **Visit your live site:** `https://biostackr.io`
2. **Open browser console** and check:
   - No GA warnings in console
   - Network requests to Google Analytics

3. **Verify in Google Analytics:**
   - Go to your GA dashboard
   - Check **Realtime** → **Overview**
   - You should see your own visit

### 📊 **What's Being Tracked**

**Automatic Tracking:**
- ✅ **Page views** (all pages)
- ✅ **User sessions** and duration
- ✅ **Traffic sources** (direct, social, search)
- ✅ **Device information** (mobile, desktop)
- ✅ **Geographic data** (country, city)

**Custom Events (Ready to Add):**
- 🔄 **Mood entries** (when users log daily check-ins)
- 🔄 **Stack additions** (when users add supplements/protocols)
- 🔄 **Profile views** (when users visit public profiles)
- 🔄 **Subscription conversions** (when users upgrade)

### 🚨 **Troubleshooting**

**If you see warnings:**
1. **"Measurement ID not found"** → Check `.env.local` has correct ID
2. **No GA requests** → Restart dev server after updating env
3. **No data in GA** → Wait 24-48 hours, check ad blockers

**Debug Mode:**
Add `?debug_mode=true` to your URL to see detailed GA events in console.

### 🎯 **Next Steps**

1. **Set up Goals** in GA for key actions:
   - User signup
   - Profile creation
   - Subscription purchase

2. **Create Audiences** for user segmentation:
   - Free tier users
   - Pro subscribers
   - Active mood trackers

3. **Set up Conversion Tracking:**
   - Track subscription purchases
   - Monitor user engagement
   - Measure feature adoption

---

**Your GA is ready to go!** 🚀
