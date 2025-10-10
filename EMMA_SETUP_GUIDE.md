# Emma Demo Account Setup Guide

## Current Status

✅ **Created Successfully:**
- Emma's profile (`emma-chronic-pain-journey`)
- 20 stack items across all categories
- 60 days of heatmap data with realistic pain patterns
- 45 followers

## What's Missing & How to Fix

### 1. Heatmap Not Showing
**Issue:** The heatmap requires mood tracking to be enabled.

**Fix:** Add this to your `.env.local` file:
```
NEXT_PUBLIC_MOOD_TRACKING_ENABLED=true
```
Then restart your dev server: `npm run dev`

### 2. Journal Entries Not Showing
**Issue:** Journal entries weren't added in the main script.

**Fix:** Run the journal entries script:
```sql
-- In Supabase SQL Editor, run:
\i seed-emma-journal-entries.sql
```
Or copy/paste the contents of `seed-emma-journal-entries.sql`

This adds 5 detailed, authentic journal entries about Emma's journey.

### 3. Devices Not Showing
**Issue:** Check if devices are actually in the database.

**Fix:** Run the diagnostic script to verify:
```sql
-- In Supabase SQL Editor, run:
\i check-emma-data.sql
```

This will show you:
- How many stack items exist
- Breakdown by type (should show `devices: 2`)
- Total daily entries (should be 60)
- Journal entries count
- Followers count

If devices are missing (count = 0), the `seed-emma-v2.sql` script needs to be re-run.

## Verification Checklist

Visit Emma's profile: `https://www.biostackr.io/u/emma-chronic-pain-journey`

Check for:
- ✅ Profile photo (Golden Retriever)
- ✅ Bio about fibromyalgia
- ✅ 45 followers displayed
- ✅ **Heatmap** showing 60 days of data with color patterns
- ✅ **Stack items** in all sections:
  - Supplements/Meds: 9 items
  - Protocols: 4 items
  - Movement: 3 items
  - Mindfulness: 3 items
  - **Devices: 2 items** (TENS Unit, Red Light Therapy)
- ✅ **Journal entries**: 5 detailed posts
- ✅ Click on heatmap days shows detailed data

## Data Patterns in the Heatmap

Emma's 60-day journey shows:

**Days 1-20 (Rough Period)**
- Pain: 6-10
- Mood: 2-6
- Colors: Red/Orange (struggling period)

**Days 21-40 (Improvement - Started LDN)**
- Pain: 3-6  
- Mood: 6-9
- Colors: Green/Yellow (LDN working!)

**Days 41-50 (Setback)**
- Pain: 7-9
- Mood: 3-5
- Colors: Orange/Red (overdid it)

**Days 51-60 (Recovery)**
- Pain: 3-5
- Mood: 6-9
- Colors: Green (learned pacing)

## Troubleshooting

### Heatmap Still Not Showing
1. Check browser console for errors
2. Verify `NEXT_PUBLIC_MOOD_TRACKING_ENABLED=true` in `.env.local`
3. Hard refresh browser (Cmd+Shift+R)
4. Check that daily_entries table has data for Emma

### Devices Not Showing
1. Run `check-emma-data.sql` to verify they exist
2. Check the public profile page filters - devices should be in a separate section
3. Verify `item_type = 'devices'` in the database

### Journal Not Showing
1. Run `seed-emma-journal-entries.sql`
2. Verify journal entries exist: `SELECT * FROM journal_entries WHERE profile_id = (SELECT id FROM profiles WHERE slug = 'emma-chronic-pain-journey')`
3. Check that `show_journal_public = true` on Emma's profile

## Next Steps

Once Emma's profile is complete and verified:
1. Use her link in welcome emails as an example
2. Create additional demo accounts:
   - ADHD management
   - CFS/ME tracking
   - Biohacker optimization
   - Athletic performance

Each should follow the same pattern: realistic data, clear patterns, authentic journey.

