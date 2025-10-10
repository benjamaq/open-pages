-- ============================================
-- EMMA COMPLETE PROFILE - THOROUGHLY VERIFIED
-- Every column checked against actual schema
-- ============================================

DO $$
DECLARE
    v_emma_user_id UUID;
    v_emma_profile_id UUID;
    v_day_offset INTEGER;
    v_date DATE;
BEGIN
    -- Get Emma's IDs
    SELECT user_id, id INTO v_emma_user_id, v_emma_profile_id
    FROM profiles 
    WHERE slug = 'emma-chronic-pain-journey';
    
    IF v_emma_user_id IS NULL THEN
        RAISE NOTICE 'ERROR: Emma profile not found!';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Found Emma: user_id=%, profile_id=%', v_emma_user_id, v_emma_profile_id;
    
    -- ============================================
    -- WIPE EXISTING DATA
    -- ============================================
    DELETE FROM daily_entries WHERE user_id = v_emma_user_id;
    DELETE FROM journal_entries WHERE profile_id = v_emma_profile_id;
    DELETE FROM stack_followers WHERE owner_user_id = v_emma_user_id;
    DELETE FROM stack_items WHERE profile_id = v_emma_profile_id;
    DELETE FROM protocols WHERE profile_id = v_emma_profile_id;
    
    RAISE NOTICE 'Wiped existing data';
    
    -- ============================================
    -- DAILY ENTRIES (39 days with mood chips)
    -- ============================================
    
    -- September 1-24: RED/ORANGE
    v_date := '2025-09-01';
    FOR v_day_offset IN 0..23 LOOP
        INSERT INTO daily_entries (user_id, local_date, mood, sleep_quality, pain, sleep_hours, night_wakes, tags, journal, meds, protocols, activity, devices, wearables)
        VALUES (
            v_emma_user_id, v_date + v_day_offset,
            CASE v_day_offset % 3 WHEN 0 THEN 2 WHEN 1 THEN 3 ELSE 4 END,
            CASE v_day_offset % 3 WHEN 0 THEN 3 WHEN 1 THEN 4 ELSE 5 END,
            CASE v_day_offset % 3 WHEN 0 THEN 9 WHEN 1 THEN 8 ELSE 7 END,
            5 + (v_day_offset % 3), CASE v_day_offset % 2 WHEN 0 THEN 3 ELSE 2 END,
            ARRAY['absolutely_broken', 'joint_pain', 'fatigue_crash', 'poor_sleep'],
            'Severe pain. Pain ' || (CASE v_day_offset % 3 WHEN 0 THEN '9' WHEN 1 THEN '8' ELSE '7' END) || '/10.',
            '["Ibuprofen 800mg", "Tylenol"]'::jsonb, '["Rest", "Heat therapy"]'::jsonb,
            '["Minimal movement"]'::jsonb, '["Heating pad"]'::jsonb,
            '{"score": 3, "device": "Manual tracking"}'::jsonb
        );
    END LOOP;
    
    -- September 25-29: YELLOW
    FOR v_day_offset IN 24..28 LOOP
        INSERT INTO daily_entries (user_id, local_date, mood, sleep_quality, pain, sleep_hours, night_wakes, tags, journal, meds, protocols, activity, devices, wearables)
        VALUES (
            v_emma_user_id, v_date + v_day_offset,
            CASE (v_day_offset - 24) % 3 WHEN 0 THEN 5 WHEN 1 THEN 6 ELSE 7 END,
            CASE (v_day_offset - 24) % 3 WHEN 0 THEN 6 WHEN 1 THEN 7 ELSE 7 END,
            CASE (v_day_offset - 24) % 3 WHEN 0 THEN 6 WHEN 1 THEN 5 ELSE 4 END,
            6 + ((v_day_offset - 24) % 2), CASE (v_day_offset - 24) % 2 WHEN 0 THEN 2 ELSE 1 END,
            ARRAY['resetting', 'recovering', 'tired_but_trying', 'bit_sore'],
            'Improving. Pain ' || (CASE (v_day_offset - 24) % 3 WHEN 0 THEN '6' WHEN 1 THEN '5' ELSE '4' END) || '/10.',
            '["LDN 3mg", "Magnesium 400mg"]'::jsonb, '["LDN protocol", "Stretching"]'::jsonb,
            '["Walking 15min"]'::jsonb, '["Oura Ring"]'::jsonb,
            '{"score": 6, "recovery_score": 55, "device": "Oura Ring"}'::jsonb
        );
    END LOOP;
    
    -- September 30 - October 9: GREEN
    v_date := '2025-09-30';
    FOR v_day_offset IN 0..9 LOOP
        INSERT INTO daily_entries (user_id, local_date, mood, sleep_quality, pain, sleep_hours, night_wakes, tags, journal, meds, protocols, activity, devices, wearables)
        VALUES (
            v_emma_user_id, v_date + v_day_offset,
            CASE v_day_offset % 3 WHEN 0 THEN 8 WHEN 1 THEN 8 ELSE 9 END,
            CASE v_day_offset % 3 WHEN 0 THEN 8 WHEN 1 THEN 8 ELSE 9 END,
            CASE v_day_offset % 3 WHEN 0 THEN 2 WHEN 1 THEN 2 ELSE 3 END,
            7 + (v_day_offset % 2), CASE v_day_offset % 2 WHEN 0 THEN 1 ELSE 0 END,
            ARRAY['solid_baseline', 'quietly_optimistic', 'calm_steady', 'good_sleep'],
            'Life-changing! Pain ' || (CASE v_day_offset % 3 WHEN 0 THEN '2' WHEN 1 THEN '2' ELSE '3' END) || '/10.',
            '["LDN 4.5mg", "Magnesium 400mg", "Omega-3"]'::jsonb, '["LDN protocol", "Meditation"]'::jsonb,
            '["Walking 30min", "Yoga 20min"]'::jsonb, '["Oura Ring"]'::jsonb,
            CASE WHEN v_day_offset = 9 
                THEN '{"whoop": {"recovery_score": 85, "sleep_score": 88}}'::jsonb
                ELSE '{"score": 8, "recovery_score": 82, "device": "Oura Ring"}'::jsonb
            END
        );
    END LOOP;
    
    -- ============================================
    -- JOURNAL ENTRIES
    -- Schema: profile_id, heading, body, public, created_at
    -- ============================================
    
    INSERT INTO journal_entries (profile_id, heading, body, public, created_at) VALUES
    (v_emma_profile_id, 'Rock Bottom',
     E'I don''t know how much longer I can do this. It''s been 3 months of constant pain - 8 or 9 out of 10 every single day.\n\nMy doctor suggested Low Dose Naltrexone (LDN). I''m scared to hope again. But I''m also desperate. Starting 1.5mg tonight.\n\nIf you''re in chronic pain: I see you. I know how isolating this is.',
     true, '2025-09-10 14:23:00'),
    
    (v_emma_profile_id, 'Week 2: Titrating Up',
     E'Increased to 3mg of LDN tonight. The first week didn''t show much change. LDN typically takes 4-12 weeks to work.\n\nI''m tracking everything: pain, sleep, mood. Using my Oura Ring. The data helps me feel like I have some control.\n\nPain is still 7-9 daily. But I''m committed to giving this 8 weeks.',
     true, '2025-09-18 20:15:00'),
    
    (v_emma_profile_id, 'Something Is Different',
     E'I woke up this morning and my pain was a 5. A FIVE.\n\nI actually cried. I haven''t been below a 7 in months.\n\nMy sleep score was 73 last night (compared to 45-50). I slept through with only 1 wake-up.\n\nI''m on week 3 of LDN at 3mg. Could this be working?',
     true, '2025-09-26 19:30:00'),
    
    (v_emma_profile_id, 'A Week at Pain Level 2',
     E'A full week of waking up at 2-3 instead of 8-9.\n\nThings I did this week:\n• Walked 30 minutes\n• Did 20 minutes of yoga\n• Went swimming\n• Slept 8 hours straight\n\nI titrated up to 4.5mg LDN. For the first time in months, I believe I''ll get there.',
     true, '2025-10-03 21:00:00');
    
    -- ============================================
    -- STACK ITEMS
    -- Schema: profile_id, item_type, name, dose, timing, brand, notes, public, created_at
    -- ============================================
    
    INSERT INTO stack_items (profile_id, item_type, name, dose, timing, brand, notes, public, created_at) VALUES
    (v_emma_profile_id, 'supplements', 'Low Dose Naltrexone', '4.5mg', 'bedtime', 'Compounded', 'Game changer for chronic pain!', true, '2025-09-08'),
    (v_emma_profile_id, 'supplements', 'Magnesium Glycinate', '400mg', 'bedtime', 'Doctor''s Best', 'Helps sleep quality', true, '2025-09-15'),
    (v_emma_profile_id, 'supplements', 'Vitamin D3', '2000 IU', 'morning', 'NOW Foods', 'Was deficient', true, '2025-09-15'),
    (v_emma_profile_id, 'supplements', 'Omega-3', '1000mg', 'morning', 'Nordic Naturals', 'Anti-inflammatory', true, '2025-10-01'),
    (v_emma_profile_id, 'movement', 'Daily Walking', '30min', 'morning', null, 'Low-impact cardio', true, '2025-09-25'),
    (v_emma_profile_id, 'movement', 'Gentle Yoga', '20min', 'afternoon', null, 'Focus on stretching', true, '2025-09-26'),
    (v_emma_profile_id, 'mindfulness', 'Meditation', '15min', 'morning', null, 'Insight Timer app', true, '2025-09-28'),
    (v_emma_profile_id, 'gear', 'Oura Ring Gen 3', null, '24/7', 'Oura', 'Tracks sleep & HRV', true, '2025-09-10'),
    (v_emma_profile_id, 'gear', 'Heating Pad', null, 'as needed', 'Sunbeam', 'Essential for flares', true, '2025-09-01');
    
    -- ============================================
    -- PROTOCOLS
    -- Schema: profile_id, name, description, frequency, public, created_at
    -- ============================================
    
    INSERT INTO protocols (profile_id, name, description, frequency, public, created_at) VALUES
    (v_emma_profile_id, 'LDN Titration', 'Week 1-2: 1.5mg, Week 3-4: 3mg, Week 5+: 4.5mg', 'ongoing', true, '2025-09-08'),
    (v_emma_profile_id, 'Heat Therapy', 'Heating pad 20min on affected areas', 'as needed', true, '2025-09-01'),
    (v_emma_profile_id, 'Sleep Hygiene', 'Cool room, blackout curtains, no screens 1hr before bed', 'nightly', true, '2025-09-20'),
    (v_emma_profile_id, 'Pacing Strategy', 'Rest before exhaustion, not after', 'daily', true, '2025-09-22');
    
    -- ============================================
    -- FOLLOWERS (52)
    -- Schema: owner_user_id, follower_email, verified_at, created_at
    -- NO follower_name column!
    -- ============================================
    
    INSERT INTO stack_followers (owner_user_id, follower_email, verified_at, created_at)
    SELECT
        v_emma_user_id,
        'follower' || gs || '@biostackr.io',
        NOW() - (gs || ' days')::INTERVAL,
        NOW() - (gs || ' days')::INTERVAL
    FROM generate_series(1, 52) gs;
    
    -- ============================================
    -- UPDATE PROFILE
    -- ============================================
    
    UPDATE profiles
    SET
        bio = 'Sharing my journey from chronic pain (9/10) to manageable pain (2/10) using Low Dose Naltrexone. Recovery is possible. 💚',
        show_public_followers = true,
        public = true
    WHERE id = v_emma_profile_id;
    
    -- ============================================
    -- SUCCESS
    -- ============================================
    
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ EMMA PROFILE COMPLETE!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Daily Entries: 39 (Sept 1 - Oct 9)';
    RAISE NOTICE 'Journal Entries: 4';
    RAISE NOTICE 'Stack Items: 9';
    RAISE NOTICE 'Protocols: 4';
    RAISE NOTICE 'Followers: 52';
    RAISE NOTICE '========================================';
    
END $$;

