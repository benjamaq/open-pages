# Onboarding Flow Testing Guide

## 📋 **Setup Instructions**

### **Step 1: Database Migration**
Run this SQL in your Supabase SQL Editor (Dashboard → SQL Editor):

```sql
-- Add onboarding columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_step INT DEFAULT 1;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS first_checkin_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS first_supplement_added BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_created BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS public_page_viewed BOOLEAN DEFAULT FALSE;

-- Create index for efficient onboarding queries
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding ON profiles(onboarding_completed, onboarding_step);
```

### **Step 2: Start Localhost**
```bash
cd /Users/testdev/Desktop/open-pages
npm run dev
```

The server will start on `http://localhost:3009`

---

## 🧪 **Testing the Onboarding Flow**

### **Test 1: New User - Complete Full Onboarding**

1. **Sign up** with a new account on localhost
2. You should immediately see **Step 1: First Check-In**
   - ✅ No X button (cannot close)
   - ✅ No skip button
   - Move sliders for mood, sleep, pain
   - Click "Log My First Check-In"

3. You should see **Step 2: Add First Supplement**
   - ✅ No X button (cannot close)
   - ✅ No skip button
   - Enter a supplement name (e.g., "Magnesium 400mg")
   - Click "Add to Stack"

4. You should see **Step 3: Create Profile (optional)**
   - ✅ X button appears in top right
   - ✅ "Skip for now" button at bottom
   - Optionally enter mission statement
   - Click either "Create Profile" or "Skip for now"

5. If you created profile, you'll see **Step 4: View Public Page (optional)**
   - ✅ X button appears in top right
   - ✅ "Skip for now" button at bottom
   - Your public link is displayed
   - Click either "Done - Take Me to Dashboard" or "Skip for now"

6. **Dashboard loads** ✅
   - You see your first check-in data
   - You see your first supplement
   - No onboarding banner (if you completed all 4 steps)

---

### **Test 2: New User - Skip Steps 3-4**

1. **Sign up** with a new account
2. Complete **Step 1** (Check-In) - **REQUIRED**
3. Complete **Step 2** (Add Supplement) - **REQUIRED**
4. On **Step 3**, click **"Skip for now"**
5. **Dashboard loads** ✅
6. You should see a **dismissible banner** at top:
   - "Share your journey"
   - "Complete your profile to share your journey with others"
   - "Complete Profile" button
   - X button to dismiss

---

### **Test 3: Returning User - Resume Onboarding**

1. Sign in with an account that skipped steps 3-4
2. Dashboard loads with banner showing
3. Click **"Complete Profile"** button in banner
4. Onboarding modal opens at **Step 3**
5. Complete or skip the remaining steps

---

### **Test 4: Try to Skip Mandatory Steps (Should Fail)**

1. Sign up with a new account
2. On **Step 1** or **Step 2**:
   - ✅ No X button should appear
   - ✅ No "Skip" button should appear
   - ✅ Modal cannot be closed
   - User MUST complete these steps

---

## 🔍 **What to Check**

### **Onboarding Modal**
- [ ] Steps 1-2: No X button, no skip option
- [ ] Steps 3-4: X button in header, "Skip for now" button at bottom
- [ ] Progress bar shows current step (1 of 4, 2 of 4, etc.)
- [ ] Success messages appear after completing each step
- [ ] Data is saved to database after each step

### **Dashboard**
- [ ] After steps 1-2: User can access dashboard
- [ ] After skipping 3-4: Banner appears at top
- [ ] Banner is dismissible (X button)
- [ ] Banner "Complete Profile" button reopens onboarding
- [ ] After completing all 4 steps: No banner appears

### **Database**
Check in Supabase → Table Editor → profiles table:
- [ ] `first_checkin_completed` = true after step 1
- [ ] `first_supplement_added` = true after step 2
- [ ] `profile_created` = true after step 3 (or false if skipped)
- [ ] `public_page_viewed` = true after step 4 (or false if skipped)
- [ ] `onboarding_completed` = true only after all 4 steps

---

## 🐛 **Common Issues**

### **Issue: Onboarding doesn't show on new signup**
**Solution**: Run the database migration SQL above

### **Issue: Can't skip steps 3-4**
**Check**: 
1. Is the skip button rendering?
2. Check browser console for errors
3. Verify `onSkip` prop is passed to `OnboardingModal`

### **Issue: Banner doesn't appear after skipping**
**Check**:
1. Verify steps 1-2 are marked complete in database
2. Check `shouldShowProfileBanner()` logic in `src/lib/onboarding.ts`
3. Refresh page to reload profile data

### **Issue: Modal won't close on steps 1-2 (Expected behavior!)**
**This is correct** - Steps 1-2 are mandatory and cannot be skipped

---

## 📊 **Testing Checklist**

### **Happy Path**
- [ ] New user completes all 4 steps
- [ ] New user skips steps 3-4, sees banner
- [ ] User dismisses banner successfully
- [ ] User clicks "Complete Profile" to resume
- [ ] Returning user sees no banner if all complete

### **Edge Cases**
- [ ] Try to close modal on step 1 (should fail)
- [ ] Try to close modal on step 2 (should fail)
- [ ] Click X button on step 3 (should close and allow dashboard access)
- [ ] Skip step 3, then skip step 4 (both should work)
- [ ] Complete steps 1-2, refresh page (should still be completed)

---

## 🚀 **Deploy to Live**

Once tested on localhost:

1. **Commit changes:**
   ```bash
   git add .
   git commit -m "✨ Add improved onboarding with skippable steps 3-4"
   git push origin main
   ```

2. **Run SQL migration on live Supabase:**
   - Go to your live Supabase project dashboard
   - SQL Editor → New Query
   - Paste the migration SQL from Step 1 above
   - Run it

3. **Verify deployment:**
   - Vercel will auto-deploy from main branch
   - Test on biostackr.io with a new account
   - Check that onboarding flow works as expected

---

## 💡 **FAQ Testing Notes**

The FAQ section on the landing page should now be visible at:
- `http://localhost:3009/` (scroll to bottom)
- `http://localhost:3009/faq` (full FAQ page)

**Test:**
- [ ] Landing page FAQ section renders
- [ ] Links to full FAQ page work
- [ ] Full FAQ page has all 7 questions
- [ ] Navigation and CTAs work

