-- ============================================
-- COMPLETE EMMA CHRONIC PAIN PROFILE (FINAL CORRECTED VERSION)
-- Matches actual database schema
-- ============================================

DO $$
DECLARE
    v_emma_user_id UUID;
    v_emma_profile_id UUID;
    v_day_offset INTEGER;
    v_date DATE;
    v_current_tags TEXT[];
BEGIN
    -- Get Emma's user_id and profile_id
    SELECT user_id, id INTO v_emma_user_id, v_emma_profile_id
    FROM profiles 
    WHERE slug = 'emma-chronic-pain-journey';
    
    IF v_emma_user_id IS NULL THEN
        RAISE NOTICE 'Emma profile not found. Please create the profile first.';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Found Emma: user_id=%, profile_id=%', v_emma_user_id, v_emma_profile_id;
    
    -- ============================================
    -- STEP 1: COMPLETE WIPE (Clean Slate)
    -- ============================================
    DELETE FROM daily_entries WHERE user_id = v_emma_user_id;
    DELETE FROM journal_entries WHERE profile_id = v_emma_profile_id;
    DELETE FROM stack_followers WHERE owner_user_id = v_emma_user_id;
    DELETE FROM stack_items WHERE profile_id = v_emma_profile_id;
    DELETE FROM protocols WHERE profile_id = v_emma_profile_id;
    
    RAISE NOTICE 'Wiped all existing Emma data';
    
    -- ============================================
    -- STEP 2: DAILY ENTRIES WITH MOOD CHIPS
    -- ============================================
    
    -- September 1-24: RED/ORANGE (High Pain Period)
    v_date := '2025-09-01';
    FOR v_day_offset IN 0..23 LOOP
        v_current_tags := ARRAY['absolutely_broken', 'joint_pain', 'fatigue_crash', 'poor_sleep'];
        
        INSERT INTO daily_entries (
            user_id, local_date, mood, sleep_quality, pain, sleep_hours, night_wakes,
            tags, journal, meds, protocols, activity, devices, wearables
        ) VALUES (
            v_emma_user_id,
            v_date + v_day_offset,
            CASE v_day_offset % 3 WHEN 0 THEN 2 WHEN 1 THEN 3 ELSE 4 END,
            CASE v_day_offset % 3 WHEN 0 THEN 3 WHEN 1 THEN 4 ELSE 5 END,
            CASE v_day_offset % 3 WHEN 0 THEN 9 WHEN 1 THEN 8 ELSE 7 END,
            5 + (v_day_offset % 3),
            CASE v_day_offset % 2 WHEN 0 THEN 3 ELSE 2 END,
            v_current_tags,
            'Severe pain day. ' || (CASE v_day_offset % 3
                WHEN 0 THEN 'Pain 9/10. Can barely function.'
                WHEN 1 THEN 'Pain 8/10. Exhausted from fighting this.'
                ELSE 'Pain 7/10. Just trying to make it through.'
            END),
            '["Ibuprofen 800mg", "Tylenol"]'::jsonb,
            '["Rest", "Heat therapy"]'::jsonb,
            '["Minimal movement"]'::jsonb,
            '["Heating pad"]'::jsonb,
            '{"score": 3, "device": "Manual tracking"}'::jsonb
        );
    END LOOP;
    
    -- September 25-29: YELLOW (Improvement Phase)
    FOR v_day_offset IN 24..28 LOOP
        v_current_tags := ARRAY['resetting', 'recovering', 'tired_but_trying', 'bit_sore'];
        
        INSERT INTO daily_entries (
            user_id, local_date, mood, sleep_quality, pain, sleep_hours, night_wakes,
            tags, journal, meds, protocols, activity, devices, wearables
        ) VALUES (
            v_emma_user_id,
            v_date + v_day_offset,
            CASE (v_day_offset - 24) % 3 WHEN 0 THEN 5 WHEN 1 THEN 6 ELSE 7 END,
            CASE (v_day_offset - 24) % 3 WHEN 0 THEN 6 WHEN 1 THEN 7 ELSE 7 END,
            CASE (v_day_offset - 24) % 3 WHEN 0 THEN 6 WHEN 1 THEN 5 ELSE 4 END,
            6 + ((v_day_offset - 24) % 2),
            CASE (v_day_offset - 24) % 2 WHEN 0 THEN 2 ELSE 1 END,
            v_current_tags,
            'Something is shifting. ' || (CASE (v_day_offset - 24) % 3
                WHEN 0 THEN 'Pain 6/10. Could this be working?'
                WHEN 1 THEN 'Pain 5/10. First hope in weeks.'
                ELSE 'Pain 4/10. Real progress happening!'
            END),
            '["LDN 3mg", "Magnesium 400mg", "Vitamin D3 2000IU"]'::jsonb,
            '["LDN protocol", "Gentle stretching", "Heat therapy"]'::jsonb,
            '["Walking 15min", "Yoga 10min"]'::jsonb,
            '["Heating pad", "Oura Ring"]'::jsonb,
            '{"score": 6, "recovery_score": 55, "device": "Oura Ring"}'::jsonb
        );
    END LOOP;
    
    -- September 30 - October 9: GREEN (Recovery Phase)
    v_date := '2025-09-30';
    FOR v_day_offset IN 0..9 LOOP
        v_current_tags := ARRAY['solid_baseline', 'quietly_optimistic', 'calm_steady', 'good_sleep'];
        
        INSERT INTO daily_entries (
            user_id, local_date, mood, sleep_quality, pain, sleep_hours, night_wakes,
            tags, journal, meds, protocols, activity, devices, wearables
        ) VALUES (
            v_emma_user_id,
            v_date + v_day_offset,
            CASE v_day_offset % 3 WHEN 0 THEN 8 WHEN 1 THEN 8 ELSE 9 END,
            CASE v_day_offset % 3 WHEN 0 THEN 8 WHEN 1 THEN 8 ELSE 9 END,
            CASE v_day_offset % 3 WHEN 0 THEN 2 WHEN 1 THEN 2 ELSE 3 END,
            7 + (v_day_offset % 2),
            CASE v_day_offset % 2 WHEN 0 THEN 1 ELSE 0 END,
            v_current_tags,
            'Life-changing improvement! ' || (CASE v_day_offset % 3
                WHEN 0 THEN 'Pain 2/10. Woke up feeling human again.'
                WHEN 1 THEN 'Pain 2/10. This is what normal feels like!'
                ELSE 'Pain 3/10. Still maintaining this progress.'
            END),
            '["LDN 4.5mg", "Magnesium 400mg", "Vitamin D3 2000IU", "Omega-3 1000mg"]'::jsonb,
            '["LDN protocol", "Meditation 15min", "Stretching"]'::jsonb,
            '["Walking 30min", "Yoga 20min", "Swimming 30min"]'::jsonb,
            '["Oura Ring", "Heating pad"]'::jsonb,
            CASE 
                WHEN v_day_offset = 9 THEN 
                    '{"whoop": {"recovery_score": 85, "sleep_score": 88, "strain": 12.4, "hrv": 65, "resting_hr": 58}}'::jsonb
                ELSE 
                    '{"score": 8, "recovery_score": 82, "sleep_score": 85, "device": "Oura Ring"}'::jsonb
            END
        );
    END LOOP;
    
    -- ============================================
    -- STEP 3: JOURNAL ENTRIES (heading + body)
    -- ============================================
    
    INSERT INTO journal_entries (profile_id, heading, body, public, created_at) VALUES
    (v_emma_profile_id, 'Rock Bottom',
     E'I don''t know how much longer I can do this. It''s been 3 months of constant pain - 8 or 9 out of 10 every single day. I can''t sleep. I can''t work properly. I can''t be present with my family.\n\nMy doctor suggested Low Dose Naltrexone (LDN) as a last resort. I''ve tried everything else: physical therapy, acupuncture, every NSAID under the sun. Nothing touches this pain.\n\nI''m scared to hope again. But I''m also desperate. Starting 1.5mg tonight.\n\nIf you''re reading this and you''re in chronic pain: I see you. I know how isolating this is. How exhausting it is to explain to people who don''t understand. How hard it is to keep going when your body feels like it''s fighting against you.\n\nI''m going to document this journey - the good, the bad, and the ugly. If nothing else, maybe it''ll help someone else feel less alone.',
     true, '2025-09-10 14:23:00'),
    
    (v_emma_profile_id, 'Week 2: Titrating Up',
     E'Increased to 3mg of LDN tonight. The first week at 1.5mg didn''t show much change, which my doctor said was expected. LDN typically takes 4-12 weeks to show effects.\n\nI''m tracking everything now: pain levels, sleep quality, mood. Using my Oura Ring to monitor sleep patterns and recovery. The data helps me feel like I have some control in this chaos.\n\nAdded magnesium glycinate (400mg) and Vitamin D3 (2000 IU) to my routine. Research shows both can help with chronic pain and inflammation. At this point, I''ll try anything evidence-based.\n\nPain is still 7-9 daily. But I''m committed to giving this 8 weeks before I decide if it''s working.',
     true, '2025-09-18 20:15:00'),
    
    (v_emma_profile_id, 'Something Is Different',
     E'I woke up this morning and my pain was a 5.\n\nA FIVE.\n\nI actually cried. I haven''t been below a 7 in months. I''m afraid to hope this is real and not just a fluke day.\n\nBut then I realized - yesterday was also better. And the day before. This has been building for the past few days and I was too scared to acknowledge it.\n\nMy sleep score on Oura was 73 last night (compared to 45-50 the past months). I slept through the night with only 1 wake-up instead of 3-4.\n\nI managed to do 15 minutes of walking and 10 minutes of gentle yoga. The first real movement in months that didn''t make things worse.\n\nI''m on week 3 of LDN at 3mg. Could this actually be working? I''m terrified to jinx it, but... I feel like I can see light at the end of the tunnel.\n\nIf you''re in the middle of trying LDN and nothing''s happening yet: hang in there. It took me 3 weeks to see the first signs.',
     true, '2025-09-26 19:30:00'),
    
    (v_emma_profile_id, 'A Week at Pain Level 2',
     E'It''s been a week since the breakthrough. A full week of waking up at pain levels 2-3 instead of 8-9.\n\nI keep waiting for it to stop working. For the pain to come crashing back. But it hasn''t.\n\nThings I''ve done this week that I couldn''t do before:\n• Walked 30 minutes without crying afterward\n• Did 20 minutes of yoga (gentle, but still!)\n• Went swimming for the first time in 6 months\n• Cooked dinner standing up\n• Played with my niece on the floor\n• Slept 8 hours straight\n\nI titrated up to 4.5mg LDN. Added Omega-3 (1000mg) and B12 (1000mcg) based on my doctor''s recommendation.\n\nI''m learning that recovery isn''t just physical. I''m realizing how much chronic pain affected my mental health. How much energy I was spending just surviving each day. How much I withdrew from life.\n\nI have a long way to go, but for the first time in months, I actually believe I''ll get there.',
     true, '2025-10-03 21:00:00');
    
    -- ============================================
    -- STEP 4: STACK ITEMS (supplements, movement, mindfulness, gear)
    -- ============================================
    
    -- Supplements
    INSERT INTO stack_items (profile_id, item_type, name, dose, timing, brand, notes, public, created_at) VALUES
    (v_emma_profile_id, 'supplements', 'Low Dose Naltrexone (LDN)', '4.5mg', 'bedtime', 'Compounded', 'Prescribed for chronic pain. Started at 1.5mg, titrated up over 4 weeks. Game changer!', true, '2025-09-08'),
    (v_emma_profile_id, 'supplements', 'Magnesium Glycinate', '400mg', 'bedtime', 'Doctor''s Best', 'Helps with muscle relaxation and sleep quality. Much better absorbed than magnesium oxide.', true, '2025-09-15'),
    (v_emma_profile_id, 'supplements', 'Vitamin D3', '2000 IU', 'morning', 'NOW Foods', 'Was severely deficient (18 ng/mL). Working to get to optimal range (50-70 ng/mL).', true, '2025-09-15'),
    (v_emma_profile_id, 'supplements', 'Omega-3 Fish Oil', '1000mg', 'morning', 'Nordic Naturals', 'EPA/DHA for anti-inflammatory support.', true, '2025-10-01'),
    (v_emma_profile_id, 'supplements', 'Vitamin B12', '1000mcg', 'morning', 'Jarrow', 'Methylcobalamin form for better absorption. Supports nerve health.', true, '2025-10-01'),
    (v_emma_profile_id, 'supplements', 'Curcumin', '500mg', 'with meals', 'Life Extension', 'With black pepper extract (piperine) for absorption. Anti-inflammatory.', true, '2025-10-05');
    
    -- Movement
    INSERT INTO stack_items (profile_id, item_type, name, dose, timing, notes, public, created_at) VALUES
    (v_emma_profile_id, 'movement', 'Daily Walking', '30min', 'morning', 'Started at 5min, gradually built up. Low-impact cardio without triggering pain.', true, '2025-09-25'),
    (v_emma_profile_id, 'movement', 'Gentle Yoga', '20min', 'afternoon', 'Yoga with Adriene''s "Yoga for Pain Relief" series. Focus on stretching, not intensity.', true, '2025-09-26'),
    (v_emma_profile_id, 'movement', 'Swimming', '30min', 'flexible', 'Pool therapy. Zero impact on joints. Water temperature matters - warm is better.', true, '2025-10-01'),
    (v_emma_profile_id, 'movement', 'Stretching Routine', '15min', 'morning & evening', 'Focus on problem areas. Never stretch into pain. Gentle, sustained holds.', true, '2025-09-20');
    
    -- Mindfulness
    INSERT INTO stack_items (profile_id, item_type, name, dose, timing, notes, public, created_at) VALUES
    (v_emma_profile_id, 'mindfulness', 'Meditation Practice', '15min', 'morning', 'Insight Timer app. Focus on body scan and breath work. Helps with pain perception.', true, '2025-09-28'),
    (v_emma_profile_id, 'mindfulness', 'Box Breathing', '5min', 'as needed', 'Inhale 4, hold 4, exhale 4, hold 4. Activates parasympathetic nervous system.', true, '2025-09-15'),
    (v_emma_profile_id, 'mindfulness', 'Gratitude Journaling', '5min', 'bedtime', 'Write 3 things I''m grateful for. Shifts focus from pain to positives.', true, '2025-10-03');
    
    -- Gear
    INSERT INTO stack_items (profile_id, item_type, name, timing, brand, notes, public, created_at) VALUES
    (v_emma_profile_id, 'gear', 'Oura Ring Gen 3', '24/7', 'Oura', 'Tracks sleep stages, HRV, recovery. Data helped me see patterns between sleep and pain levels.', true, '2025-09-10'),
    (v_emma_profile_id, 'gear', 'Heating Pad', 'as needed', 'Sunbeam', 'Essential during high pain days. Large size covers more area. Auto-shutoff for safety.', true, '2025-09-01'),
    (v_emma_profile_id, 'gear', 'Foam Roller', 'post-movement', 'TriggerPoint', 'Self-myofascial release. Start gentle! Too much pressure can trigger flares.', true, '2025-10-02');
    
    -- ============================================
    -- STEP 5: PROTOCOLS (separate table)
    -- ============================================
    
    INSERT INTO protocols (profile_id, name, details, frequency, public, created_at) VALUES
    (v_emma_profile_id, 'LDN Titration Protocol', 'Week 1-2: 1.5mg, Week 3-4: 3mg, Week 5+: 4.5mg. Gradual increase reduces side effects.', 'ongoing', true, '2025-09-08'),
    (v_emma_profile_id, 'Heat Therapy', 'Heating pad on affected areas for 20min. Helps relax muscles and reduce pain during flares.', 'as needed', true, '2025-09-01'),
    (v_emma_profile_id, 'Sleep Hygiene Routine', 'Cool room (65-68°F), blackout curtains, no screens 1hr before bed, magnesium at bedtime.', 'nightly', true, '2025-09-20'),
    (v_emma_profile_id, 'Pacing Strategy', 'Break activities into small chunks. Rest before getting exhausted, not after. Prevents crashes.', 'daily', true, '2025-09-22');
    
    -- ============================================
    -- STEP 6: FOLLOWERS (52 followers)
    -- ============================================
    
    INSERT INTO stack_followers (owner_user_id, follower_email, follower_name, verified_at, created_at)
    SELECT
        v_emma_user_id,
        'follower' || gs || '@biostackr-community.com',
        CASE (gs % 10)
            WHEN 0 THEN 'Sarah M.'
            WHEN 1 THEN 'James K.'
            WHEN 2 THEN 'Maria G.'
            WHEN 3 THEN 'David L.'
            WHEN 4 THEN 'Lisa P.'
            WHEN 5 THEN 'Michael R.'
            WHEN 6 THEN 'Jennifer T.'
            WHEN 7 THEN 'Robert W.'
            WHEN 8 THEN 'Emily C.'
            ELSE 'Alex B.'
        END || ' #' || gs,
        NOW() - (gs || ' days')::INTERVAL,
        NOW() - (gs || ' days')::INTERVAL
    FROM generate_series(1, 52) gs;
    
    -- ============================================
    -- STEP 7: UPDATE PROFILE
    -- ============================================
    
    UPDATE profiles
    SET
        bio = 'Sharing my journey from chronic pain (9/10 daily) to manageable pain (2/10) using Low Dose Naltrexone, evidence-based supplements, and gentle movement. Here to show that recovery is possible and you''re not alone. 💚',
        show_public_followers = true,
        public = true
    WHERE id = v_emma_profile_id;
    
    -- ============================================
    -- SUCCESS SUMMARY
    -- ============================================
    
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ EMMA PROFILE COMPLETE!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Daily Entries: 39 days with mood chips';
    RAISE NOTICE 'Journal Entries: 4 authentic entries';
    RAISE NOTICE 'Supplements: 6 items';
    RAISE NOTICE 'Movement: 4 items';
    RAISE NOTICE 'Mindfulness: 3 items';
    RAISE NOTICE 'Gear: 3 items';
    RAISE NOTICE 'Protocols: 4 items';
    RAISE NOTICE 'Followers: 52 verified followers';
    RAISE NOTICE '========================================';
    
END $$;

