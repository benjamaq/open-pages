-- Final cleanup and rebuild for Emma's data
-- This will ensure we have ONE consistent dataset

DO $$
DECLARE
    v_emma_user_id UUID;
    v_emma_profile_id UUID;
    v_day_offset INTEGER;
    v_date DATE;
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
    
    -- COMPLETE WIPE - Remove ALL existing data
    DELETE FROM daily_entries WHERE user_id = v_emma_user_id;
    DELETE FROM journal_entries WHERE profile_id = (SELECT id FROM profiles WHERE user_id = v_emma_user_id);
    DELETE FROM stack_followers WHERE owner_user_id = v_emma_user_id;
    DELETE FROM stack_items WHERE profile_id = (SELECT id FROM profiles WHERE user_id = v_emma_user_id);
    
    RAISE NOTICE 'Wiped all existing data';
    
    -- Rebuild with EXACT progression: Sept 1-24 (red), Sept 25-30 (yellow/green), Oct 1-9 (dark green)
    
    -- September 1-9: Red/Orange colors (pain 7-9, mood 2-4)
    v_date := '2025-09-01';
    FOR v_day_offset IN 0..8 LOOP
        INSERT INTO daily_entries (
            user_id, local_date, mood, sleep_quality, pain, sleep_hours, night_wakes,
            tags, journal, meds, protocols, activity, devices, wearables
        ) VALUES (
            v_emma_user_id,
            v_date + v_day_offset,
            CASE v_day_offset % 3
                WHEN 0 THEN 2
                WHEN 1 THEN 3
                ELSE 4
            END,
            CASE v_day_offset % 3
                WHEN 0 THEN 3
                WHEN 1 THEN 4
                ELSE 5
            END,
            CASE v_day_offset % 3
                WHEN 0 THEN 9
                WHEN 1 THEN 8
                ELSE 7
            END,
            5 + (v_day_offset % 3),
            CASE v_day_offset % 2
                WHEN 0 THEN 3
                ELSE 2
            END,
            ARRAY['terrible', 'exhausted', 'desperate'],
            'Worst pain in months. ' || (CASE v_day_offset % 3
                WHEN 0 THEN 'Pain 9/10. Need help.'
                WHEN 1 THEN 'Pain 8/10. Desperate.'
                ELSE 'Pain 7/10. Exhausted.'
            END),
            '["Basic pain meds"]'::jsonb,
            '["Rest", "Heat therapy"]'::jsonb,
            '["Minimal movement"]'::jsonb,
            '["Heating pad"]'::jsonb,
            '{"score": 2, "device": "Manual tracking"}'::jsonb
        );
    END LOOP;
    
    -- September 10-24: Continued red/orange (pain 7-9, mood 2-4)
    FOR v_day_offset IN 9..23 LOOP
        INSERT INTO daily_entries (
            user_id, local_date, mood, sleep_quality, pain, sleep_hours, night_wakes,
            tags, journal, meds, protocols, activity, devices, wearables
        ) VALUES (
            v_emma_user_id,
            v_date + v_day_offset,
            CASE v_day_offset % 3
                WHEN 0 THEN 2
                WHEN 1 THEN 3
                ELSE 4
            END,
            CASE v_day_offset % 3
                WHEN 0 THEN 3
                WHEN 1 THEN 4
                ELSE 5
            END,
            CASE v_day_offset % 3
                WHEN 0 THEN 9
                WHEN 1 THEN 8
                ELSE 7
            END,
            5 + (v_day_offset % 3),
            CASE v_day_offset % 2
                WHEN 0 THEN 3
                ELSE 2
            END,
            ARRAY['struggling', 'exhausted', 'frustrated'],
            'Still struggling. ' || (CASE v_day_offset % 3
                WHEN 0 THEN 'Pain 9/10. Need breakthrough.'
                WHEN 1 THEN 'Pain 8/10. Desperate for relief.'
                ELSE 'Pain 7/10. Exhausted.'
            END),
            '["LDN 1.5mg", "Magnesium"]'::jsonb,
            '["Heat therapy", "Rest"]'::jsonb,
            '["Walking 5min"]'::jsonb,
            '["Heating pad", "Massage gun"]'::jsonb,
            '{"score": 3, "device": "Oura Ring"}'::jsonb
        );
    END LOOP;
    
    -- September 25-30: Yellow/Green transition (pain 3-6, mood 5-8)
    FOR v_day_offset IN 24..29 LOOP
        INSERT INTO daily_entries (
            user_id, local_date, mood, sleep_quality, pain, sleep_hours, night_wakes,
            tags, journal, meds, protocols, activity, devices, wearables
        ) VALUES (
            v_emma_user_id,
            v_date + v_day_offset,
            CASE v_day_offset % 3
                WHEN 0 THEN 5
                WHEN 1 THEN 6
                ELSE 7
            END,
            CASE v_day_offset % 3
                WHEN 0 THEN 5
                WHEN 1 THEN 6
                ELSE 7
            END,
            CASE v_day_offset % 3
                WHEN 0 THEN 6
                WHEN 1 THEN 5
                ELSE 4
            END,
            6 + (v_day_offset % 2),
            CASE v_day_offset % 2
                WHEN 0 THEN 2
                ELSE 1
            END,
            ARRAY['hopeful', 'improving', 'better'],
            'Something is changing. ' || (CASE v_day_offset % 3
                WHEN 0 THEN 'Pain 6/10. Is this working?'
                WHEN 1 THEN 'Pain 5/10. Could this be it?'
                ELSE 'Pain 4/10. This is amazing!'
            END),
            '["LDN 3mg", "Magnesium", "Vitamin D3"]'::jsonb,
            '["LDN protocol", "Heat therapy", "Gentle stretching"]'::jsonb,
            '["Walking 15min", "Yoga 10min"]'::jsonb,
            '["Heating pad", "Oura Ring", "Massage gun"]'::jsonb,
            '{"score": 6, "device": "Oura Ring"}'::jsonb
        );
    END LOOP;
    
    -- October 1-9: Dark green colors (pain 2-4, mood 7-9)
    v_date := '2025-10-01';
    FOR v_day_offset IN 0..8 LOOP
        INSERT INTO daily_entries (
            user_id, local_date, mood, sleep_quality, pain, sleep_hours, night_wakes,
            tags, journal, meds, protocols, activity, devices, wearables
        ) VALUES (
            v_emma_user_id,
            v_date + v_day_offset,
            CASE v_day_offset % 3
                WHEN 0 THEN 7
                WHEN 1 THEN 8
                ELSE 9
            END,
            CASE v_day_offset % 3
                WHEN 0 THEN 7
                WHEN 1 THEN 8
                ELSE 9
            END,
            CASE v_day_offset % 3
                WHEN 0 THEN 4
                WHEN 1 THEN 3
                ELSE 2
            END,
            6 + (v_day_offset % 3),
            CASE v_day_offset % 2
                WHEN 0 THEN 2
                ELSE 1
            END,
            ARRAY['amazing', 'grateful', 'transformed'],
            'Life-changing improvement! ' || (CASE v_day_offset % 3
                WHEN 0 THEN 'Pain 4/10. So much better!'
                WHEN 1 THEN 'Pain 3/10. This is incredible!'
                ELSE 'Pain 2/10. Best day in years!'
            END),
            '["LDN 4.5mg", "Magnesium 400mg", "Vitamin D3 2000IU", "Omega-3 1000mg", "B12 1000mcg"]'::jsonb,
            '["LDN protocol", "Heat therapy", "Gentle stretching", "Meditation 10min"]'::jsonb,
            '["Walking 15min", "Yoga 20min", "Swimming 30min"]'::jsonb,
            '["Heating pad", "Oura Ring", "Massage gun"]'::jsonb,
            '{"score": 8, "device": "Oura Ring"}'::jsonb
        );
    END LOOP;
    
    RAISE NOTICE 'Successfully created 39 days of data with exact color progression';
    RAISE NOTICE 'Sept 1-24: Red/orange (pain 7-9, mood 2-4)';
    RAISE NOTICE 'Sept 25-30: Yellow/green (pain 3-6, mood 5-8)';
    RAISE NOTICE 'Oct 1-9: Dark green (pain 2-4, mood 7-9)';
    
END $$;
