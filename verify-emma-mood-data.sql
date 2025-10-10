-- Verify Emma's mood data was inserted correctly

DO $$
DECLARE
  v_emma_user_id UUID;
  v_entry_count INTEGER;
  v_sample_entries RECORD;
BEGIN
  -- Get Emma's user ID
  SELECT user_id INTO v_emma_user_id 
  FROM profiles 
  WHERE slug = 'emma-chronic-pain-journey';

  IF v_emma_user_id IS NULL THEN
    RAISE EXCEPTION 'Emma profile not found.';
  END IF;

  -- Count total entries
  SELECT COUNT(*) INTO v_entry_count
  FROM daily_entries 
  WHERE user_id = v_emma_user_id;

  RAISE NOTICE 'Emma user_id: %', v_emma_user_id;
  RAISE NOTICE 'Total daily entries: %', v_entry_count;

  -- Show sample entries
  RAISE NOTICE 'Sample entries:';
  FOR v_sample_entries IN 
    SELECT local_date, mood, pain, sleep_quality, tags, journal
    FROM daily_entries 
    WHERE user_id = v_emma_user_id 
    ORDER BY local_date DESC 
    LIMIT 5
  LOOP
    RAISE NOTICE 'Date: %, Mood: %, Pain: %, Sleep: %, Tags: %, Journal: %', 
      v_sample_entries.local_date, 
      v_sample_entries.mood, 
      v_sample_entries.pain, 
      v_sample_entries.sleep_quality,
      v_sample_entries.tags,
      LEFT(v_sample_entries.journal, 50);
  END LOOP;

  -- Check date range
  SELECT 
    MIN(local_date) as earliest_date,
    MAX(local_date) as latest_date
  INTO v_sample_entries
  FROM daily_entries 
  WHERE user_id = v_emma_user_id;

  RAISE NOTICE 'Date range: % to %', v_sample_entries.earliest_date, v_sample_entries.latest_date;

END $$;
