-- ============================================
-- COMPLETE EMMA CHRONIC PAIN PROFILE (CORRECTED)
-- Research-based demo account with full details
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
    
    RAISE NOTICE 'Wiped all existing Emma data';
    
    -- ============================================
    -- STEP 2: DAILY ENTRIES WITH MOOD CHIPS
    -- ============================================
    
    -- September 1-24: RED/ORANGE (High Pain Period)
    -- Tags: absolutely_broken, joint_pain, fatigue_crash, poor_sleep
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
                WHEN 0 THEN 'Pain 9/10. Can barely function. Need help.'
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
    -- Tags: resetting, recovering, tired_but_trying, bit_sore
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
    -- Tags: solid_baseline, quietly_optimistic, calm_steady, good_sleep
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
    -- STEP 3: AUTHENTIC JOURNAL ENTRIES
    -- ============================================
    
    -- Journal Entry 1: The Desperation Phase (Sept 10)
    INSERT INTO journal_entries (profile_id, heading, body, public, created_at)
    VALUES (
        v_emma_profile_id,
        'Rock Bottom',
        E'I don''t know how much longer I can do this. It''s been 3 months of constant pain - 8 or 9 out of 10 every single day. I can''t sleep. I can''t work properly. I can''t be present with my family.\n\nMy doctor suggested Low Dose Naltrexone (LDN) as a last resort. I''ve tried everything else: physical therapy, acupuncture, every NSAID under the sun. Nothing touches this pain.\n\nI''m scared to hope again. But I''m also desperate. Starting 1.5mg tonight.\n\nIf you''re reading this and you''re in chronic pain: I see you. I know how isolating this is. How exhausting it is to explain to people who don''t understand. How hard it is to keep going when your body feels like it''s fighting against you.\n\nI''m going to document this journey - the good, the bad, and the ugly. If nothing else, maybe it''ll help someone else feel less alone.',
        true,
        '2025-09-10 14:23:00'
    );
    
    -- Journal Entry 2: First Adjustments (Sept 18)
    INSERT INTO journal_entries (profile_id, heading, body, public, created_at)
    VALUES (
        v_emma_profile_id,
        'Week 2: Titrating Up',
        E'Increased to 3mg of LDN tonight. The first week at 1.5mg didn''t show much change, which my doctor said was expected. LDN typically takes 4-12 weeks to show effects.\n\nI''m tracking everything now: pain levels, sleep quality, mood. Using my Oura Ring to monitor sleep patterns and recovery. The data helps me feel like I have some control in this chaos.\n\nAdded magnesium glycinate (400mg) and Vitamin D3 (2000 IU) to my routine. Research shows both can help with chronic pain and inflammation. At this point, I''ll try anything evidence-based.\n\nPain is still 7-9 daily. But I''m committed to giving this 8 weeks before I decide if it''s working.',
        true,
        '2025-09-18 20:15:00'
    );
    
    -- Journal Entry 3: The Turning Point (Sept 26)
    INSERT INTO journal_entries (profile_id, heading, body, public, created_at)
    VALUES (
        v_emma_profile_id,
        'Something Is Different',
        E'I woke up this morning and my pain was a 5.\n\nA FIVE.\n\nI actually cried. I haven''t been below a 7 in months. I''m afraid to hope this is real and not just a fluke day.\n\nBut then I realized - yesterday was also better. And the day before. This has been building for the past few days and I was too scared to acknowledge it.\n\nMy sleep score on Oura was 73 last night (compared to 45-50 the past months). I slept through the night with only 1 wake-up instead of 3-4.\n\nI managed to do 15 minutes of walking and 10 minutes of gentle yoga. The first real movement in months that didn''t make things worse.\n\nI''m on week 3 of LDN at 3mg. Could this actually be working? I''m terrified to jinx it, but... I feel like I can see light at the end of the tunnel.\n\nIf you''re in the middle of trying LDN and nothing''s happening yet: hang in there. It took me 3 weeks to see the first signs.',
        true,
        '2025-09-26 19:30:00'
    );
    
    -- Journal Entry 4: New Normal (Oct 3)
    INSERT INTO journal_entries (profile_id, heading, body, public, created_at)
    VALUES (
        v_emma_profile_id,
        'A Week at Pain Level 2',
        E'It''s been a week since the breakthrough. A full week of waking up at pain levels 2-3 instead of 8-9.\n\nI keep waiting for it to stop working. For the pain to come crashing back. But it hasn''t.\n\nThings I''ve done this week that I couldn''t do before:\n• Walked 30 minutes without crying afterward\n• Did 20 minutes of yoga (gentle, but still!)\n• Went swimming for the first time in 6 months\n• Cooked dinner standing up\n• Played with my niece on the floor\n• Slept 8 hours straight\n\nI titrated up to 4.5mg LDN. Added Omega-3 (1000mg) and B12 (1000mcg) based on my doctor''s recommendation.\n\nI''m learning that recovery isn''t just physical. I''m realizing how much chronic pain affected my mental health. How much energy I was spending just surviving each day. How much I withdrew from life.\n\nI have a long way to go, but for the first time in months, I actually believe I''ll get there.',
        true,
        '2025-10-03 21:00:00'
    );
    
    -- Journal Entry 5: Reflection (Oct 8)
    INSERT INTO journal_entries (profile_id, heading, body, public, created_at)
    VALUES (
        v_emma_profile_id,
        'What Chronic Pain Taught Me',
        E'Looking back at my heatmap: September 1-24 is solid red. September 25-29 shifts to yellow. September 30 onward is green.\n\nThat visual tells the story better than I ever could.\n\nBut here''s what the heatmap doesn''t show:\n\n**The isolation.** Chronic pain is invisible. People don''t see it, so they forget it''s there. You end up feeling like a burden for still being in pain when everyone else has moved on.\n\n**The guilt.** Guilt for not being able to do things. Guilt for canceling plans. Guilt for being "difficult" about medication. Guilt for taking up space with your needs.\n\n**The fear.** Every good day comes with the fear that tomorrow it''ll be bad again. Every treatment comes with the fear it won''t work.\n\n**The strength.** I didn''t know I had this much strength. Every single day I got up and tried again, even when it felt hopeless. That''s not weakness - that''s warrior-level strength.\n\nIf you''re in chronic pain right now:\n1. You''re not alone, even when it feels like it\n2. Your pain is real, even if tests don''t show it\n3. Keep trying - there''s no single solution, but there are solutions\n4. Track your data - it helped me see patterns I would have missed\n5. Be patient with yourself\n\nLDN isn''t a miracle cure. I still have pain some days. But going from 9/10 to 2/10? That gave me my life back.\n\nThank you for following this journey with me. Here''s to all of us fighting invisible battles. 💚',
        true,
        '2025-10-08 16:45:00'
    );
    
    -- Journal Entry 6: Tips for Others (Oct 9)
    INSERT INTO journal_entries (profile_id, heading, body, public, created_at)
    VALUES (
        v_emma_profile_id,
        'My Complete Protocol (For Those Asking)',
        E'I''ve gotten so many messages asking what exactly I''m doing, so here''s my full protocol:\n\n**Medications:**\n• LDN (Low Dose Naltrexone) 4.5mg - taken at bedtime\n• Started at 1.5mg, titrated up over 4 weeks\n• Prescribed by my pain specialist\n\n**Supplements (Daily):**\n• Magnesium Glycinate 400mg (bedtime - helps sleep & muscles)\n• Vitamin D3 2000 IU (morning - I was severely deficient)\n• Omega-3 1000mg (anti-inflammatory)\n• B12 1000mcg (nerve health)\n\n**Movement (What I Can Tolerate Now):**\n• Walking 30 min daily\n• Gentle yoga 20 min (Yoga with Adriene''s "Yoga for Pain Relief")\n• Swimming 2-3x/week (super low impact)\n• Stretching 10-15 min\n\n**Mindfulness:**\n• Meditation 15 min daily (Insight Timer app)\n• Breathwork when pain spikes\n• Gratitude journaling\n\n**Tools/Gear:**\n• Heating pad (my best friend during flares)\n• Oura Ring (tracking sleep & recovery)\n• Foam roller\n• Ergonomic desk setup\n\n**What Didn''t Work For Me:**\n• High-dose NSAIDs (stomach issues)\n• Gabapentin (side effects were worse than pain)\n• Pushing through pain (always made it worse)\n• Ignoring my body''s signals\n\n**Key Lessons:**\n1. Give LDN at least 8-12 weeks before deciding\n2. Track everything - data reveals patterns\n3. Start movement small and build gradually\n4. Sleep quality matters as much as pain levels\n5. Find a doctor who believes you\n\nRemember: this is what worked for ME. Everyone''s pain is different. Work with your doctor to find your protocol.\n\nKeep going. You''ve got this. 💪',
        true,
        '2025-10-09 18:30:00'
    );
    
    -- ============================================
    -- STEP 4: STACK ITEMS (Supplements)
    -- ============================================
    
    INSERT INTO stack_items (profile_id, item_type, name, dosage, frequency, timing, notes, public, created_at)
    VALUES
        (v_emma_profile_id, 'supplements', 'Low Dose Naltrexone (LDN)', '4.5mg', 'daily', 'bedtime', 'Prescribed for chronic pain. Started at 1.5mg, titrated up over 4 weeks. Game changer!', true, '2025-09-08'),
        (v_emma_profile_id, 'supplements', 'Magnesium Glycinate', '400mg', 'daily', 'bedtime', 'Helps with muscle relaxation and sleep quality. Much better absorbed than magnesium oxide.', true, '2025-09-15'),
        (v_emma_profile_id, 'supplements', 'Vitamin D3', '2000 IU', 'daily', 'morning', 'Was severely deficient (18 ng/mL). Working to get to optimal range (50-70 ng/mL).', true, '2025-09-15'),
        (v_emma_profile_id, 'supplements', 'Omega-3 Fish Oil', '1000mg', 'daily', 'morning', 'EPA/DHA for anti-inflammatory support. Nordic Naturals brand.', true, '2025-10-01'),
        (v_emma_profile_id, 'supplements', 'Vitamin B12 (Methylcobalamin)', '1000mcg', 'daily', 'morning', 'Methylated form for better absorption. Supports nerve health.', true, '2025-10-01'),
        (v_emma_profile_id, 'supplements', 'Curcumin (Turmeric)', '500mg', 'twice daily', 'with meals', 'With black pepper extract (piperine) for absorption. Anti-inflammatory.', true, '2025-10-05');
    
    -- ============================================
    -- STEP 5: PROTOCOLS
    -- ============================================
    
    INSERT INTO stack_items (profile_id, item_type, name, dosage, frequency, timing, notes, public, created_at)
    VALUES
        (v_emma_profile_id, 'protocols', 'LDN Titration Protocol', null, 'ongoing', 'bedtime', 'Week 1-2: 1.5mg, Week 3-4: 3mg, Week 5+: 4.5mg. Gradual increase reduces side effects.', true, '2025-09-08'),
        (v_emma_profile_id, 'protocols', 'Heat Therapy', '20min', 'as needed', 'during flares', 'Heating pad on affected areas. Helps relax muscles and reduce pain during flares.', true, '2025-09-01'),
        (v_emma_profile_id, 'protocols', 'Sleep Hygiene Routine', null, 'nightly', 'bedtime', 'Cool room (65-68°F), blackout curtains, no screens 1hr before bed, magnesium at bedtime.', true, '2025-09-20'),
        (v_emma_profile_id, 'protocols', 'Pacing Strategy', null, 'daily', 'all day', 'Break activities into small chunks. Rest before getting exhausted, not after. Prevents crashes.', true, '2025-09-22'),
        (v_emma_profile_id, 'protocols', 'Anti-Inflammatory Diet', null, 'daily', 'all meals', 'Focus on whole foods, omega-3s, colorful vegetables. Limit processed foods and sugar.', true, '2025-09-28');
    
    -- ============================================
    -- STEP 6: MOVEMENT
    -- ============================================
    
    INSERT INTO stack_items (profile_id, item_type, name, dosage, frequency, timing, notes, public, created_at)
    VALUES
        (v_emma_profile_id, 'movement', 'Daily Walking', '30min', 'daily', 'morning', 'Started at 5min, gradually built up. Low-impact cardio without triggering pain.', true, '2025-09-25'),
        (v_emma_profile_id, 'movement', 'Gentle Yoga', '20min', '5x/week', 'afternoon', 'Yoga with Adriene''s "Yoga for Pain Relief" series. Focus on stretching, not intensity.', true, '2025-09-26'),
        (v_emma_profile_id, 'movement', 'Swimming', '30min', '2-3x/week', 'flexible', 'Pool therapy. Zero impact on joints. Water temperature matters - warm is better.', true, '2025-10-01'),
        (v_emma_profile_id, 'movement', 'Stretching Routine', '15min', 'daily', 'morning & evening', 'Focus on problem areas. Never stretch into pain. Gentle, sustained holds.', true, '2025-09-20');
    
    -- ============================================
    -- STEP 7: MINDFULNESS
    -- ============================================
    
    INSERT INTO stack_items (profile_id, item_type, name, dosage, frequency, timing, notes, public, created_at)
    VALUES
        (v_emma_profile_id, 'mindfulness', 'Meditation Practice', '15min', 'daily', 'morning', 'Insight Timer app. Focus on body scan and breath work. Helps with pain perception.', true, '2025-09-28'),
        (v_emma_profile_id, 'mindfulness', 'Box Breathing', '5min', 'as needed', 'during pain spikes', 'Inhale 4, hold 4, exhale 4, hold 4. Activates parasympathetic nervous system.', true, '2025-09-15'),
        (v_emma_profile_id, 'mindfulness', 'Gratitude Journaling', '5min', 'daily', 'bedtime', 'Write 3 things I''m grateful for. Shifts focus from pain to positives.', true, '2025-10-03'),
        (v_emma_profile_id, 'mindfulness', 'Progressive Muscle Relaxation', '10min', '3x/week', 'bedtime', 'Tense and release each muscle group. Reduces overall tension and improves sleep.', true, '2025-10-05');
    
    -- ============================================
    -- STEP 8: GEAR/DEVICES
    -- ============================================
    
    INSERT INTO stack_items (profile_id, item_type, name, dosage, frequency, timing, notes, public, created_at)
    VALUES
        (v_emma_profile_id, 'gear', 'Oura Ring Gen 3', null, 'continuous', '24/7', 'Tracks sleep stages, HRV, recovery. Data helped me see patterns between sleep and pain levels.', true, '2025-09-10'),
        (v_emma_profile_id, 'gear', 'Heating Pad (Large)', null, 'as needed', 'during flares', 'Essential during high pain days. Large size covers more area. Auto-shutoff for safety.', true, '2025-09-01'),
        (v_emma_profile_id, 'gear', 'Foam Roller', null, '3x/week', 'post-movement', 'Self-myofascial release. Start gentle! Too much pressure can trigger flares.', true, '2025-10-02'),
        (v_emma_profile_id, 'gear', 'Ergonomic Desk Setup', null, 'continuous', 'work hours', 'Standing desk, ergonomic chair, monitor at eye level. Proper posture = less pain.', true, '2025-09-20'),
        (v_emma_profile_id, 'gear', 'TENS Unit', null, 'as needed', 'during flares', 'Drug-free pain relief through electrical stimulation. Helpful for breakthrough pain.', true, '2025-09-12');
    
    -- ============================================
    -- STEP 9: FOLLOWERS (52 followers)
    -- ============================================
    
    -- Create 52 verified followers for Emma
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
    -- STEP 10: UPDATE PROFILE METADATA
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
    RAISE NOTICE 'Daily Entries: 39 days (Sept 1 - Oct 9)';
    RAISE NOTICE '  - Sept 1-24: Red/Orange (pain 7-9, mood 2-4)';
    RAISE NOTICE '  - Sept 25-29: Yellow (pain 4-6, mood 5-7)';
    RAISE NOTICE '  - Sept 30-Oct 9: Green (pain 2-3, mood 8-9)';
    RAISE NOTICE 'Journal Entries: 6 authentic, research-based entries';
    RAISE NOTICE 'Stack Items:';
    RAISE NOTICE '  - Supplements: 6 items';
    RAISE NOTICE '  - Protocols: 5 items';
    RAISE NOTICE '  - Movement: 4 items';
    RAISE NOTICE '  - Mindfulness: 4 items';
    RAISE NOTICE '  - Gear: 5 items';
    RAISE NOTICE 'Followers: 52 verified followers';
    RAISE NOTICE 'Mood Chips: 4 chips per entry (context tags)';
    RAISE NOTICE '========================================';
    
END $$;

