-- ============================================
-- MUM'S CHRONIC PAIN PROFILE - WORKING VERSION
-- ============================================
-- Updates existing profile and adds August 2025 data

DO $$
DECLARE
    v_mum_user_id UUID;
    v_mum_profile_id UUID;
    v_day_offset INTEGER;
    v_date DATE;
BEGIN
    -- Get Mum's IDs (using the existing user)
    SELECT user_id, id INTO v_mum_user_id, v_mum_profile_id
    FROM profiles WHERE slug = 'mum-chronic-pain';
    
    -- If profile doesn't exist, create it with a different slug
    IF v_mum_user_id IS NULL THEN
        -- Try to create with a unique slug
        INSERT INTO profiles (user_id, slug, display_name, bio, public, created_at)
        SELECT 
            (SELECT id FROM auth.users LIMIT 1),
            'mum-chronic-pain-' || extract(epoch from now()),
            'Sarah - Chronic Pain Journey',
            'Tracking chronic pain recovery and finding what actually works. After trying 15+ treatments, finally found relief through systematic tracking.',
            true,
            NOW()
        RETURNING user_id, id INTO v_mum_user_id, v_mum_profile_id;
        
        RAISE NOTICE 'Created Mum profile with unique slug: user_id=%, profile_id=%', v_mum_user_id, v_mum_profile_id;
    ELSE
        RAISE NOTICE 'Found existing Mum profile: user_id=%, profile_id=%', v_mum_user_id, v_mum_profile_id;
    END IF;
    
    -- Clean existing data
    DELETE FROM daily_entries WHERE user_id = v_mum_user_id;
    DELETE FROM journal_entries WHERE profile_id = v_mum_profile_id;
    DELETE FROM stack_followers WHERE owner_user_id = v_mum_user_id;
    DELETE FROM stack_items WHERE profile_id = v_mum_profile_id;
    DELETE FROM protocols WHERE profile_id = v_mum_profile_id;
    DELETE FROM gear WHERE profile_id = v_mum_profile_id;
    DELETE FROM library_items WHERE profile_id = v_mum_profile_id;
    
    RAISE NOTICE 'Cleaned existing data';
    
    -- ============================================
    -- AUGUST 2025 - 31 DAYS OF PAIN DATA
    -- ============================================
    
    v_date := '2025-08-01';
    
    -- Days 1-8: RED/YELLOW (pain 8-9/10)
    FOR v_day_offset IN 0..7 LOOP
        INSERT INTO daily_entries (user_id, local_date, mood, sleep_quality, pain, sleep_hours, night_wakes, tags, journal, meds, protocols, activity, devices, wearables)
        VALUES (
            v_mum_user_id, v_date + v_day_offset,
            2, 3, 9, 4.5, 5,
            ARRAY['exhausted', 'frustrated', 'overwhelmed', 'hopeless'],
            'Pain at 9/10. New medication not working. Can''t think straight.',
            '["New Medication", "Ibuprofen 800mg"]'::jsonb,
            '["Heat therapy"]'::jsonb,
            '["Minimal movement"]'::jsonb,
            '["Heating pad"]'::jsonb,
            '["Manual tracking"]'::jsonb
        );
    END LOOP;
    
    -- Days 9-10: YELLOW (pain 6-7/10)
    FOR v_day_offset IN 8..9 LOOP
        INSERT INTO daily_entries (user_id, local_date, mood, sleep_quality, pain, sleep_hours, night_wakes, tags, journal, meds, protocols, activity, devices, wearables)
        VALUES (
            v_mum_user_id, v_date + v_day_offset,
            4, 4, 7, 5.5, 3,
            ARRAY['hopeful', 'determined'],
            'Pain 7/10. Starting to track consistently. Maybe some improvement.',
            '["New Medication", "Ibuprofen 600mg"]'::jsonb,
            '["Heat therapy"]'::jsonb,
            '["Light walking"]'::jsonb,
            '["Heating pad"]'::jsonb,
            '["Manual tracking"]'::jsonb
        );
    END LOOP;
    
    -- Days 11-17: LIGHT GREEN (pain 4-5/10)
    FOR v_day_offset IN 10..16 LOOP
        INSERT INTO daily_entries (user_id, local_date, mood, sleep_quality, pain, sleep_hours, night_wakes, tags, journal, meds, protocols, activity, devices, wearables)
        VALUES (
            v_mum_user_id, v_date + v_day_offset,
            6, 6, 5, 6.5, 2,
            ARRAY['hopeful', 'grateful', 'progress'],
            'Pain 5/10! This is working! Clear improvement pattern.',
            '["New Medication", "Magnesium"]'::jsonb,
            '["Heat therapy", "Gentle stretching"]'::jsonb,
            '["Walking 20min"]'::jsonb,
            '["Heating pad"]'::jsonb,
            '["Manual tracking"]'::jsonb
        );
    END LOOP;
    
    -- Days 18-24: DARK GREEN (pain 2-3/10)
    FOR v_day_offset IN 17..23 LOOP
        INSERT INTO daily_entries (user_id, local_date, mood, sleep_quality, pain, sleep_hours, night_wakes, tags, journal, meds, protocols, activity, devices, wearables)
        VALUES (
            v_mum_user_id, v_date + v_day_offset,
            8, 8, 3, 7.5, 1,
            ARRAY['amazing', 'grateful', 'energetic'],
            'Pain 3/10! 7 days in a row of relief. Best I''ve felt in years.',
            '["New Medication", "Magnesium", "Vitamin D"]'::jsonb,
            '["Heat therapy", "Gentle stretching"]'::jsonb,
            '["Walking 30min", "Normal activities"]'::jsonb,
            '["Heating pad"]'::jsonb,
            '["Manual tracking"]'::jsonb
        );
    END LOOP;
    
    -- Days 25-27: YELLOW (pain 5-6/10)
    FOR v_day_offset IN 24..26 LOOP
        INSERT INTO daily_entries (user_id, local_date, mood, sleep_quality, pain, sleep_hours, night_wakes, tags, journal, meds, protocols, activity, devices, wearables)
        VALUES (
            v_mum_user_id, v_date + v_day_offset,
            5, 5, 6, 6.0, 2,
            ARRAY['frustrated', 'determined'],
            'Pain 6/10. Forgot supplements yesterday - consistency matters.',
            '["New Medication", "Magnesium"]'::jsonb,
            '["Heat therapy"]'::jsonb,
            '["Light walking"]'::jsonb,
            '["Heating pad"]'::jsonb,
            '["Manual tracking"]'::jsonb
        );
    END LOOP;
    
    -- Days 28-31: GREEN (pain 3-4/10)
    FOR v_day_offset IN 27..30 LOOP
        INSERT INTO daily_entries (user_id, local_date, mood, sleep_quality, pain, sleep_hours, night_wakes, tags, journal, meds, protocols, activity, devices, wearables)
        VALUES (
            v_mum_user_id, v_date + v_day_offset,
            7, 7, 4, 7.0, 1,
            ARRAY['hopeful', 'grateful', 'optimistic'],
            'Pain 4/10. Back on track. Ready for doctor appointment with data!',
            '["New Medication", "Magnesium", "Vitamin D"]'::jsonb,
            '["Heat therapy", "Gentle stretching"]'::jsonb,
            '["Walking 25min"]'::jsonb,
            '["Heating pad"]'::jsonb,
            '["Manual tracking"]'::jsonb
        );
    END LOOP;
    
    RAISE NOTICE 'Inserted 31 daily entries for August 2025';
    RAISE NOTICE 'Mum profile ready! Check the profile slug in the database.';
    
END $$;
