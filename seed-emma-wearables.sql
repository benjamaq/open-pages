-- Add wearable data to Emma's daily entries
-- This adds Oura Ring scores and device info to existing daily entries

DO $$
DECLARE
  v_emma_user_id UUID;
  v_entry RECORD;
  v_wearable_score INTEGER;
  v_wearable_device TEXT := 'Oura Ring';
  v_heart_rate_variability DECIMAL;
  v_resting_heart_rate INTEGER;
  v_steps INTEGER;
  v_calories_burned INTEGER;
  v_active_minutes INTEGER;
BEGIN
  -- Get Emma's user ID
  SELECT user_id INTO v_emma_user_id 
  FROM profiles 
  WHERE slug = 'emma-chronic-pain-journey';

  IF v_emma_user_id IS NULL THEN
    RAISE EXCEPTION 'Emma profile not found. Run seed-emma-v2.sql first.';
  END IF;

  RAISE NOTICE 'Adding wearable data to Emma''s daily entries...';

  -- Update each daily entry with wearable data
  FOR v_entry IN 
    SELECT local_date, mood, pain, sleep_quality 
    FROM daily_entries 
    WHERE user_id = v_emma_user_id 
    ORDER BY local_date
  LOOP
    -- Calculate wearable score based on mood, pain, and sleep
    v_wearable_score := LEAST(10, GREATEST(1, 
      (v_entry.mood + v_entry.sleep_quality + (10 - v_entry.pain)) / 3
    ))::INTEGER;

    -- Generate realistic Oura Ring metrics
    v_heart_rate_variability := 25 + (random() * 15);  -- 25-40ms
    v_resting_heart_rate := 55 + (random() * 15);  -- 55-70 bpm
    v_steps := CASE 
      WHEN v_entry.pain > 6 THEN 2000 + (random() * 3000)::INTEGER  -- Low activity on high pain days
      WHEN v_entry.pain > 4 THEN 4000 + (random() * 4000)::INTEGER  -- Medium activity
      ELSE 6000 + (random() * 4000)::INTEGER  -- Higher activity on good days
    END;
    v_calories_burned := 1200 + (v_steps * 0.05)::INTEGER;
    v_active_minutes := CASE 
      WHEN v_entry.pain > 6 THEN 10 + (random() * 20)::INTEGER
      WHEN v_entry.pain > 4 THEN 20 + (random() * 30)::INTEGER
      ELSE 30 + (random() * 40)::INTEGER
    END;

    -- Update the daily entry with wearable data
    UPDATE daily_entries 
    SET 
      wearables = jsonb_build_object(
        'device', v_wearable_device,
        'score', v_wearable_score,
        'hrv', v_heart_rate_variability,
        'resting_hr', v_resting_heart_rate,
        'steps', v_steps,
        'calories', v_calories_burned,
        'active_minutes', v_active_minutes,
        'recovery_score', v_wearable_score,
        'sleep_score', v_entry.sleep_quality,
        'activity_score', LEAST(10, GREATEST(1, v_steps / 1000))
      )
    WHERE user_id = v_emma_user_id AND local_date = v_entry.local_date;

  END LOOP;

  RAISE NOTICE '✅ Added Oura Ring data to all daily entries';
  RAISE NOTICE '📊 Wearable scores correlate with pain levels and mood';
  
END $$;
