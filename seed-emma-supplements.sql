-- Add supplement data to Emma's daily entries
-- This will populate meds, protocols, activity, and devices for all days

DO $$
DECLARE
  v_emma_user_id UUID;
  v_entry RECORD;
  v_supplements TEXT[];
  v_protocols TEXT[];
  v_activities TEXT[];
  v_devices TEXT[];
  v_day_offset INTEGER;
BEGIN
  -- Get Emma's user_id
  SELECT user_id INTO v_emma_user_id 
  FROM profiles 
  WHERE slug = 'emma-chronic-pain-journey';

  IF v_emma_user_id IS NULL THEN
    RAISE EXCEPTION 'Emma profile not found. Run seed-emma-v2.sql first.';
  END IF;

  RAISE NOTICE 'Found Emma user_id: %', v_emma_user_id;

  -- Update each daily entry with supplement data
  FOR v_entry IN 
    SELECT local_date, mood, pain, sleep_quality
    FROM daily_entries 
    WHERE user_id = v_emma_user_id 
    ORDER BY local_date
  LOOP
    -- Calculate day offset from start
    v_day_offset := EXTRACT(DAY FROM v_entry.local_date - '2025-09-10'::date);
    
    -- Define supplements based on day and condition
    IF v_day_offset <= 20 THEN
      -- Early days - basic supplements
      v_supplements := ARRAY['Magnesium 400mg', 'Vitamin D3 2000IU', 'Omega-3 1000mg'];
      v_protocols := ARRAY['Heat therapy', 'Gentle stretching'];
      v_activities := ARRAY['Walking 10min', 'Yoga 15min'];
      v_devices := ARRAY['Heating pad', 'Oura Ring'];
    ELSIF v_day_offset <= 40 THEN
      -- Middle period - added LDN
      v_supplements := ARRAY['LDN 4.5mg', 'Magnesium 400mg', 'Vitamin D3 2000IU', 'Omega-3 1000mg', 'B12 1000mcg'];
      v_protocols := ARRAY['LDN protocol', 'Heat therapy', 'Gentle stretching', 'Meditation 10min'];
      v_activities := ARRAY['Walking 15min', 'Yoga 20min', 'Swimming 30min'];
      v_devices := ARRAY['Heating pad', 'Oura Ring', 'Massage gun'];
    ELSE
      -- Recent days - full stack
      v_supplements := ARRAY['LDN 4.5mg', 'Magnesium 400mg', 'Vitamin D3 2000IU', 'Omega-3 1000mg', 'B12 1000mcg', 'Curcumin 500mg', 'CoQ10 200mg'];
      v_protocols := ARRAY['LDN protocol', 'Heat therapy', 'Gentle stretching', 'Meditation 15min', 'Breathing exercises'];
      v_activities := ARRAY['Walking 20min', 'Yoga 25min', 'Swimming 45min', 'Physical therapy'];
      v_devices := ARRAY['Heating pad', 'Oura Ring', 'Massage gun', 'TENS unit'];
    END IF;

    -- Update the daily entry
    UPDATE daily_entries 
    SET 
      meds = v_supplements,
      protocols = v_protocols,
      activity = v_activities,
      devices = v_devices
    WHERE user_id = v_emma_user_id 
    AND local_date = v_entry.local_date;

    RAISE NOTICE 'Updated day % with % supplements, % protocols', v_entry.local_date, array_length(v_supplements, 1), array_length(v_protocols, 1);
  END LOOP;

  RAISE NOTICE '✅ Added supplement data to all Emma daily entries';
  
END $$;
