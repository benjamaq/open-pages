# 🚀 QUICK START - TONE PROFILE SYSTEM TESTING

## ⚡ 3-MINUTE SETUP

### Step 1: Run SQL Migration (2 minutes)
1. Open Supabase Dashboard
2. Go to **SQL Editor**
3. Copy this SQL:

```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tone_profile TEXT;
CREATE INDEX IF NOT EXISTS idx_profiles_tone_profile ON profiles(tone_profile);

UPDATE profiles
SET tone_profile = CASE
  WHEN condition_category = 'Chronic pain or illness' THEN 'chronic_pain'
  WHEN condition_specific IN ('Fibromyalgia', 'CFS/ME', 'Chronic pain', 'Autoimmune condition') THEN 'chronic_pain'
  WHEN condition_category = 'Biohacking' THEN 'biohacking'
  WHEN condition_category = 'Fertility or pregnancy' THEN 'fertility'
  WHEN condition_category = 'Sleep issues' THEN 'sleep'
  WHEN condition_category = 'Energy or fatigue' THEN 'energy'
  WHEN condition_category = 'Mental health' THEN 'mental_health'
  WHEN condition_specific = 'ADHD' THEN 'adhd'
  WHEN condition_specific = 'Perimenopause' THEN 'perimenopause'
  ELSE 'general_wellness'
END
WHERE tone_profile IS NULL;
```

4. Click **Run**
5. Verify: `SELECT tone_profile FROM profiles LIMIT 5;`

### Step 2: Hard Refresh Browser (30 seconds)
- Press `Cmd + Shift + R` (Mac) or `Ctrl + Shift + R` (Windows)
- Or clear browser cache

---

## 🧪 QUICK TEST (5 minutes)

### Test 1: Chronic Pain User
1. Open **incognito window**
2. Go to http://localhost:3009
3. **Sign up** as new user
4. **Watch the flow**:
   - See "Hi, I'm Elli 💙" (generic welcome)
   - Click "Let's go"
   - See "What brings you here today?"
   - Select **"Chronic pain or illness"**
   - Select **"Fibromyalgia"**
   - See warm validation message
   - Click "Let's learn more about you"
   - See "Now let me see where you're at today..."
   - Complete check-in: **Pain 8/10**, Mood 4/10, Sleep 5/10
   - **LOOK FOR**: "Ben, pain at 8/10 today. That's brutal, and I'm really sorry..."

**Expected**: High empathy, "I'm sorry", "That's brutal"

### Test 2: Biohacker (Compare the Difference!)
1. Open **new incognito window**
2. Sign up as different user
3. Select **"Biohacking"**
4. Complete check-in: **Pain 2/10**, Mood 8/10, Sleep 7/10
5. **LOOK FOR**: "Ben, baseline recorded. Readiness: 8/10. Let's track interventions..."

**Expected**: Data-focused, analytical, NO emotional empathy

---

## ✅ SUCCESS CRITERIA

### You'll know it's working if:
- ✅ Intro shows BEFORE check-in (not after)
- ✅ Category selection shows BEFORE check-in
- ✅ Response message matches tone profile
- ✅ Chronic pain gets empathy, biohacker gets data
- ✅ No errors in console

### Console Logs to Look For:
```
🎯 Showing NEW orchestrated onboarding flow
✅ Condition saved: { selectedCategory, selectedSpecific }
✅ Tone profile set: chronic_pain
💙 PostCheckinResponseModal: { toneProfile: 'chronic_pain', empathyLevel: 10 }
```

---

## 🐛 IF SOMETHING BREAKS

### Issue: "Column tone_profile does not exist"
**Fix**: Run SQL migration (Step 1 above)

### Issue: Text-only site
**Fix**: 
```bash
rm -rf .next && rm -rf node_modules/.cache
pkill -f "npm run dev"
npm run dev
```

### Issue: Orchestrator not showing
**Check**: Console logs for "needsOrchestrated: true"

---

## 🎯 THE KEY DIFFERENCE

### OLD FLOW (WRONG):
```
Check-in → "I see you're dealing with pain..." → Category
```
Everyone got pain-focused messages

### NEW FLOW (CORRECT):
```
Category → Check-in → Tone-appropriate response
```
Each user type gets personalized messages

---

## 📊 QUICK VERIFICATION

After testing, run this in Supabase:

```sql
SELECT 
  display_name,
  condition_category,
  tone_profile
FROM profiles
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC
LIMIT 5;
```

You should see:
- `condition_category`: "Chronic pain or illness", "Biohacking", etc.
- `tone_profile`: "chronic_pain", "biohacking", etc.

---

## 🎉 THAT'S IT!

**Total time**: ~10 minutes  
**Result**: Personalized Elli for every user type

**Test it now!** 🚀

