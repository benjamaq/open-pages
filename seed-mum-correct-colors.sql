-- ============================================
-- MUM PROFILE - CORRECT COLORS FOR PAIN PROGRESSION
-- ============================================
-- This fixes the pain values to match the exact color progression specified

DO $$
DECLARE
    v_mum_user_id UUID;
    v_mum_profile_id UUID;
    v_day_offset INTEGER;
    v_date DATE;
    v_mood INTEGER;
    v_pain INTEGER;
    v_sleep_quality INTEGER;
    v_sleep_hours DECIMAL;
    v_night_wakes INTEGER;
    v_tags TEXT[];
    v_journal TEXT;
BEGIN
    -- Get Mum's IDs
    SELECT user_id, id INTO v_mum_user_id, v_mum_profile_id
    FROM profiles WHERE slug = 'mum-chronic-pain';
    
    IF v_mum_user_id IS NULL THEN
        RAISE NOTICE 'ERROR: Mum profile not found!';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Found Mum: user_id=%, profile_id=%', v_mum_user_id, v_mum_profile_id;
    
    -- Clean existing daily entries
    DELETE FROM daily_entries WHERE user_id = v_mum_user_id;
    
    RAISE NOTICE 'Wiped existing daily entries';
    
    -- ============================================
    -- DAILY ENTRIES - EXACT COLOR PROGRESSION
    -- ============================================
    
    -- July 27-31: YELLOW colors (baseline tracking - pain 5-6)
    v_date := '2025-07-27';
    FOR v_day_offset IN 0..4 LOOP
        INSERT INTO daily_entries (user_id, local_date, mood, sleep_quality, pain, sleep_hours, night_wakes, tags, journal, meds, protocols, activity, devices, wearables)
        VALUES (
            v_mum_user_id, v_date + v_day_offset,
            5, 6, 5, 6.5, 3,
            ARRAY['baseline', 'tracking', 'moderate'],
            'Day ' || (v_day_offset + 27) || ' - Baseline tracking. Moderate pain at 5/10. Establishing patterns.',
            '["Ibuprofen 600mg", "Melatonin 3mg"]'::jsonb,
            '["Heat therapy", "Light stretching"]'::jsonb,
            '["Walking 15min"]'::jsonb,
            '["Heating pad"]'::jsonb,
            '["Oura Ring"]'::jsonb
        );
    END LOOP;
    
    -- Aug 1-8: RED colors (severe pain 8-9)
    v_date := '2025-08-01';
    FOR v_day_offset IN 0..7 LOOP
        INSERT INTO daily_entries (user_id, local_date, mood, sleep_quality, pain, sleep_hours, night_wakes, tags, journal, meds, protocols, activity, devices, wearables)
        VALUES (
            v_mum_user_id, v_date + v_day_offset,
            2, 3, 9, 5.5, 4,
            ARRAY['exhausted', 'frustrated', 'desperate', 'hopeless'],
            'Day ' || (v_day_offset + 1) || ' - Severe pain at 9/10. Can barely function.',
            '["Ibuprofen 800mg", "Melatonin 3mg"]'::jsonb,
            '["Heat therapy", "Rest", "Gentle stretching"]'::jsonb,
            '["Light walking 10min", "Stretching 5min"]'::jsonb,
            '["Heating pad"]'::jsonb,
            '["Oura Ring"]'::jsonb
        );
    END LOOP;
    
    -- Aug 9-10: YELLOW colors (moderate pain 6)
    v_date := '2025-08-09';
    FOR v_day_offset IN 0..1 LOOP
        INSERT INTO daily_entries (user_id, local_date, mood, sleep_quality, pain, sleep_hours, night_wakes, tags, journal, meds, protocols, activity, devices, wearables)
        VALUES (
            v_mum_user_id, v_date + v_day_offset,
            4, 5, 6, 6.5, 3,
            ARRAY['hopeful', 'cautious', 'tired'],
            'Day ' || (v_day_offset + 9) || ' - Moderate pain at 6/10. Slight improvement.',
            '["Magnesium 400mg", "Ibuprofen 600mg", "Melatonin 3mg"]'::jsonb,
            '["Heat therapy", "Light exercise", "Supplements"]'::jsonb,
            '["Walking 15min", "Yoga 10min"]'::jsonb,
            '["Heating pad", "TENS unit"]'::jsonb,
            '["Oura Ring"]'::jsonb
        );
    END LOOP;
    
    -- Aug 11-17: LIGHT GREEN colors (good days 3-4)
    v_date := '2025-08-11';
    FOR v_day_offset IN 0..6 LOOP
        INSERT INTO daily_entries (user_id, local_date, mood, sleep_quality, pain, sleep_hours, night_wakes, tags, journal, meds, protocols, activity, devices, wearables)
        VALUES (
            v_mum_user_id, v_date + v_day_offset,
            6, 7, 4, 7.0, 2,
            ARRAY['hopeful', 'grateful', 'motivated', 'improving'],
            'Day ' || (v_day_offset + 11) || ' - Good day! Pain at 4/10. Seeing real progress.',
            '["Magnesium 400mg", "Vitamin D 2000IU", "Omega-3 1000mg", "Melatonin 3mg"]'::jsonb,
            '["Daily supplements", "Heat therapy", "Light exercise", "Sleep hygiene"]'::jsonb,
            '["Walking 20min", "Yoga 15min", "Swimming 10min"]'::jsonb,
            '["Heating pad", "Foam roller"]'::jsonb,
            '["Oura Ring"]'::jsonb
        );
    END LOOP;
    
    -- Aug 18-24: DARK GREEN colors (excellent - 7 green days in a row, pain 1-2)
    v_date := '2025-08-18';
    FOR v_day_offset IN 0..6 LOOP
        INSERT INTO daily_entries (user_id, local_date, mood, sleep_quality, pain, sleep_hours, night_wakes, tags, journal, meds, protocols, activity, devices, wearables)
        VALUES (
            v_mum_user_id, v_date + v_day_offset,
            8, 8, 2, 7.5, 1,
            ARRAY['amazing', 'grateful', 'energetic', 'confident', 'healing'],
            'Day ' || (v_day_offset + 18) || ' - AMAZING! Pain at 2/10. Best days in months!',
            '["Magnesium 400mg", "Vitamin D 2000IU", "Omega-3 1000mg", "Curcumin 500mg", "Melatonin 3mg"]'::jsonb,
            '["Daily supplements", "Heat therapy", "Exercise", "Sleep hygiene", "Stress management"]'::jsonb,
            '["Walking 30min", "Yoga 20min", "Swimming 15min", "Dancing 10min"]'::jsonb,
            '["Foam roller", "Massage ball"]'::jsonb,
            '["Oura Ring"]'::jsonb
        );
    END LOOP;
    
    -- Aug 25-27: YELLOW colors (regression 5-6)
    v_date := '2025-08-25';
    FOR v_day_offset IN 0..2 LOOP
        INSERT INTO daily_entries (user_id, local_date, mood, sleep_quality, pain, sleep_hours, night_wakes, tags, journal, meds, protocols, activity, devices, wearables)
        VALUES (
            v_mum_user_id, v_date + v_day_offset,
            5, 6, 6, 7.0, 2,
            ARRAY['frustrated', 'worried', 'determined'],
            'Day ' || (v_day_offset + 25) || ' - Some regression. Pain at 6/10. Stressful week.',
            '["Magnesium 400mg", "Vitamin D 2000IU", "Omega-3 1000mg", "Curcumin 500mg", "Ibuprofen 400mg"]'::jsonb,
            '["Daily supplements", "Heat therapy", "Stress management", "Extra rest"]'::jsonb,
            '["Walking 15min", "Light stretching"]'::jsonb,
            '["Heating pad", "TENS unit"]'::jsonb,
            '["Oura Ring"]'::jsonb
        );
    END LOOP;
    
    -- Aug 28-31: GREEN colors (recovery 2-3)
    v_date := '2025-08-28';
    FOR v_day_offset IN 0..3 LOOP
        INSERT INTO daily_entries (user_id, local_date, mood, sleep_quality, pain, sleep_hours, night_wakes, tags, journal, meds, protocols, activity, devices, wearables)
        VALUES (
            v_mum_user_id, v_date + v_day_offset,
            7, 7, 3, 7.2, 1,
            ARRAY['relieved', 'hopeful', 'grateful', 'recovering'],
            'Day ' || (v_day_offset + 28) || ' - Back on track! Pain at 3/10. Recovery mode.',
            '["Magnesium 400mg", "Vitamin D 2000IU", "Omega-3 1000mg", "Curcumin 500mg", "Melatonin 3mg"]'::jsonb,
            '["Daily supplements", "Heat therapy", "Exercise", "Sleep hygiene", "Stress management"]'::jsonb,
            '["Walking 25min", "Yoga 15min", "Swimming 10min"]'::jsonb,
            '["Foam roller"]'::jsonb,
            '["Oura Ring"]'::jsonb
        );
    END LOOP;
    
    -- September 1-6: GREEN colors (continued tracking 2-3)
    v_date := '2025-09-01';
    FOR v_day_offset IN 0..5 LOOP
        INSERT INTO daily_entries (user_id, local_date, mood, sleep_quality, pain, sleep_hours, night_wakes, tags, journal, meds, protocols, activity, devices, wearables)
        VALUES (
            v_mum_user_id, v_date + v_day_offset,
            8, 8, 2, 7.8, 1,
            ARRAY['maintaining', 'grateful', 'confident', 'healing'],
            'Day ' || (v_day_offset + 1) || ' - Maintaining progress! Pain at 2/10. Protocol working consistently.',
            '["Magnesium 400mg", "Vitamin D 2000IU", "Omega-3 1000mg", "Curcumin 500mg", "Melatonin 3mg"]'::jsonb,
            '["Daily supplements", "Heat therapy", "Exercise", "Sleep hygiene", "Stress management"]'::jsonb,
            '["Walking 30min", "Yoga 20min", "Swimming 15min"]'::jsonb,
            '["Foam roller", "Massage ball"]'::jsonb,
            '["Oura Ring"]'::jsonb
        );
    END LOOP;
    
    RAISE NOTICE 'Inserted corrected daily entries with exact pain progression';
    
END $$;

-- Verification
SELECT 'Verification - Pain progression:' as info;
SELECT local_date, pain, 
       CASE 
         WHEN pain >= 8 THEN 'RED (severe)'
         WHEN pain = 6 THEN 'YELLOW (moderate)'  
         WHEN pain = 5 THEN 'YELLOW (baseline)'
         WHEN pain = 4 THEN 'LIGHT GREEN (good)'
         WHEN pain = 3 THEN 'GREEN (recovery)'
         WHEN pain = 2 THEN 'DARK GREEN (excellent)'
         ELSE 'OTHER'
       END as expected_color
FROM daily_entries 
WHERE user_id = (SELECT user_id FROM profiles WHERE slug = 'mum-chronic-pain') 
ORDER BY local_date 
LIMIT 20;
