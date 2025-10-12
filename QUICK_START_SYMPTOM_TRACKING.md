# Quick Start: Symptom Tracking Feature

## 🎯 What This Feature Does

Upgrades your Daily Check-In from basic energy tracking to comprehensive symptom tracking for chronic conditions (pain, ADHD, perimenopause, etc.).

## ⚡ Quick Deploy (5 Minutes)

### 1️⃣ Run Database Migration (FIRST!)

Open your Supabase Dashboard → SQL Editor, paste this:

```sql
-- Paste the entire contents of: database/add-symptom-tracking.sql
```

Click "RUN" → Should see "Success"

### 2️⃣ Deploy Code

```bash
cd /Users/testdev/Desktop/open-pages
git add .
git commit -m "Add symptom tracking to daily check-in"
git push origin main
```

Vercel will auto-deploy in ~2 minutes.

### 3️⃣ Test It

1. Open your dashboard
2. Click "Daily Check-in"
3. You should see:
   - 3 sliders: Mood, Pain, Sleep
   - Expandable "Symptoms today" section
   - 15 symptom tags
   - Pain location selector

Done! 🎉

## 📸 What Users Will See

**Before:**
```
Energy: [slider] 7/10
Mood: [dropdown]
[Optional note field]
```

**After:**
```
Mood:  [slider] 6/10
Pain:  [slider] 7/10  
Sleep: [slider] 4/10
Mood Vibe: [dropdown]

▼ Symptoms today (optional)
  → Click to expand
  → 15 symptoms as clickable tags
  → Add custom symptoms
  → Pain locations (if pain > 0)
  → Notes field
```

## 🎨 Key Features

- **Fast by default:** 3 sliders = 10 seconds
- **Detailed if wanted:** Full symptom tracking = 60 seconds
- **Collapsible:** Symptoms hidden by default
- **Mobile-friendly:** Touch-optimized
- **Smart:** Pain locations only show if pain > 0

## 📊 Data Saved

```json
{
  "mood": 6,
  "pain": 7,
  "sleep": 4,
  "symptoms": ["brain_fog", "fatigue", "headache"],
  "pain_locations": ["head", "neck"],
  "custom_symptoms": ["light sensitivity"],
  "notes": "Tried new supplement today"
}
```

## 🔍 Files Changed

- ✅ `database/add-symptom-tracking.sql` - Database schema
- ✅ `src/components/DailyCheckinModal.tsx` - UI component
- ✅ `src/app/api/mood/today/route.ts` - API endpoint

## ✅ Build Status

- TypeScript: ✅ No errors
- Linter: ✅ No errors
- Build: ✅ Successful
- Ready to deploy: ✅ YES

## 🚨 Important

**MUST run database migration BEFORE deploying code!**

Otherwise users will see errors when trying to save symptoms.

## 📖 Full Documentation

For detailed information, see:
- `SYMPTOM_TRACKING_IMPLEMENTATION_GUIDE.md`
- `DEPLOYMENT_CHECKLIST_SYMPTOM_TRACKING.md`

---

**Ready?** Run the migration, push the code, and you're live! 🚀

