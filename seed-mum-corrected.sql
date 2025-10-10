-- CORRECTED Mum's Chronic Pain Profile - Complete August 2025 data
-- Following exact pain pattern: Days 1-8: Red/Yellow, Days 9-10: Yellow, 
-- Days 11-17: Light Green, Days 18-24: Dark Green, Days 25-27: Yellow, Days 28-31: Green

DO $$
DECLARE
    v_emma_user_id UUID := 'f3fdc655-efc6-4554-8159-8055e8f6f39d';
    v_emma_profile_id UUID;
    v_date DATE;
    v_mood INTEGER;
    v_sleep_quality INTEGER;
    v_pain INTEGER;
    v_sleep_hours DECIMAL;
    v_night_wakes INTEGER;
    v_tags TEXT[];
    v_journal TEXT;
    v_meds JSONB;
    v_protocols JSONB;
    v_activity JSONB;
    v_devices JSONB;
    v_wearables JSONB;
BEGIN
    -- Get Emma's profile ID
    SELECT id INTO v_emma_profile_id FROM profiles WHERE slug = 'mum-chronic-pain';
    
    -- If profile doesn't exist, create it
    IF v_emma_profile_id IS NULL THEN
        INSERT INTO profiles (user_id, slug, display_name, bio, public, created_at)
        VALUES (v_emma_user_id, 'mum-chronic-pain', 'Sarah - Chronic Pain Journey', 
                'Tracking chronic pain recovery and finding what actually works. After trying 15+ treatments, finally found relief through systematic tracking.',
                true, NOW())
        RETURNING id INTO v_emma_profile_id;
    END IF;
    
    -- Delete existing daily entries for this user
    DELETE FROM daily_entries WHERE user_id = v_emma_user_id;
    
    -- August 1-8: Red/Yellow (severe pain 8-9/10)
    FOR i IN 1..8 LOOP
        v_date := '2025-08-' || LPAD(i::TEXT, 2, '0');
        v_mood := 2;
        v_sleep_quality := 3;
        v_pain := CASE WHEN i <= 4 THEN 9 ELSE 8 END; -- First 4 days worse
        v_sleep_hours := 5.5 + (i * 0.2); -- Gradual improvement
        v_night_wakes := 4;
        v_tags := ARRAY['exhausted', 'frustrated', 'desperate', 'hopeless'];
        v_journal := 'Day ' || i || ' - Pain at ' || v_pain || '/10. Can barely function. Trying to find something that helps.';
        v_meds := '["Ibuprofen 800mg", "Melatonin 3mg"]'::jsonb;
        v_protocols := '["Heat therapy", "Rest", "Gentle stretching"]'::jsonb;
        v_activity := '["Light walking 10min", "Stretching 5min"]'::jsonb;
        v_devices := '["Heating pad"]'::jsonb;
        v_wearables := '["Oura Ring"]'::jsonb;
        
        INSERT INTO daily_entries (user_id, local_date, mood, sleep_quality, pain, sleep_hours, night_wakes, tags, journal, meds, protocols, activity, devices, wearables)
        VALUES (v_emma_user_id, v_date, v_mood, v_sleep_quality, v_pain, v_sleep_hours, v_night_wakes, v_tags, v_journal, v_meds, v_protocols, v_activity, v_devices, v_wearables);
    END LOOP;
    
    -- August 9-10: Yellow (moderate pain 6-7/10)
    FOR i IN 9..10 LOOP
        v_date := '2025-08-' || LPAD(i::TEXT, 2, '0');
        v_mood := 4;
        v_sleep_quality := 5;
        v_pain := 6;
        v_sleep_hours := 6.5;
        v_night_wakes := 3;
        v_tags := ARRAY['hopeful', 'cautious', 'tired'];
        v_journal := 'Day ' || i || ' - Pain at ' || v_pain || '/10. Slight improvement. Trying new supplements.';
        v_meds := '["Ibuprofen 600mg", "Magnesium 400mg", "Melatonin 3mg"]'::jsonb;
        v_protocols := '["Heat therapy", "Light exercise", "Supplements"]'::jsonb;
        v_activity := '["Walking 15min", "Yoga 10min"]'::jsonb;
        v_devices := '["Heating pad", "TENS unit"]'::jsonb;
        v_wearables := '["Oura Ring"]'::jsonb;
        
        INSERT INTO daily_entries (user_id, local_date, mood, sleep_quality, pain, sleep_hours, night_wakes, tags, journal, meds, protocols, activity, devices, wearables)
        VALUES (v_emma_user_id, v_date, v_mood, v_sleep_quality, v_pain, v_sleep_hours, v_night_wakes, v_tags, v_journal, v_meds, v_protocols, v_activity, v_devices, v_wearables);
    END LOOP;
    
    -- August 11-17: Light Green (good days 3-4/10 pain)
    FOR i IN 11..17 LOOP
        v_date := '2025-08-' || LPAD(i::TEXT, 2, '0');
        v_mood := 6;
        v_sleep_quality := 7;
        v_pain := CASE WHEN i <= 13 THEN 4 ELSE 3 END;
        v_sleep_hours := 7.0 + ((i - 11) * 0.1);
        v_night_wakes := 2;
        v_tags := ARRAY['hopeful', 'grateful', 'motivated', 'improving'];
        v_journal := 'Day ' || i || ' - Pain at ' || v_pain || '/10. Finally seeing improvement! New protocol working.';
        v_meds := '["Magnesium 400mg", "Vitamin D 2000IU", "Omega-3 1000mg", "Melatonin 3mg"]'::jsonb;
        v_protocols := '["Daily supplements", "Heat therapy", "Light exercise", "Sleep hygiene"]'::jsonb;
        v_activity := '["Walking 20min", "Yoga 15min", "Swimming 10min"]'::jsonb;
        v_devices := '["Heating pad", "Foam roller"]'::jsonb;
        v_wearables := '["Oura Ring"]'::jsonb;
        
        INSERT INTO daily_entries (user_id, local_date, mood, sleep_quality, pain, sleep_hours, night_wakes, tags, journal, meds, protocols, activity, devices, wearables)
        VALUES (v_emma_user_id, v_date, v_mood, v_sleep_quality, v_pain, v_sleep_hours, v_night_wakes, v_tags, v_journal, v_meds, v_protocols, v_activity, v_devices, v_wearables);
    END LOOP;
    
    -- August 18-24: Dark Green (excellent 7 green days in a row, 1-2/10 pain)
    FOR i IN 18..24 LOOP
        v_date := '2025-08-' || LPAD(i::TEXT, 2, '0');
        v_mood := 8;
        v_sleep_quality := 8;
        v_pain := CASE WHEN i <= 21 THEN 2 ELSE 1 END;
        v_sleep_hours := 7.5 + ((i - 18) * 0.1);
        v_night_wakes := 1;
        v_tags := ARRAY['amazing', 'grateful', 'energetic', 'confident', 'healing'];
        v_journal := 'Day ' || i || ' - Pain at ' || v_pain || '/10. BEST DAYS IN MONTHS! This is working!';
        v_meds := '["Magnesium 400mg", "Vitamin D 2000IU", "Omega-3 1000mg", "Curcumin 500mg", "Melatonin 3mg"]'::jsonb;
        v_protocols := '["Daily supplements", "Heat therapy", "Exercise", "Sleep hygiene", "Stress management"]'::jsonb;
        v_activity := '["Walking 30min", "Yoga 20min", "Swimming 15min", "Dancing 10min"]'::jsonb;
        v_devices := '["Foam roller", "Massage ball"]'::jsonb;
        v_wearables := '["Oura Ring"]'::jsonb;
        
        INSERT INTO daily_entries (user_id, local_date, mood, sleep_quality, pain, sleep_hours, night_wakes, tags, journal, meds, protocols, activity, devices, wearables)
        VALUES (v_emma_user_id, v_date, v_mood, v_sleep_quality, v_pain, v_sleep_hours, v_night_wakes, v_tags, v_journal, v_meds, v_protocols, v_activity, v_devices, v_wearables);
    END LOOP;
    
    -- August 25-27: Yellow (some regression 5-6/10 pain)
    FOR i IN 25..27 LOOP
        v_date := '2025-08-' || LPAD(i::TEXT, 2, '0');
        v_mood := 5;
        v_sleep_quality := 6;
        v_pain := CASE WHEN i = 25 THEN 5 WHEN i = 26 THEN 6 ELSE 5 END;
        v_sleep_hours := 7.0;
        v_night_wakes := 2;
        v_tags := ARRAY['frustrated', 'worried', 'determined'];
        v_journal := 'Day ' || i || ' - Pain at ' || v_pain || '/10. Some regression. Stressful week at work. Need to adjust.';
        v_meds := '["Magnesium 400mg", "Vitamin D 2000IU", "Omega-3 1000mg", "Curcumin 500mg", "Ibuprofen 400mg"]'::jsonb;
        v_protocols := '["Daily supplements", "Heat therapy", "Stress management", "Extra rest"]'::jsonb;
        v_activity := '["Walking 15min", "Light stretching"]'::jsonb;
        v_devices := '["Heating pad", "TENS unit"]'::jsonb;
        v_wearables := '["Oura Ring"]'::jsonb;
        
        INSERT INTO daily_entries (user_id, local_date, mood, sleep_quality, pain, sleep_hours, night_wakes, tags, journal, meds, protocols, activity, devices, wearables)
        VALUES (v_emma_user_id, v_date, v_mood, v_sleep_quality, v_pain, v_sleep_hours, v_night_wakes, v_tags, v_journal, v_meds, v_protocols, v_activity, v_devices, v_wearables);
    END LOOP;
    
    -- August 28-31: Green (back on track 2-3/10 pain)
    FOR i IN 28..31 LOOP
        v_date := '2025-08-' || LPAD(i::TEXT, 2, '0');
        v_mood := 7;
        v_sleep_quality := 7;
        v_pain := CASE WHEN i <= 30 THEN 3 ELSE 2 END;
        v_sleep_hours := 7.2;
        v_night_wakes := 1;
        v_tags := ARRAY['relieved', 'hopeful', 'grateful', 'recovering'];
        v_journal := 'Day ' || i || ' - Pain at ' || v_pain || '/10. Back on track! Adjustments working.';
        v_meds := '["Magnesium 400mg", "Vitamin D 2000IU", "Omega-3 1000mg", "Curcumin 500mg", "Melatonin 3mg"]'::jsonb;
        v_protocols := '["Daily supplements", "Heat therapy", "Exercise", "Sleep hygiene", "Stress management"]'::jsonb;
        v_activity := '["Walking 25min", "Yoga 15min", "Swimming 10min"]'::jsonb;
        v_devices := '["Foam roller"]'::jsonb;
        v_wearables := '["Oura Ring"]'::jsonb;
        
        INSERT INTO daily_entries (user_id, local_date, mood, sleep_quality, pain, sleep_hours, night_wakes, tags, journal, meds, protocols, activity, devices, wearables)
        VALUES (v_emma_user_id, v_date, v_mood, v_sleep_quality, v_pain, v_sleep_hours, v_night_wakes, v_tags, v_journal, v_meds, v_protocols, v_activity, v_devices, v_wearables);
    END LOOP;
    
    -- Add some September data to show continuation
    INSERT INTO daily_entries (user_id, local_date, mood, sleep_quality, pain, sleep_hours, night_wakes, tags, journal, meds, protocols, activity, devices, wearables)
    VALUES 
    (v_emma_user_id, '2025-09-01', 7, 7, 2, 7.5, 1, ARRAY['great', 'confident'], 'September started strong! Pain management working well.', '["Magnesium 400mg", "Vitamin D 2000IU", "Omega-3 1000mg", "Curcumin 500mg"]'::jsonb, '["Daily supplements", "Exercise", "Sleep hygiene"]'::jsonb, '["Walking 30min", "Yoga 20min"]'::jsonb, '["Foam roller"]'::jsonb, '["Oura Ring"]'::jsonb),
    (v_emma_user_id, '2025-09-02', 8, 8, 1, 7.8, 1, ARRAY['amazing', 'grateful', 'healing'], 'Best day in months! Almost pain-free.', '["Magnesium 400mg", "Vitamin D 2000IU", "Omega-3 1000mg", "Curcumin 500mg"]'::jsonb, '["Daily supplements", "Exercise", "Sleep hygiene", "Stress management"]'::jsonb, '["Walking 35min", "Yoga 25min", "Swimming 20min"]'::jsonb, '["Foam roller", "Massage ball"]'::jsonb, '["Oura Ring"]'::jsonb);
    
    RAISE NOTICE 'Mum profile data inserted successfully!';
END $$;
