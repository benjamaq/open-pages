-- Add missing dates from September 30th to today with green colors
-- This will extend Emma's recovery journey into October

DO $$
DECLARE
    v_emma_user_id UUID;
    v_date DATE;
    v_mood INT;
    v_pain INT;
    v_sleep_quality INT;
    v_journal TEXT;
BEGIN
    -- Get Emma's user_id
    SELECT user_id INTO v_emma_user_id 
    FROM profiles 
    WHERE slug = 'emma-chronic-pain-journey';
    
    IF v_emma_user_id IS NULL THEN
        RAISE NOTICE 'Emma profile not found';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Found Emma user_id: %', v_emma_user_id;
    
    -- Start from September 30th and go to today
    v_date := '2025-09-30'::DATE;
    
    WHILE v_date <= CURRENT_DATE LOOP
        -- Set green colors (good recovery)
        v_mood := 8;
        v_pain := 2;
        v_sleep_quality := 8;
        
        -- Create journal entry based on date
        IF v_date = '2025-09-30' THEN
            v_journal := 'End of September - still feeling great! Pain 2/10. Recovery continuing.';
        ELSIF v_date = '2025-10-01' THEN
            v_journal := 'October 1st - new month, still amazing! Pain 2/10. This is incredible.';
        ELSIF v_date = '2025-10-02' THEN
            v_journal := 'Another fantastic day in October! Pain 2/10. Life is good.';
        ELSIF v_date = '2025-10-03' THEN
            v_journal := 'Perfect day! Pain 2/10. Recovery is stable and strong.';
        ELSIF v_date = '2025-10-04' THEN
            v_journal := 'Still amazing! Pain 2/10. Grateful for this improvement.';
        ELSIF v_date = '2025-10-05' THEN
            v_journal := 'Outstanding day! Pain 2/10. This treatment is life-changing.';
        ELSIF v_date = '2025-10-06' THEN
            v_journal := 'Incredible day! Pain 2/10. So blessed with this recovery.';
        ELSIF v_date = '2025-10-07' THEN
            v_journal := 'Fantastic day! Pain 2/10. Still going strong.';
        ELSIF v_date = '2025-10-08' THEN
            v_journal := 'Perfect day! Pain 2/10. This is amazing.';
        ELSIF v_date = '2025-10-09' THEN
            v_journal := 'Great day with varied colors! Pain 3/10, mood 7/10. Whoop showing excellent recovery and sleep scores.';
            -- Make today slightly different as requested
            v_mood := 7;
            v_pain := 3;
            v_sleep_quality := 8;
        ELSE
            v_journal := 'Another great day! Pain 2/10. Recovery continues to be stable.';
        END IF;
        
        -- Insert or update the daily entry
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
            meds, 
            protocols, 
            activity, 
            devices, 
            wearables
        ) VALUES (
            v_emma_user_id,
            v_date,
            v_mood,
            v_sleep_quality,
            v_pain,
            8, -- sleep_hours
            1, -- night_wakes
            ARRAY['great day', 'recovery', 'stable'],
            v_journal,
            '["LDN 4.5mg", "Magnesium 400mg", "Vitamin D3 2000IU", "Omega-3 1000mg", "B12 1000mcg"]'::jsonb,
            '["LDN protocol", "Heat therapy", "Gentle stretching", "Meditation 10min"]'::jsonb,
            '["Walking 20min", "Yoga 25min", "Swimming 30min"]'::jsonb,
            '["Heating pad", "Oura Ring", "Massage gun", "Whoop"]'::jsonb,
            CASE 
                WHEN v_date = '2025-10-09' THEN '{"score": 8, "device": "Oura Ring", "whoop": {"recovery_score": 85, "sleep_score": 92, "strain_score": 12, "device": "Whoop"}}'::jsonb
                ELSE '{"score": 8, "device": "Oura Ring", "recovery_score": 85, "sleep_score": 92}'::jsonb
            END
        ) ON CONFLICT (user_id, local_date) DO UPDATE SET
            mood = EXCLUDED.mood,
            sleep_quality = EXCLUDED.sleep_quality,
            pain = EXCLUDED.pain,
            sleep_hours = EXCLUDED.sleep_hours,
            night_wakes = EXCLUDED.night_wakes,
            tags = EXCLUDED.tags,
            journal = EXCLUDED.journal,
            meds = EXCLUDED.meds,
            protocols = EXCLUDED.protocols,
            activity = EXCLUDED.activity,
            devices = EXCLUDED.devices,
            wearables = EXCLUDED.wearables;
        
        RAISE NOTICE 'Added/updated entry for %: mood=%, pain=%, sleep=%', v_date, v_mood, v_pain, v_sleep_quality;
        
        -- Move to next day
        v_date := v_date + INTERVAL '1 day';
    END LOOP;
    
    RAISE NOTICE 'Successfully added/updated entries from September 30th to today with green colors';
    
END $$;







