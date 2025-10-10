-- Add 8 weeks of realistic mood data for Emma's chronic pain journey
-- This creates a realistic pattern showing good days, bad days, and gradual improvement

DO $$
DECLARE
  v_emma_user_id UUID;
  v_current_date DATE := CURRENT_DATE;
  v_start_date DATE;
  v_day_offset INTEGER;
  v_mood INTEGER;
  v_sleep INTEGER;
  v_pain INTEGER;
  v_sleep_hours INTEGER;
  v_night_wakes INTEGER;
  v_tags TEXT[];
  v_journal TEXT;
  v_wearable_score INTEGER;
  v_wearable_device TEXT;
BEGIN
  -- Get Emma's user ID
  SELECT user_id INTO v_emma_user_id 
  FROM profiles 
  WHERE slug = 'emma-chronic-pain-journey';

  IF v_emma_user_id IS NULL THEN
    RAISE EXCEPTION 'Emma profile not found. Run seed-emma-v2.sql first.';
  END IF;

  -- Start 8 weeks ago
  v_start_date := v_current_date - INTERVAL '8 weeks';

  RAISE NOTICE 'Creating 8 weeks of mood data starting from %', v_start_date;

  -- Generate 56 days of data (8 weeks)
  FOR v_day_offset IN 0..55 LOOP
    v_current_date := v_start_date + (v_day_offset || ' days')::INTERVAL;
    
    -- Skip if entry already exists
    IF EXISTS (SELECT 1 FROM daily_entries WHERE user_id = v_emma_user_id AND local_date = v_current_date) THEN
      CONTINUE;
    END IF;

    -- Create realistic patterns based on day of week and progression
    -- Early weeks: More bad days, higher pain
    -- Later weeks: More good days, lower pain (LDN effect)
    
    IF v_day_offset < 14 THEN
      -- Weeks 1-2: Bad period, high pain, poor sleep
      v_mood := CASE 
        WHEN v_day_offset % 7 IN (0,6) THEN 3 + (random() * 2)::INTEGER  -- Weekends slightly better
        ELSE 2 + (random() * 3)::INTEGER  -- Weekdays worse
      END;
      
      v_pain := CASE 
        WHEN v_day_offset % 7 IN (0,6) THEN 6 + (random() * 2)::INTEGER  -- Weekends 6-7
        ELSE 7 + (random() * 2)::INTEGER  -- Weekdays 7-8
      END;
      
      v_sleep := CASE 
        WHEN v_day_offset % 7 IN (0,6) THEN 4 + (random() * 2)::INTEGER  -- Weekends 4-5
        ELSE 3 + (random() * 2)::INTEGER  -- Weekdays 3-4
      END;
      
      v_sleep_hours := 5 + (random() * 2)::INTEGER;  -- 5-6 hours
      v_night_wakes := 2 + (random() * 2)::INTEGER;  -- 2-3 wakes
      
      v_tags := ARRAY['exhausted', 'frustrated', 'overwhelmed'];
      v_journal := 'Rough day. Pain is constant and sleep is terrible.';
      v_wearable_score := 2 + (random() * 2)::INTEGER;  -- 2-3
      v_wearable_device := 'Oura Ring';
      
    ELSIF v_day_offset < 28 THEN
      -- Weeks 3-4: Starting LDN, some improvement
      v_mood := CASE 
        WHEN v_day_offset % 7 IN (0,6) THEN 4 + (random() * 2)::INTEGER  -- Weekends 4-5
        ELSE 3 + (random() * 2)::INTEGER  -- Weekdays 3-4
      END;
      
      v_pain := CASE 
        WHEN v_day_offset % 7 IN (0,6) THEN 5 + (random() * 2)::INTEGER  -- Weekends 5-6
        ELSE 6 + (random() * 2)::INTEGER  -- Weekdays 6-7
      END;
      
      v_sleep := CASE 
        WHEN v_day_offset % 7 IN (0,6) THEN 5 + (random() * 2)::INTEGER  -- Weekends 5-6
        ELSE 4 + (random() * 2)::INTEGER  -- Weekdays 4-5
      END;
      
      v_sleep_hours := 6 + (random() * 1.5)::INTEGER;  -- 6-7 hours
      v_night_wakes := 1 + (random() * 2)::INTEGER;  -- 1-2 wakes
      
      v_tags := ARRAY['cautiously optimistic', 'tired', 'hopeful'];
      v_journal := 'LDN week ' || ((v_day_offset - 14) / 7 + 1) || '. Some days feel slightly better.';
      v_wearable_score := 3 + (random() * 2)::INTEGER;  -- 3-4
      v_wearable_device := 'Oura Ring';
      
    ELSIF v_day_offset < 42 THEN
      -- Weeks 5-6: LDN working, more good days
      v_mood := CASE 
        WHEN v_day_offset % 7 IN (0,6) THEN 6 + (random() * 2)::INTEGER  -- Weekends 6-7
        WHEN random() < 0.3 THEN 7 + (random() * 2)::INTEGER  -- 30% chance of great day
        ELSE 4 + (random() * 2)::INTEGER  -- Weekdays 4-5
      END;
      
      v_pain := CASE 
        WHEN v_day_offset % 7 IN (0,6) THEN 3 + (random() * 2)::INTEGER  -- Weekends 3-4
        WHEN random() < 0.3 THEN 2 + (random() * 2)::INTEGER  -- 30% chance of low pain
        ELSE 4 + (random() * 2)::INTEGER  -- Weekdays 4-5
      END;
      
      v_sleep := CASE 
        WHEN v_day_offset % 7 IN (0,6) THEN 6 + (random() * 2)::INTEGER  -- Weekends 6-7
        ELSE 5 + (random() * 2)::INTEGER  -- Weekdays 5-6
      END;
      
      v_sleep_hours := 7 + (random() * 1)::INTEGER;  -- 7-8 hours
      v_night_wakes := 0 + (random() * 2)::INTEGER;  -- 0-1 wakes
      
      v_tags := ARRAY['grateful', 'hopeful', 'determined'];
      v_journal := 'LDN is working! Pain down to ' || v_pain || '/10 today.';
      v_wearable_score := 4 + (random() * 2)::INTEGER;  -- 4-5
      v_wearable_device := 'Oura Ring';
      
    ELSE
      -- Weeks 7-8: Best period, LDN fully effective
      v_mood := CASE 
        WHEN v_day_offset % 7 IN (0,6) THEN 7 + (random() * 2)::INTEGER  -- Weekends 7-8
        WHEN random() < 0.4 THEN 8 + (random() * 2)::INTEGER  -- 40% chance of great day
        ELSE 5 + (random() * 2)::INTEGER  -- Weekdays 5-6
      END;
      
      v_pain := CASE 
        WHEN v_day_offset % 7 IN (0,6) THEN 2 + (random() * 2)::INTEGER  -- Weekends 2-3
        WHEN random() < 0.4 THEN 1 + (random() * 2)::INTEGER  -- 40% chance of very low pain
        ELSE 3 + (random() * 2)::INTEGER  -- Weekdays 3-4
      END;
      
      v_sleep := CASE 
        WHEN v_day_offset % 7 IN (0,6) THEN 7 + (random() * 2)::INTEGER  -- Weekends 7-8
        ELSE 6 + (random() * 2)::INTEGER  -- Weekdays 6-7
      END;
      
      v_sleep_hours := 8 + (random() * 1)::INTEGER;  -- 8-9 hours
      v_night_wakes := 0 + (random() * 1)::INTEGER;  -- 0-1 wakes
      
      v_tags := ARRAY['energized', 'grateful', 'confident'];
      v_journal := 'Amazing day! Pain at ' || v_pain || '/10. LDN has been life-changing.';
      v_wearable_score := 5 + (random() * 2)::INTEGER;  -- 5-6
      v_wearable_device := 'Oura Ring';
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
      NOW() - (56 - v_day_offset) || ' days'::INTERVAL
    );

  END LOOP;

  RAISE NOTICE '✅ Created 8 weeks of realistic mood data for Emma';
  RAISE NOTICE '📊 Pattern: Early weeks (high pain, poor sleep) → Later weeks (low pain, good sleep)';
  RAISE NOTICE '💊 Shows LDN effectiveness over time';
  
END $$;
