-- Complete Emma Demo Account Setup - DEFINITIVE VERSION
-- This creates a chronic pain recovery journey with proper color progression

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
        RAISE NOTICE 'Emma profile not found. Create the profile first.';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Found Emma user_id: %', v_emma_user_id;
    
    -- COMPLETE WIPE - Remove ALL existing data for clean slate
    DELETE FROM daily_entries WHERE user_id = v_emma_user_id;
    DELETE FROM journal_entries WHERE profile_id = (SELECT id FROM profiles WHERE user_id = v_emma_user_id);
    DELETE FROM stack_followers WHERE owner_user_id = v_emma_user_id;
    DELETE FROM stack_items WHERE profile_id = (SELECT id FROM profiles WHERE user_id = v_emma_user_id);
    
    RAISE NOTICE 'Wiped all existing Emma data';
    
    -- ============================================
    -- SEPTEMBER 1-24: RED/ORANGE (High Pain Period)
    -- ============================================
    v_date := '2025-09-01';
    FOR v_day_offset IN 0..23 LOOP
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
            'High pain day. ' || (CASE v_day_offset % 3
                WHEN 0 THEN 'Pain 9/10. Desperate for relief.'
                WHEN 1 THEN 'Pain 8/10. Exhausted from chronic pain.'
                ELSE 'Pain 7/10. Struggling to function.'
            END),
            '["Ibuprofen 800mg", "Tylenol"]'::jsonb,
            '["Rest", "Heat therapy"]'::jsonb,
            '["Minimal movement"]'::jsonb,
            '["Heating pad"]'::jsonb,
            '{"score": 3, "device": "Manual tracking"}'::jsonb
        );
    END LOOP;
    
    -- ============================================
    -- SEPTEMBER 25-29: YELLOW (Improvement Phase)
    -- ============================================
    FOR v_day_offset IN 24..28 LOOP
        INSERT INTO daily_entries (
            user_id, local_date, mood, sleep_quality, pain, sleep_hours, night_wakes,
            tags, journal, meds, protocols, activity, devices, wearables
        ) VALUES (
            v_emma_user_id,
            v_date + v_day_offset,
            CASE (v_day_offset - 24) % 3
                WHEN 0 THEN 5
                WHEN 1 THEN 6
                ELSE 7
            END,
            CASE (v_day_offset - 24) % 3
                WHEN 0 THEN 6
                WHEN 1 THEN 7
                ELSE 7
            END,
            CASE (v_day_offset - 24) % 3
                WHEN 0 THEN 6
                WHEN 1 THEN 5
                ELSE 4
            END,
            6 + ((v_day_offset - 24) % 2),
            CASE (v_day_offset - 24) % 2
                WHEN 0 THEN 2
                ELSE 1
            END,
            ARRAY['hopeful', 'improving', 'better'],
            'Something is changing! ' || (CASE (v_day_offset - 24) % 3
                WHEN 0 THEN 'Pain 6/10. Is this working?'
                WHEN 1 THEN 'Pain 5/10. Feeling hopeful!'
                ELSE 'Pain 4/10. This is real progress!'
            END),
            '["LDN 3mg", "Magnesium 400mg", "Vitamin D3 2000IU"]'::jsonb,
            '["LDN protocol", "Gentle stretching", "Heat therapy"]'::jsonb,
            '["Walking 15min", "Yoga 10min"]'::jsonb,
            '["Heating pad", "Oura Ring"]'::jsonb,
            '{"score": 6, "device": "Oura Ring"}'::jsonb
        );
    END LOOP;
    
    -- ============================================
    -- SEPTEMBER 30 - OCTOBER 9: GREEN (Recovery Phase)
    -- ============================================
    v_date := '2025-09-30';
    FOR v_day_offset IN 0..9 LOOP
        INSERT INTO daily_entries (
            user_id, local_date, mood, sleep_quality, pain, sleep_hours, night_wakes,
            tags, journal, meds, protocols, activity, devices, wearables
        ) VALUES (
            v_emma_user_id,
            v_date + v_day_offset,
            CASE v_day_offset % 3
                WHEN 0 THEN 8
                WHEN 1 THEN 8
                ELSE 9
            END,
            CASE v_day_offset % 3
                WHEN 0 THEN 8
                WHEN 1 THEN 8
                ELSE 9
            END,
            CASE v_day_offset % 3
                WHEN 0 THEN 2
                WHEN 1 THEN 2
                ELSE 3
            END,
            7 + (v_day_offset % 2),
            CASE v_day_offset % 2
                WHEN 0 THEN 1
                ELSE 0
            END,
            ARRAY['amazing', 'grateful', 'transformed'],
            'Life-changing improvement! ' || (CASE v_day_offset % 3
                WHEN 0 THEN 'Pain 2/10. Best day in months!'
                WHEN 1 THEN 'Pain 2/10. This is incredible!'
                ELSE 'Pain 3/10. Still doing great!'
            END),
            '["LDN 4.5mg", "Magnesium 400mg", "Vitamin D3 2000IU", "Omega-3 1000mg"]'::jsonb,
            '["LDN protocol", "Meditation 15min", "Stretching"]'::jsonb,
            '["Walking 30min", "Yoga 20min", "Swimming 30min"]'::jsonb,
            '["Oura Ring", "Heating pad"]'::jsonb,
            CASE 
                -- October 9th gets Whoop data for variety
                WHEN v_day_offset = 9 THEN 
                    '{"whoop": {"recovery_score": 85, "sleep_score": 88, "strain": 12.4, "hrv": 65, "resting_hr": 58}}'::jsonb
                ELSE 
                    '{"score": 8, "recovery_score": 82, "sleep_score": 85, "device": "Oura Ring"}'::jsonb
            END
        );
    END LOOP;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'SUCCESS! Created 39 days of data:';
    RAISE NOTICE 'Sept 1-24 (24 days): Red/Orange - Pain 7-9, Mood 2-4';
    RAISE NOTICE 'Sept 25-29 (5 days): Yellow - Pain 4-6, Mood 5-7';
    RAISE NOTICE 'Sept 30-Oct 9 (10 days): Green - Pain 2-3, Mood 8-9';
    RAISE NOTICE '========================================';
    
END $$;

