-- Comprehensive diagnostic script to find the root cause
-- This will check every step of the data flow

DO $$
DECLARE
  v_emma_profile_id UUID;
  v_emma_user_id UUID;
  v_profile_count INTEGER;
  v_entries_count INTEGER;
  v_sample_entry RECORD;
  v_current_date DATE;
  v_start_date DATE;
  v_end_date DATE;
  v_days INTEGER := 30;
BEGIN
  RAISE NOTICE '=== EMMA MOOD DATA DIAGNOSTIC ===';
  
  -- Step 1: Check if Emma's profile exists
  SELECT id, user_id INTO v_emma_profile_id, v_emma_user_id
  FROM profiles 
  WHERE slug = 'emma-chronic-pain-journey';

  IF v_emma_profile_id IS NULL THEN
    RAISE EXCEPTION '❌ Emma profile not found!';
  END IF;

  RAISE NOTICE '✅ Emma profile found:';
  RAISE NOTICE '   Profile ID: %', v_emma_profile_id;
  RAISE NOTICE '   User ID: %', v_emma_user_id;

  -- Step 2: Check total daily entries for Emma
  SELECT COUNT(*) INTO v_entries_count
  FROM daily_entries 
  WHERE user_id = v_emma_user_id;

  RAISE NOTICE '📊 Total daily entries for Emma: %', v_entries_count;

  -- Step 3: Show sample entries with actual data
  RAISE NOTICE '📝 Sample entries (last 5):';
  FOR v_sample_entry IN 
    SELECT local_date, mood, pain, sleep_quality, tags, journal
    FROM daily_entries 
    WHERE user_id = v_emma_user_id 
    ORDER BY local_date DESC 
    LIMIT 5
  LOOP
    RAISE NOTICE '   Date: %, Mood: %, Pain: %, Sleep: %, Tags: %, Journal: %', 
      v_sample_entry.local_date, 
      v_sample_entry.mood, 
      v_sample_entry.pain, 
      v_sample_entry.sleep_quality,
      v_sample_entry.tags,
      LEFT(COALESCE(v_sample_entry.journal, ''), 30);
  END LOOP;

  -- Step 4: Check date range
  SELECT 
    MIN(local_date) as earliest_date,
    MAX(local_date) as latest_date
  INTO v_sample_entry
  FROM daily_entries 
  WHERE user_id = v_emma_user_id;

  RAISE NOTICE '📅 Date range: % to %', v_sample_entry.earliest_date, v_sample_entry.latest_date;

  -- Step 5: Simulate the getPublicMoodData date calculation
  v_current_date := CURRENT_DATE;
  v_end_date := v_current_date;
  v_start_date := v_current_date - (v_days - 1);
  
  RAISE NOTICE '🔍 getPublicMoodData date range:';
  RAISE NOTICE '   Start date: %', v_start_date;
  RAISE NOTICE '   End date: %', v_end_date;

  -- Step 6: Check entries in the exact date range that getPublicMoodData uses
  SELECT COUNT(*) INTO v_entries_count
  FROM daily_entries 
  WHERE user_id = v_emma_user_id 
    AND local_date >= v_start_date 
    AND local_date <= v_end_date;

  RAISE NOTICE '📊 Entries in getPublicMoodData date range: %', v_entries_count;

  -- Step 7: Show entries in the date range
  RAISE NOTICE '📝 Entries in date range:';
  FOR v_sample_entry IN 
    SELECT local_date, mood, pain, sleep_quality, tags
    FROM daily_entries 
    WHERE user_id = v_emma_user_id 
      AND local_date >= v_start_date 
      AND local_date <= v_end_date
    ORDER BY local_date DESC 
    LIMIT 10
  LOOP
    RAISE NOTICE '   Date: %, Mood: %, Pain: %, Sleep: %, Tags: %', 
      v_sample_entry.local_date, 
      v_sample_entry.mood, 
      v_sample_entry.pain, 
      v_sample_entry.sleep_quality,
      v_sample_entry.tags;
  END LOOP;

  -- Step 8: Check if there are any entries with non-null values
  SELECT COUNT(*) INTO v_entries_count
  FROM daily_entries 
  WHERE user_id = v_emma_user_id 
    AND (mood IS NOT NULL OR pain IS NOT NULL OR sleep_quality IS NOT NULL);

  RAISE NOTICE '📊 Entries with non-null mood/pain/sleep: %', v_entries_count;

  -- Step 9: Check the exact query that getPublicMoodData uses
  RAISE NOTICE '🔍 Testing exact getPublicMoodData query:';
  FOR v_sample_entry IN 
    SELECT local_date, mood, pain, sleep_quality, tags, journal
    FROM daily_entries 
    WHERE user_id = v_emma_user_id 
      AND local_date >= v_start_date 
      AND local_date <= v_end_date
    ORDER BY local_date
    LIMIT 5
  LOOP
    RAISE NOTICE '   Date: %, Mood: %, Pain: %, Sleep: %, Tags: %, Journal: %', 
      v_sample_entry.local_date, 
      v_sample_entry.mood, 
      v_sample_entry.pain, 
      v_sample_entry.sleep_quality,
      v_sample_entry.tags,
      LEFT(COALESCE(v_sample_entry.journal, ''), 30);
  END LOOP;

  RAISE NOTICE '=== DIAGNOSTIC COMPLETE ===';

END $$;
