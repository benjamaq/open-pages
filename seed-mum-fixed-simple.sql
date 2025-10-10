-- SIMPLE FIX: Delete all existing data and recreate properly
-- This will definitely work

DO $$
DECLARE
    v_user_id UUID := 'f3fdc655-efc6-4554-8159-8055e8f6f39d';
    v_profile_id UUID;
    i INTEGER;
    v_date DATE;
    v_mood INTEGER;
    v_pain INTEGER;
    v_sleep_quality INTEGER;
    v_sleep_hours DECIMAL;
    v_night_wakes INTEGER;
    v_tags TEXT[];
    v_journal TEXT;
BEGIN
    -- Get profile ID
    SELECT id INTO v_profile_id FROM profiles WHERE slug = 'mum-chronic-pain';
    
    -- Delete ALL existing daily entries for this user
    DELETE FROM daily_entries WHERE user_id = v_user_id;
    
    -- Create entries for ALL 31 days of August
    FOR i IN 1..31 LOOP
        v_date := '2025-08-' || LPAD(i::TEXT, 2, '0');
        
        -- Set values based on the day
        IF i <= 8 THEN
            -- Days 1-8: Red/Yellow (severe pain 8-9/10)
            v_mood := 2;
            v_pain := CASE WHEN i <= 4 THEN 9 ELSE 8 END;
            v_sleep_quality := 3;
            v_sleep_hours := 5.5;
            v_night_wakes := 4;
            v_tags := ARRAY['exhausted', 'frustrated', 'desperate'];
            v_journal := 'Day ' || i || ' - Severe pain at ' || v_pain || '/10. Barely functioning.';
        ELSIF i <= 10 THEN
            -- Days 9-10: Yellow (moderate pain 6/10)
            v_mood := 4;
            v_pain := 6;
            v_sleep_quality := 5;
            v_sleep_hours := 6.5;
            v_night_wakes := 3;
            v_tags := ARRAY['hopeful', 'cautious'];
            v_journal := 'Day ' || i || ' - Moderate pain at ' || v_pain || '/10. Slight improvement.';
        ELSIF i <= 17 THEN
            -- Days 11-17: Light Green (good days 3-4/10 pain)
            v_mood := 6;
            v_pain := CASE WHEN i <= 13 THEN 4 ELSE 3 END;
            v_sleep_quality := 7;
            v_sleep_hours := 7.0;
            v_night_wakes := 2;
            v_tags := ARRAY['hopeful', 'grateful', 'improving'];
            v_journal := 'Day ' || i || ' - Good day! Pain at ' || v_pain || '/10. Seeing real progress.';
        ELSIF i <= 24 THEN
            -- Days 18-24: Dark Green (excellent 7 green days in a row, 1-2/10 pain)
            v_mood := 8;
            v_pain := CASE WHEN i <= 21 THEN 2 ELSE 1 END;
            v_sleep_quality := 8;
            v_sleep_hours := 7.5;
            v_night_wakes := 1;
            v_tags := ARRAY['amazing', 'grateful', 'energetic', 'healing'];
            v_journal := 'Day ' || i || ' - AMAZING! Pain at ' || v_pain || '/10. Best days in months!';
        ELSIF i <= 27 THEN
            -- Days 25-27: Yellow (some regression 5-6/10 pain)
            v_mood := 5;
            v_pain := CASE WHEN i = 25 THEN 5 WHEN i = 26 THEN 6 ELSE 5 END;
            v_sleep_quality := 6;
            v_sleep_hours := 7.0;
            v_night_wakes := 2;
            v_tags := ARRAY['frustrated', 'worried', 'determined'];
            v_journal := 'Day ' || i || ' - Some regression. Pain at ' || v_pain || '/10. Stressful week.';
        ELSE
            -- Days 28-31: Green (back on track 2-3/10 pain)
            v_mood := 7;
            v_pain := CASE WHEN i <= 30 THEN 3 ELSE 2 END;
            v_sleep_quality := 7;
            v_sleep_hours := 7.2;
            v_night_wakes := 1;
            v_tags := ARRAY['relieved', 'hopeful', 'recovering'];
            v_journal := 'Day ' || i || ' - Back on track! Pain at ' || v_pain || '/10. Recovery mode.';
        END IF;
        
        -- Insert the daily entry
        INSERT INTO daily_entries (
            user_id, local_date, mood, sleep_quality, pain, sleep_hours, 
            night_wakes, tags, journal, meds, protocols, activity, devices, wearables
        ) VALUES (
            v_user_id, v_date, v_mood, v_sleep_quality, v_pain, v_sleep_hours,
            v_night_wakes, v_tags, v_journal,
            '["Magnesium 400mg", "Vitamin D 2000IU"]'::jsonb,
            '["Heat therapy", "Gentle exercise"]'::jsonb,
            '["Walking 20min"]'::jsonb,
            '["Heating pad"]'::jsonb,
            '["Oura Ring"]'::jsonb
        );
    END LOOP;
    
    RAISE NOTICE 'Created 31 daily entries for August 2025';
END $$;

-- Verify the data
SELECT 'Verification - Date range:' as info;
SELECT MIN(local_date) as earliest, MAX(local_date) as latest, COUNT(*) as total_days
FROM daily_entries 
WHERE user_id = 'f3fdc655-efc6-4554-8159-8055e8f6f39d';

SELECT 'Verification - Sample data:' as info;
SELECT local_date, mood, pain, sleep_quality 
FROM daily_entries 
WHERE user_id = 'f3fdc655-efc6-4554-8159-8055e8f6f39d' 
ORDER BY local_date 
LIMIT 10;
