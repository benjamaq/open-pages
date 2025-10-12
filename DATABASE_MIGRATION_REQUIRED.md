# 🔴 CRITICAL: Database Migration Required

## Error You're Seeing
```
Could not find the function public.upsert_daily_entry_and_snapshot(p_completed_items, p_custom_symptoms, p_journal, p_local_date, p_mood, p_pain, p_pain_locations, p_pain_types, p_sleep_quality, p_symptoms, p_tags, p_user_id, p_wearables) in the schema cache
```

## Why This Is Happening
The database RPC function `upsert_daily_entry_and_snapshot` doesn't have the new symptom tracking parameters we just added to the frontend. The frontend is sending `p_symptoms`, `p_pain_locations`, `p_pain_types`, and `p_custom_symptoms`, but the database function doesn't accept them yet.

## 🚀 Quick Fix (5 minutes)

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase dashboard
2. Click **"SQL Editor"** in the left sidebar
3. Click **"New Query"**

### Step 2: Run This SQL
Copy and paste the contents of `/database/add-pain-types.sql` (created for you) into the SQL editor and click **"Run"**.

This will:
- Add the new columns to `daily_entries` table: `symptoms`, `pain_locations`, `pain_types`, `custom_symptoms`
- Update the `upsert_daily_entry_and_snapshot` RPC function to accept the new parameters

### Step 3: Test
1. Refresh your app at `http://localhost:3009`
2. Open the daily check-in modal
3. Try saving with some symptoms selected
4. You should see ✅ "Check-in saved!" instead of the error

---

## 📝 What Changed
The migration adds these new fields to track enhanced symptom data:

```sql
-- New columns added to daily_entries
symptoms TEXT[]           -- Array of symptom slugs (e.g., ['brain-fog', 'fatigue'])
pain_locations TEXT[]     -- Array of pain locations (e.g., ['lower-back', 'neck'])
pain_types TEXT[]         -- Array of pain types (e.g., ['sharp', 'dull'])
custom_symptoms TEXT[]    -- Array of custom user-entered symptoms
```

The RPC function was updated to handle these new parameters when saving daily check-ins.

---

## 🔍 Verification
After running the migration, you can verify it worked by checking:

1. **In Supabase SQL Editor**, run:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'daily_entries' 
AND column_name IN ('symptoms', 'pain_locations', 'pain_types', 'custom_symptoms');
```

You should see all 4 columns with `data_type = ARRAY`.

2. **In your app**, try saving a check-in with symptoms selected. The error should be gone.

---

## ⚠️ Important Notes
- This is a **non-destructive migration** - it only adds new columns, doesn't modify existing data
- Existing check-ins will have empty arrays for the new fields
- The migration is **idempotent** - safe to run multiple times (uses `IF NOT EXISTS` and `OR REPLACE`)
- After this migration, the symptom tracking feature will be fully functional

