-- Simple direct insert of Emma's mood data
-- This bypasses complex logic and directly inserts realistic data

-- First, get Emma's user_id
DO $$
DECLARE
  v_emma_user_id UUID;
  v_current_date DATE;
  v_mood INTEGER;
  v_pain INTEGER;
  v_sleep INTEGER;
  v_sleep_hours INTEGER;
  v_night_wakes INTEGER;
  v_tags TEXT[];
  v_journal TEXT;
  v_day_offset INTEGER;
BEGIN
  -- Get Emma's user_id
  SELECT user_id INTO v_emma_user_id 
  FROM profiles 
  WHERE slug = 'emma-chronic-pain-journey';

  IF v_emma_user_id IS NULL THEN
    RAISE EXCEPTION 'Emma profile not found. Run seed-emma-v2.sql first.';
  END IF;

  RAISE NOTICE 'Emma user_id: %', v_emma_user_id;

  -- Clear existing data first
  DELETE FROM daily_entries WHERE user_id = v_emma_user_id;
  RAISE NOTICE 'Cleared existing daily entries for Emma';

  -- Insert 30 days of data (last 30 days)
  FOR v_day_offset IN 0..29 LOOP
    v_current_date := CURRENT_DATE - v_day_offset;
    
    -- Create realistic patterns
    -- Early days (older): worse pain, poor sleep
    -- Recent days: better pain, good sleep (LDN working)
    
    IF v_day_offset < 10 THEN
      -- Recent days (0-9): LDN working well
      v_mood := 6 + (random() * 3)::INTEGER;  -- 6-8
      v_pain := 2 + (random() * 3)::INTEGER;  -- 2-4
      v_sleep := 6 + (random() * 3)::INTEGER;  -- 6-8
      v_sleep_hours := 7 + (random() * 2)::INTEGER;  -- 7-8
      v_night_wakes := 0 + (random() * 2)::INTEGER;  -- 0-1
      v_tags := ARRAY['energized', 'grateful', 'confident'];
      v_journal := 'Great day! LDN is working wonders. Pain at ' || v_pain || '/10.';
      
    ELSIF v_day_offset < 20 THEN
      -- Middle days (10-19): LDN starting to work
      v_mood := 4 + (random() * 3)::INTEGER;  -- 4-6
      v_pain := 4 + (random() * 3)::INTEGER;  -- 4-6
      v_sleep := 5 + (random() * 2)::INTEGER;  -- 5-6
      v_sleep_hours := 6 + (random() * 2)::INTEGER;  -- 6-7
      v_night_wakes := 1 + (random() * 2)::INTEGER;  -- 1-2
      v_tags := ARRAY['hopeful', 'tired', 'determined'];
      v_journal := 'LDN week ' || ((v_day_offset - 10) / 7 + 1) || '. Some improvement.';
      
    ELSE
      -- Early days (20-29): Before LDN, high pain
      v_mood := 2 + (random() * 3)::INTEGER;  -- 2-4
      v_pain := 6 + (random() * 3)::INTEGER;  -- 6-8
      v_sleep := 3 + (random() * 2)::INTEGER;  -- 3-4
      v_sleep_hours := 5 + (random() * 2)::INTEGER;  -- 5-6
      v_night_wakes := 2 + (random() * 2)::INTEGER;  -- 2-3
      v_tags := ARRAY['exhausted', 'frustrated', 'overwhelmed'];
      v_journal := 'Rough day. Pain at ' || v_pain || '/10. Need relief.';
    END IF;

    -- Insert the daily entry
    INSERT INTO daily_entries (
      user_id,
      local_date,
      mood,
      sleep_quality,
      pain,
      sleep_hours,
      night_wakes,
      tags,
      journal,
      created_at
    ) VALUES (
      v_emma_user_id,
      v_current_date,
      v_mood,
      v_sleep,
      v_pain,
      v_sleep_hours,
      v_night_wakes,
      v_tags,
      v_journal,
      NOW() - (v_day_offset || ' days')::INTERVAL
    );

  END LOOP;

  RAISE NOTICE '✅ Inserted 30 days of mood data for Emma';
  RAISE NOTICE '📊 Pattern: Recent days (low pain) → Older days (high pain)';
  RAISE NOTICE '💊 Shows LDN effectiveness over time';

END $$;
