# 🚨 Database Migration Required - Run This Now!

## The Error You're Seeing

```
Could not find the function public.upsert_daily_entry_and_snapshot(
  p_completed_items, p_custom_symptoms, p_journal, p_local_date, p_mood, 
  p_pain, p_pain_locations, p_pain_types, p_sleep_quality, p_symptoms, 
  p_tags, p_user_id, p_wearables
) in the schema cache
```

## Why This Happens

The frontend is sending new parameters (`p_symptoms`, `p_pain_locations`, `p_pain_types`, `p_custom_symptoms`) but your database doesn't have them yet.

## 🚀 How to Fix (5 Minutes)

### Step 1: Open Supabase Dashboard
1. Go to your Supabase project
2. Click **"SQL Editor"** in the left sidebar
3. Click **"New Query"**

### Step 2: Copy & Paste This SQL

Open the file: `/database/add-pain-types.sql`

Copy ALL the contents and paste into the Supabase SQL Editor.

### Step 3: Click "Run"

Click the **"Run"** button in Supabase.

You should see:
```
Success. No rows returned
```

### Step 4: Test

1. Go back to your app
2. Open the daily check-in modal
3. Adjust the sliders
4. Click "Save Check-in"
5. You should see ✅ "Check-in saved!" instead of the error

## ✅ What the Migration Does

### 1. Adds New Columns to `daily_entries` Table
```sql
symptoms TEXT[]           -- Core symptoms selected
pain_locations TEXT[]     -- Pain location chips
pain_types TEXT[]         -- Pain type chips (dull, sharp, etc.)
custom_symptoms TEXT[]    -- User-entered custom symptoms
```

### 2. Updates the RPC Function
Adds these 4 new parameters to `upsert_daily_entry_and_snapshot` so it can accept and save the new data.

## 🔍 Verification

After running the migration, you can verify it worked:

**In Supabase SQL Editor, run:**
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'daily_entries' 
AND column_name IN ('symptoms', 'pain_locations', 'pain_types', 'custom_symptoms');
```

You should see all 4 columns with `ARRAY` type.

## ⚠️ Important Notes

- **Safe to run:** This migration only ADDS columns, doesn't modify existing data
- **Idempotent:** Safe to run multiple times (uses `IF NOT EXISTS` and `OR REPLACE`)
- **No downtime:** Existing check-ins will work fine, just won't have the new fields
- **Required:** The app won't save check-ins until you run this

## 🎯 After Migration

Once complete, you'll be able to:
- ✅ Save check-ins with the Readiness Score
- ✅ Select contextual triggers (lifestyle, nutrition, etc.)
- ✅ Track symptoms and pain details
- ✅ Add custom symptoms
- ✅ Everything will work as designed!

---

**Need help?** The migration file is at: `/database/add-pain-types.sql`

