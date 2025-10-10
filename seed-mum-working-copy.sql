-- ============================================
-- MUM CHRONIC PAIN PROFILE - WORKING COPY (Based on Emma's Working Script)
-- ============================================
-- This script populates Mum's complete profile with:
-- - 31 days of mood/sleep/pain data for August 2025
-- - Correct pain progression: Days 1-8 (red), Days 9-10 (yellow), Days 11-17 (light green), Days 18-24 (dark green), Days 25-27 (yellow), Days 28-31 (green)

DO $$
DECLARE
    v_mum_user_id UUID;
    v_mum_profile_id UUID;
    v_day_offset INTEGER;
    v_date DATE;
BEGIN
    -- Get Mum's IDs (using exact same pattern as Emma)
    SELECT user_id, id INTO v_mum_user_id, v_mum_profile_id
    FROM profiles WHERE slug = 'mum-chronic-pain';
    
    IF v_mum_user_id IS NULL THEN
        RAISE NOTICE 'ERROR: Mum profile not found!';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Found Mum: user_id=%, profile_id=%', v_mum_user_id, v_mum_profile_id;
    
    -- Clean existing data (exact same as Emma)
    DELETE FROM daily_entries WHERE user_id = v_mum_user_id;
    DELETE FROM journal_entries WHERE profile_id = v_mum_profile_id;
    DELETE FROM stack_followers WHERE owner_user_id = v_mum_user_id;
    DELETE FROM stack_items WHERE profile_id = v_mum_profile_id;
    DELETE FROM protocols WHERE profile_id = v_mum_profile_id;
    DELETE FROM gear WHERE profile_id = v_mum_profile_id;
    DELETE FROM library_items WHERE profile_id = v_mum_profile_id;
    
    RAISE NOTICE 'Wiped all existing data';
    
    -- ============================================
    -- DAILY ENTRIES (31 days for August)
    -- ============================================
    
    -- Aug 1-8: RED/ORANGE (severe pain 8-9, mood 2-3)
    v_date := '2025-08-01';
    FOR v_day_offset IN 0..7 LOOP
        INSERT INTO daily_entries (user_id, local_date, mood, sleep_quality, pain, sleep_hours, night_wakes, tags, journal, meds, protocols, activity, devices, wearables)
        VALUES (
            v_mum_user_id, v_date + v_day_offset,
            CASE v_day_offset % 3 WHEN 0 THEN 2 WHEN 1 THEN 2 ELSE 3 END,
            CASE v_day_offset % 3 WHEN 0 THEN 3 WHEN 1 THEN 3 ELSE 4 END,
            CASE v_day_offset % 3 WHEN 0 THEN 9 WHEN 1 THEN 8 ELSE 9 END,
            CASE v_day_offset % 3 WHEN 0 THEN 5.5 WHEN 1 THEN 5.8 ELSE 6.0 END,
            CASE v_day_offset % 3 WHEN 0 THEN 4 WHEN 1 THEN 4 ELSE 3 END,
            ARRAY['exhausted', 'frustrated', 'desperate', 'hopeless'],
            CASE v_day_offset % 7 
                WHEN 0 THEN 'Day ' || (v_day_offset + 1) || ' - Pain at 9/10. Can barely function. Trying to find something that helps.'
                WHEN 1 THEN 'Day ' || (v_day_offset + 1) || ' - Pain at 8/10. Still terrible but slightly better than yesterday.'
                WHEN 2 THEN 'Day ' || (v_day_offset + 1) || ' - Pain at 9/10. Back to severe. This is exhausting.'
                WHEN 3 THEN 'Day ' || (v_day_offset + 1) || ' - Pain at 8/10. Trying heat therapy and magnesium.'
                WHEN 4 THEN 'Day ' || (v_day_offset + 1) || ' - Pain at 9/10. Another terrible day. Feeling hopeless.'
                WHEN 5 THEN 'Day ' || (v_day_offset + 1) || ' - Pain at 8/10. Sleep improving slightly.'
                ELSE 'Day ' || (v_day_offset + 1) || ' - Pain at 9/10. Last day of this terrible week.'
            END,
            '["Ibuprofen 800mg", "Melatonin 3mg"]'::jsonb,
            '["Heat therapy", "Rest", "Gentle stretching"]'::jsonb,
            '["Light walking 10min", "Stretching 5min"]'::jsonb,
            '["Heating pad"]'::jsonb,
            '["Oura Ring"]'::jsonb
        );
    END LOOP;
    
    -- Aug 9-10: YELLOW (moderate pain 6, mood 4-5)
    v_date := '2025-08-09';
    FOR v_day_offset IN 0..1 LOOP
        INSERT INTO daily_entries (user_id, local_date, mood, sleep_quality, pain, sleep_hours, night_wakes, tags, journal, meds, protocols, activity, devices, wearables)
        VALUES (
            v_mum_user_id, v_date + v_day_offset,
            4 + v_day_offset,
            5 + v_day_offset,
            6,
            6.5 + (v_day_offset * 0.2),
            3 - v_day_offset,
            ARRAY['hopeful', 'cautious', 'tired'],
            CASE v_day_offset
                WHEN 0 THEN 'Day 9 - Pain at 6/10. Slight improvement! Trying new supplements.'
                ELSE 'Day 10 - Pain at 6/10. Staying steady. Magnesium helping with sleep.'
            END,
            '["Magnesium 400mg", "Ibuprofen 600mg", "Melatonin 3mg"]'::jsonb,
            '["Heat therapy", "Light exercise", "Supplements"]'::jsonb,
            '["Walking 15min", "Yoga 10min"]'::jsonb,
            '["Heating pad", "TENS unit"]'::jsonb,
            '["Oura Ring"]'::jsonb
        );
    END LOOP;
    
    -- Aug 11-17: LIGHT GREEN (good days 3-4, mood 6-7)
    v_date := '2025-08-11';
    FOR v_day_offset IN 0..6 LOOP
        INSERT INTO daily_entries (user_id, local_date, mood, sleep_quality, pain, sleep_hours, night_wakes, tags, journal, meds, protocols, activity, devices, wearables)
        VALUES (
            v_mum_user_id, v_date + v_day_offset,
            CASE v_day_offset % 3 WHEN 0 THEN 6 WHEN 1 THEN 6 ELSE 7 END,
            CASE v_day_offset % 3 WHEN 0 THEN 7 WHEN 1 THEN 7 ELSE 8 END,
            CASE v_day_offset % 3 WHEN 0 THEN 4 WHEN 1 THEN 3 ELSE 3 END,
            CASE v_day_offset % 3 WHEN 0 THEN 7.0 WHEN 1 THEN 7.2 ELSE 7.4 END,
            CASE v_day_offset % 3 WHEN 0 THEN 2 WHEN 1 THEN 2 ELSE 1 END,
            ARRAY['hopeful', 'grateful', 'motivated', 'improving'],
            CASE v_day_offset % 7
                WHEN 0 THEN 'Day 11 - Pain at 4/10. Finally seeing improvement! New protocol working.'
                WHEN 1 THEN 'Day 12 - Pain at 3/10. This is the best I''ve felt in weeks!'
                WHEN 2 THEN 'Day 13 - Pain at 4/10. Some ups and downs but trending better.'
                WHEN 3 THEN 'Day 14 - Pain at 3/10. Sleep improving. Energy levels up!'
                WHEN 4 THEN 'Day 15 - Pain at 3/10. Consistent improvement. Feeling hopeful.'
                WHEN 5 THEN 'Day 16 - Pain at 3/10. Best week in months!'
                ELSE 'Day 17 - Pain at 3/10. Ending the week strong!'
            END,
            '["Magnesium 400mg", "Vitamin D 2000IU", "Omega-3 1000mg", "Melatonin 3mg"]'::jsonb,
            '["Daily supplements", "Heat therapy", "Light exercise", "Sleep hygiene"]'::jsonb,
            '["Walking 20min", "Yoga 15min", "Swimming 10min"]'::jsonb,
            '["Heating pad", "Foam roller"]'::jsonb,
            '["Oura Ring"]'::jsonb
        );
    END LOOP;
    
    -- Aug 18-24: DARK GREEN (excellent 7 green days, pain 1-2, mood 8-9)
    v_date := '2025-08-18';
    FOR v_day_offset IN 0..6 LOOP
        INSERT INTO daily_entries (user_id, local_date, mood, sleep_quality, pain, sleep_hours, night_wakes, tags, journal, meds, protocols, activity, devices, wearables)
        VALUES (
            v_mum_user_id, v_date + v_day_offset,
            CASE v_day_offset % 3 WHEN 0 THEN 8 WHEN 1 THEN 8 ELSE 9 END,
            CASE v_day_offset % 3 WHEN 0 THEN 8 WHEN 1 THEN 8 ELSE 9 END,
            CASE v_day_offset % 3 WHEN 0 THEN 2 WHEN 1 THEN 1 ELSE 1 END,
            CASE v_day_offset % 3 WHEN 0 THEN 7.5 WHEN 1 THEN 7.8 ELSE 8.0 END,
            CASE v_day_offset % 3 WHEN 0 THEN 1 WHEN 1 THEN 1 ELSE 0 END,
            ARRAY['amazing', 'grateful', 'energetic', 'confident', 'healing'],
            CASE v_day_offset % 7
                WHEN 0 THEN 'Day 18 - AMAZING! Pain at 2/10. Best day in months!'
                WHEN 1 THEN 'Day 19 - Pain at 1/10. I can''t believe this is real!'
                WHEN 2 THEN 'Day 20 - Pain at 2/10. Two amazing days in a row!'
                WHEN 3 THEN 'Day 21 - Pain at 1/10. This is incredible!'
                WHEN 4 THEN 'Day 22 - Pain at 1/10. Four days of relief!'
                WHEN 5 THEN 'Day 23 - Pain at 2/10. Five amazing days!'
                ELSE 'Day 24 - Pain at 1/10. SEVEN GREEN DAYS IN A ROW!'
            END,
            '["Magnesium 400mg", "Vitamin D 2000IU", "Omega-3 1000mg", "Curcumin 500mg", "Melatonin 3mg"]'::jsonb,
            '["Daily supplements", "Heat therapy", "Exercise", "Sleep hygiene", "Stress management"]'::jsonb,
            '["Walking 30min", "Yoga 20min", "Swimming 15min", "Dancing 10min"]'::jsonb,
            '["Foam roller", "Massage ball"]'::jsonb,
            '["Oura Ring"]'::jsonb
        );
    END LOOP;
    
    -- Aug 25-27: YELLOW (regression 5-6, mood 5-6)
    v_date := '2025-08-25';
    FOR v_day_offset IN 0..2 LOOP
        INSERT INTO daily_entries (user_id, local_date, mood, sleep_quality, pain, sleep_hours, night_wakes, tags, journal, meds, protocols, activity, devices, wearables)
        VALUES (
            v_mum_user_id, v_date + v_day_offset,
            CASE v_day_offset WHEN 0 THEN 5 WHEN 1 THEN 5 ELSE 6 END,
            CASE v_day_offset WHEN 0 THEN 6 WHEN 1 THEN 6 ELSE 7 END,
            CASE v_day_offset WHEN 0 THEN 5 WHEN 1 THEN 6 ELSE 5 END,
            7.0,
            CASE v_day_offset WHEN 0 THEN 2 WHEN 1 THEN 2 ELSE 1 END,
            ARRAY['frustrated', 'worried', 'determined'],
            CASE v_day_offset
                WHEN 0 THEN 'Day 25 - Pain at 5/10. Some regression. Stressful week at work.'
                WHEN 1 THEN 'Day 26 - Pain at 6/10. Worse today. Need to adjust protocol.'
                ELSE 'Day 27 - Pain at 5/10. Stabilizing. Stress management crucial.'
            END,
            '["Magnesium 400mg", "Vitamin D 2000IU", "Omega-3 1000mg", "Curcumin 500mg", "Ibuprofen 400mg"]'::jsonb,
            '["Daily supplements", "Heat therapy", "Stress management", "Extra rest"]'::jsonb,
            '["Walking 15min", "Light stretching"]'::jsonb,
            '["Heating pad", "TENS unit"]'::jsonb,
            '["Oura Ring"]'::jsonb
        );
    END LOOP;
    
    -- Aug 28-31: GREEN (recovery 2-3, mood 7-8)
    v_date := '2025-08-28';
    FOR v_day_offset IN 0..3 LOOP
        INSERT INTO daily_entries (user_id, local_date, mood, sleep_quality, pain, sleep_hours, night_wakes, tags, journal, meds, protocols, activity, devices, wearables)
        VALUES (
            v_mum_user_id, v_date + v_day_offset,
            CASE v_day_offset % 3 WHEN 0 THEN 7 WHEN 1 THEN 7 ELSE 8 END,
            CASE v_day_offset % 3 WHEN 0 THEN 7 WHEN 1 THEN 7 ELSE 8 END,
            CASE v_day_offset % 3 WHEN 0 THEN 3 WHEN 1 THEN 2 ELSE 2 END,
            CASE v_day_offset % 3 WHEN 0 THEN 7.2 WHEN 1 THEN 7.4 ELSE 7.6 END,
            CASE v_day_offset % 3 WHEN 0 THEN 1 WHEN 1 THEN 1 ELSE 0 END,
            ARRAY['relieved', 'hopeful', 'grateful', 'recovering'],
            CASE v_day_offset % 7
                WHEN 0 THEN 'Day 28 - Pain at 3/10. Back on track! Adjustments working.'
                WHEN 1 THEN 'Day 29 - Pain at 2/10. Recovery mode activated!'
                WHEN 2 THEN 'Day 30 - Pain at 2/10. Ending August strong!'
                WHEN 3 THEN 'Day 31 - Pain at 2/10. Ready for September!'
                WHEN 4 THEN 'Day 32 - Pain at 3/10. Consistent progress.'
                WHEN 5 THEN 'Day 33 - Pain at 2/10. This is working!'
                ELSE 'Day 34 - Pain at 2/10. Life-changing protocol!'
            END,
            '["Magnesium 400mg", "Vitamin D 2000IU", "Omega-3 1000mg", "Curcumin 500mg", "Melatonin 3mg"]'::jsonb,
            '["Daily supplements", "Heat therapy", "Exercise", "Sleep hygiene", "Stress management"]'::jsonb,
            '["Walking 25min", "Yoga 15min", "Swimming 10min"]'::jsonb,
            '["Foam roller"]'::jsonb,
            '["Oura Ring"]'::jsonb
        );
    END LOOP;
    
    RAISE NOTICE 'Inserted 31 daily entries for August 2025';
    
END $$;

-- Verification
SELECT 'Verification - Date range:' as info;
SELECT MIN(local_date) as earliest, MAX(local_date) as latest, COUNT(*) as total_days
FROM daily_entries 
WHERE user_id = (SELECT user_id FROM profiles WHERE slug = 'mum-chronic-pain');

SELECT 'Verification - Sample data:' as info;
SELECT local_date, mood, pain, sleep_quality, tags
FROM daily_entries 
WHERE user_id = (SELECT user_id FROM profiles WHERE slug = 'mum-chronic-pain') 
ORDER BY local_date 
LIMIT 10;
