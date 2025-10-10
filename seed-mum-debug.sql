-- ============================================
-- MUM'S CHRONIC PAIN PROFILE - DEBUG VERSION
-- ============================================
-- Debug and fix the profile setup

-- First, let's see what profiles exist
SELECT 'Existing profiles:' as info;
SELECT id, user_id, slug, display_name, public FROM profiles;

-- Check if our target user exists
SELECT 'Target user check:' as info;
SELECT id FROM auth.users WHERE id = 'f3fdc655-efc6-4554-8159-8055e8f6f39d';

-- Now let's create/update the profile properly
DO $$
DECLARE
    v_mum_user_id UUID;
    v_mum_profile_id UUID;
    v_day_offset INTEGER;
    v_date DATE;
BEGIN
    -- Get the existing profile or create one
    SELECT user_id, id INTO v_mum_user_id, v_mum_profile_id
    FROM profiles 
    WHERE user_id = 'f3fdc655-efc6-4554-8159-8055e8f6f39d';
    
    -- If no profile exists, create one
    IF v_mum_profile_id IS NULL THEN
        -- Delete any existing profile with the slug first
        DELETE FROM profiles WHERE slug = 'mum-chronic-pain';
        
        -- Create new profile
        INSERT INTO profiles (user_id, slug, display_name, bio, public, created_at)
        VALUES (
            'f3fdc655-efc6-4554-8159-8055e8f6f39d',
            'mum-chronic-pain',
            'Sarah - Chronic Pain Journey',
            'Tracking chronic pain recovery and finding what actually works. After trying 15+ treatments, finally found relief through systematic tracking.',
            true,
            NOW()
        ) RETURNING user_id, id INTO v_mum_user_id, v_mum_profile_id;
        
        RAISE NOTICE 'Created new Mum profile: user_id=%, profile_id=%', v_mum_user_id, v_mum_profile_id;
    ELSE
        -- Update existing profile
        UPDATE profiles 
        SET 
            slug = 'mum-chronic-pain',
            display_name = 'Sarah - Chronic Pain Journey',
            bio = 'Tracking chronic pain recovery and finding what actually works. After trying 15+ treatments, finally found relief through systematic tracking.',
            public = true
        WHERE id = v_mum_profile_id;
        
        RAISE NOTICE 'Updated existing profile: user_id=%, profile_id=%', v_mum_user_id, v_mum_profile_id;
    END IF;
    
    -- Clean existing data
    DELETE FROM daily_entries WHERE user_id = v_mum_user_id;
    
    RAISE NOTICE 'Cleaned existing daily entries';
    
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
    
    -- Verify the profile was created/updated
    SELECT 'Final profile check:' as info;
    SELECT id, user_id, slug, display_name, public FROM profiles WHERE slug = 'mum-chronic-pain';
    
END $$;
