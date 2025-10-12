# Symptom Tracking Feature - Deployment Checklist

## ✅ Implementation Status: COMPLETE

The daily check-in symptom tracking upgrade has been successfully implemented and tested.

## 📦 What's Included

### 1. Database Migration
**File:** `database/add-symptom-tracking.sql`
- Adds `symptoms`, `pain_locations`, `custom_symptoms` columns
- Updates `upsert_daily_entry_and_snapshot` function
- Creates GIN indexes for fast array queries

### 2. Updated Components
- `src/components/DailyCheckinModal.tsx` - Complete UI overhaul
- `src/app/api/mood/today/route.ts` - API support for new fields

### 3. Documentation
- `SYMPTOM_TRACKING_IMPLEMENTATION_GUIDE.md` - Complete implementation guide

## 🚀 Deployment Steps

### Step 1: Database Migration (REQUIRED)
```bash
# 1. Open Supabase Dashboard > SQL Editor
# 2. Copy contents from: database/add-symptom-tracking.sql
# 3. Paste and execute
# 4. Verify success - should see "Success. No rows returned"
```

### Step 2: Deploy Code
```bash
# If using Vercel (recommended):
git add .
git commit -m "Add symptom tracking to daily check-in"
git push origin main

# Vercel will auto-deploy

# Or manual build:
npm run build
npm start
```

### Step 3: Verify Deployment
1. Open your BioStackr dashboard
2. Click "Daily Check-in" button
3. Verify you see:
   - ✅ Mood slider (0-10)
   - ✅ Pain slider (0-10)
   - ✅ Sleep slider (0-10)
   - ✅ Mood Vibe dropdown
   - ✅ "Symptoms today (optional)" section
   - ✅ Expand/collapse works
   - ✅ Symptom tags are clickable
   - ✅ Pain locations appear when pain > 0

### Step 4: Test Full Flow
1. Set sliders to various values
2. Expand symptoms section
3. Select 2-3 symptoms
4. Set pain > 0 and select pain location
5. Add a custom symptom
6. Add notes
7. Click Save
8. Verify success message
9. Refresh page
10. Reopen modal - verify data persists

## ⚠️ Pre-Deployment Checklist

- [x] Build completes without errors ✅
- [x] TypeScript types are correct ✅
- [x] No linter errors ✅
- [x] Database migration script ready ✅
- [x] API routes updated ✅
- [x] UI components updated ✅
- [ ] Database migration executed (DO THIS FIRST)
- [ ] Production deployment
- [ ] Post-deployment testing

## 🔧 Rollback Plan (If Needed)

If something goes wrong:

1. **Code Rollback:**
```bash
git revert HEAD
git push origin main
```

2. **Database Rollback:**
```sql
-- Remove new columns (will lose symptom data)
ALTER TABLE daily_entries DROP COLUMN IF EXISTS symptoms;
ALTER TABLE daily_entries DROP COLUMN IF EXISTS pain_locations;
ALTER TABLE daily_entries DROP COLUMN IF EXISTS custom_symptoms;

-- Restore original function (backup the old one first!)
```

## 📊 Expected Behavior

### Before Migration
- Daily check-in shows basic energy slider and mood
- No symptom tracking

### After Migration
- Daily check-in shows 3 sliders: Mood, Pain, Sleep
- Collapsible symptom tracking section
- 15 core symptoms
- Custom symptom input
- Pain location selector (conditional)
- Notes field

## 🐛 Troubleshooting

**Problem:** Database migration fails
- **Solution:** Check if columns already exist. If so, migration may have partially run. Manually verify schema.

**Problem:** Symptoms not saving
- **Solution:** Check browser console for errors. Verify API endpoint is receiving data.

**Problem:** UI not showing new fields
- **Solution:** Hard refresh browser (Cmd+Shift+R). Clear cache. Verify deployment succeeded.

**Problem:** Pain locations not appearing
- **Solution:** Ensure pain slider is > 0. This is conditional logic.

## 📈 Success Metrics

After deployment, monitor:
- [ ] Users completing symptom tracking (vs basic check-in)
- [ ] Most common symptoms selected
- [ ] Custom symptoms added
- [ ] Average check-in completion time
- [ ] Data quality and completeness

## 🎯 User Communication

**Announcement Template:**
```
🎉 New Feature: Symptom Tracking

We've upgraded the Daily Check-in with comprehensive symptom tracking!

New features:
✅ Track pain, mood, and sleep with simple sliders
✅ 15 common symptoms (chronic pain, ADHD, perimenopause)
✅ Add custom symptoms
✅ Track pain locations
✅ Optional notes

Still fast: Basic check-in = 10 seconds
Want details? Full tracking = 60 seconds

Try it now in your dashboard!
```

## 📞 Support

If issues arise:
1. Check console logs
2. Verify database migration completed
3. Test in incognito mode
4. Check Supabase logs for API errors

## ✅ Final Checklist

- [x] Code committed to repository
- [x] Build tested locally
- [x] Documentation complete
- [ ] Database migration ready to execute
- [ ] Deployment scheduled
- [ ] Team notified
- [ ] Rollback plan documented

---

**Ready to Deploy!** 🚀

Follow steps in order. Database migration MUST happen before code deployment.

