-- ============================================
-- EMMA COMPLETE PROFILE - FINAL CLEAN VERSION
-- ============================================
-- This script populates Emma's complete profile with:
-- - 40 days of mood/sleep/pain data (Aug 31 - Oct 10)
-- - 6 journal entries matching the heatmap progression
-- - 15+ supplements, protocols, movement, mindfulness items
-- - 5 gear items (Oura Ring, heating pad, etc.)
-- - 3 library items (doctor reports, lab results)
-- - 52 followers
-- - Mood chips for all entries

DO $$
DECLARE
    v_emma_user_id UUID;
    v_emma_profile_id UUID;
    v_day_offset INTEGER;
    v_date DATE;
BEGIN
    -- Get Emma's IDs
    SELECT user_id, id INTO v_emma_user_id, v_emma_profile_id
    FROM profiles WHERE slug = 'emma-chronic-pain-journey';
    
    IF v_emma_user_id IS NULL THEN
        RAISE NOTICE 'ERROR: Emma profile not found!';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Found Emma: user_id=%, profile_id=%', v_emma_user_id, v_emma_profile_id;
    
    -- Clean existing data
    DELETE FROM daily_entries WHERE user_id = v_emma_user_id;
    DELETE FROM journal_entries WHERE profile_id = v_emma_profile_id;
    DELETE FROM stack_followers WHERE owner_user_id = v_emma_user_id;
    DELETE FROM stack_items WHERE profile_id = v_emma_profile_id;
    DELETE FROM protocols WHERE profile_id = v_emma_profile_id;
    DELETE FROM gear WHERE profile_id = v_emma_profile_id;
    DELETE FROM library_items WHERE profile_id = v_emma_profile_id;
    
    RAISE NOTICE 'Wiped all existing data';
    
    -- ============================================
    -- DAILY ENTRIES (40 days with mood chips)
    -- ============================================
    
    -- Aug 31: RED (baseline - severe pain before LDN)
    INSERT INTO daily_entries (user_id, local_date, mood, sleep_quality, pain, sleep_hours, night_wakes, tags, journal, meds, protocols, activity, devices, wearables)
    VALUES (
        v_emma_user_id, '2025-08-31',
        2, 3, 9, 5.5, 4,
        ARRAY['exhausted', 'frustrated', 'overwhelmed', 'hopeless'],
        'Last day before starting LDN. Pain at its worst - 9/10. Barely sleeping. This is rock bottom.',
        '["Ibuprofen 800mg", "Melatonin 3mg"]'::jsonb,
        '["Heat therapy", "Rest"]'::jsonb,
        '["Light stretching", "Walking 10min"]'::jsonb,
        '["Heating pad"]'::jsonb,
        '["Oura Ring"]'::json
    );
    
    -- Sept 1-24: RED/ORANGE (pain 7-9, mood 2-4)
    v_date := '2025-09-01';
    FOR v_day_offset IN 0..23 LOOP
        INSERT INTO daily_entries (user_id, local_date, mood, sleep_quality, pain, sleep_hours, night_wakes, tags, journal, meds, protocols, activity, devices, wearables)
        VALUES (
            v_emma_user_id, v_date + v_day_offset,
            CASE v_day_offset % 3 WHEN 0 THEN 2 WHEN 1 THEN 3 ELSE 4 END,
            CASE v_day_offset % 3 WHEN 0 THEN 3 WHEN 1 THEN 4 ELSE 5 END,
            CASE v_day_offset % 3 WHEN 0 THEN 9 WHEN 1 THEN 8 ELSE 7 END,
            CASE v_day_offset % 3 WHEN 0 THEN 5.5 WHEN 1 THEN 6.0 ELSE 6.5 END,
            CASE v_day_offset % 3 WHEN 0 THEN 4 WHEN 1 THEN 3 ELSE 2 END,
            ARRAY['exhausted', 'frustrated', 'overwhelmed', 'hopeless'],
            CASE v_day_offset % 7 
                WHEN 0 THEN 'Another terrible night. Pain at 9/10. LDN not helping yet.'
                WHEN 1 THEN 'Slept 5.5 hours. Woke up 4 times from pain. This is hell.'
                WHEN 2 THEN 'Pain slightly better today - 8/10. Maybe LDN is starting to work?'
                WHEN 3 THEN 'Bad day. Pain back to 9/10. Feeling hopeless about recovery.'
                WHEN 4 THEN 'Pain at 8/10. Sleep improving slightly - 6 hours last night.'
                WHEN 5 THEN 'Another rough night. Pain at 7/10. Trying to stay positive.'
                ELSE 'Pain at 8/10. Sleep still poor. Hoping for breakthrough soon.'
            END,
            '["LDN 1.5mg", "Magnesium 400mg", "Ibuprofen 600mg"]'::jsonb,
            '["Heat therapy", "Light stretching", "Rest"]'::jsonb,
            '["Walking 15min", "Gentle yoga"]'::jsonb,
            '["Heating pad", "TENS unit"]'::jsonb,
            '["Oura Ring"]'
        );
    END LOOP;
    
    -- Sept 25-29: YELLOW/GREEN (pain 4-6, mood 5-7)
    v_date := '2025-09-25';
    FOR v_day_offset IN 0..4 LOOP
        INSERT INTO daily_entries (user_id, local_date, mood, sleep_quality, pain, sleep_hours, night_wakes, tags, journal, meds, protocols, activity, devices, wearables)
        VALUES (
            v_emma_user_id, v_date + v_day_offset,
            CASE (v_day_offset - 24) % 3 WHEN 0 THEN 5 WHEN 1 THEN 6 ELSE 7 END,
            CASE (v_day_offset - 24) % 3 WHEN 0 THEN 6 WHEN 1 THEN 7 ELSE 7 END,
            CASE (v_day_offset - 24) % 3 WHEN 0 THEN 6 WHEN 1 THEN 5 ELSE 4 END,
            CASE (v_day_offset - 24) % 3 WHEN 0 THEN 7.0 WHEN 1 THEN 7.5 ELSE 8.0 END,
            CASE (v_day_offset - 24) % 3 WHEN 0 THEN 2 WHEN 1 THEN 1 ELSE 1 END,
            ARRAY['hopeful', 'grateful', 'determined', 'progress'],
            CASE v_day_offset
                WHEN 0 THEN 'BREAKTHROUGH! Pain down to 6/10. Slept 7 hours! LDN is working!'
                WHEN 1 THEN 'Pain at 5/10 today. This is the best I''ve felt in months!'
                WHEN 2 THEN 'Pain at 4/10. Slept 8 hours! I''m starting to feel human again.'
                WHEN 3 THEN 'Pain at 5/10. Sleep quality improving. Energy levels up!'
                ELSE 'Pain at 6/10. Still some bad days but overall trending upward!'
            END,
            '["LDN 3mg", "Magnesium 400mg", "Vitamin D3 2000IU"]'::jsonb,
            '["Heat therapy", "Sleep hygiene", "Pacing strategy"]'::jsonb,
            '["Walking 30min", "Yoga", "Swimming"]'::jsonb,
            '["Heating pad", "Foam roller"]'::jsonb,
            '["Oura Ring"]'
        );
    END LOOP;
    
    -- Sept 30 - Oct 10: GREEN (pain 2-3, mood 8-9)
    v_date := '2025-09-30';
    FOR v_day_offset IN 0..10 LOOP
        INSERT INTO daily_entries (user_id, local_date, mood, sleep_quality, pain, sleep_hours, night_wakes, tags, journal, meds, protocols, activity, devices, wearables)
        VALUES (
            v_emma_user_id, v_date + v_day_offset,
            CASE v_day_offset % 3 WHEN 0 THEN 8 WHEN 1 THEN 8 ELSE 9 END,
            CASE v_day_offset % 3 WHEN 0 THEN 8 WHEN 1 THEN 8 ELSE 9 END,
            CASE v_day_offset % 3 WHEN 0 THEN 3 WHEN 1 THEN 2 ELSE 2 END,
            CASE v_day_offset % 3 WHEN 0 THEN 8.0 WHEN 1 THEN 8.5 ELSE 9.0 END,
            CASE v_day_offset % 3 WHEN 0 THEN 1 WHEN 1 THEN 0 ELSE 0 END,
            ARRAY['amazing', 'grateful', 'energetic', 'optimistic'],
            CASE v_day_offset % 7
                WHEN 0 THEN 'Pain at 2/10! Slept 9 hours! I feel like a new person!'
                WHEN 1 THEN 'Pain at 3/10. Energy levels incredible. LDN is a miracle!'
                WHEN 2 THEN 'Pain at 2/10. Sleep quality excellent. Life is good again!'
                WHEN 3 THEN 'Pain at 2/10. Feeling amazing. Ready to help others!'
                WHEN 4 THEN 'Pain at 3/10. Still some days but overall incredible progress!'
                WHEN 5 THEN 'Pain at 2/10. Sleep perfect. Energy through the roof!'
                ELSE 'Pain at 2/10. Living proof that chronic pain can be managed!'
            END,
            '["LDN 4.5mg", "Magnesium 400mg", "Vitamin D3 2000IU", "Omega-3 1000mg"]'::jsonb,
            '["Sleep hygiene", "Pacing strategy", "Heat therapy"]'::jsonb,
            '["Walking 45min", "Yoga", "Swimming", "Strength training"]'::jsonb,
            '["Oura Ring", "Foam roller"]'::jsonb,
            '["Oura Ring"]'
        );
    END LOOP;
    
    RAISE NOTICE 'Inserted 40 daily entries';
    
    -- ============================================
    -- JOURNAL ENTRIES (6 entries matching heatmap)
    -- ============================================
    
    INSERT INTO journal_entries (profile_id, heading, body, public, created_at) VALUES
    (v_emma_profile_id, 'Rock Bottom', 'I don''t know how much longer I can do this. It''s been 3 months of constant pain - 8 or 9 out of 10 every single day. I can''t sleep. I can''t work properly. I can''t be present with my family.

My doctor suggested Low Dose Naltrexone (LDN) as a last resort. I''ve tried everything else: physical therapy, acupuncture, every NSAID under the sun. Nothing touches this pain.

I''m scared to hope again. But I''m also desperate. Starting 1.5mg tonight.

If you''re reading this and you''re in chronic pain: I see you. I know how isolating this is. How exhausting it is to explain to people who don''t understand. How hard it is to keep going when your body feels like it''s fighting against you.

I''m going to document this journey - the good, the bad, and the ugly. If nothing else, maybe it''ll help someone else feel less alone.', true, '2025-09-01 14:23:00'),

    (v_emma_profile_id, 'Two Weeks In - Still Struggling', 'It''s been two weeks on LDN and honestly? I''m not seeing much improvement. Pain is still 8-9/10 most days. Sleep is still terrible. I''m exhausted.

My doctor said it can take 4-6 weeks to see full effects, but I''m starting to lose hope. The side effects aren''t bad - some vivid dreams, but that''s manageable.

I''m tracking everything meticulously. Maybe I''m expecting too much too soon. Chronic pain recovery isn''t linear, right?

Trying to stay positive but it''s hard when every day feels like a battle.', true, '2025-09-15 20:15:00'),

    (v_emma_profile_id, 'The Breakthrough', 'OH MY GOD. Today was different. Pain was 6/10 instead of 9/10. I slept 7 hours straight last night instead of 5.5 with constant wake-ups.

Is this it? Is this the breakthrough I''ve been waiting for?

I''m trying not to get too excited - it could just be a good day. But something feels different. My energy levels are up. I''m not constantly exhausted.

LDN at 3mg now. Maybe the higher dose is what I needed. Or maybe my body just needed time to adjust.

I''m cautiously optimistic. This could be the turning point.', true, '2025-09-25 16:42:00'),

    (v_emma_profile_id, 'One Month Update - Game Changer', 'One month on LDN and I can honestly say it''s been life-changing. Pain is down to 3-4/10 most days. I''m sleeping 8+ hours regularly. Energy levels are incredible.

The data doesn''t lie - my heatmap went from red/orange to yellow/green. The improvement is real and measurable.

I''m back to activities I thought I''d never do again. Walking 30+ minutes. Swimming. Even some light strength training.

To anyone considering LDN for chronic pain: it''s not a magic bullet, but it''s the closest thing I''ve found. The key is patience and proper titration.', true, '2025-09-30 11:30:00'),

    (v_emma_profile_id, 'Six Weeks - Living Again', 'Six weeks on LDN and I feel like I''m living again, not just surviving. Pain is 2-3/10 most days. I''m sleeping 9 hours and feeling refreshed.

The transformation in my mood tracking is incredible. From constant red/orange to consistent green. My sleep scores went from 3-4 to 8-9.

I''m back at work full-time. I''m present with my family again. I''m planning for the future instead of just trying to get through each day.

LDN gave me my life back. I''m sharing my story because I know how desperate chronic pain makes you feel. There is hope.', true, '2025-10-05 09:15:00'),

    (v_emma_profile_id, 'Two Months - Paying It Forward', 'Two months on LDN and I''m thriving. Pain is consistently 2/10. Sleep is excellent. Energy levels are through the roof.

But the best part? I''m now helping others. Sharing my protocol, my data, my story. The chronic pain community needs hope and real solutions.

LDN isn''t the only answer - it''s part of a comprehensive approach. Proper sleep hygiene, pacing, heat therapy, the right supplements. But it was the missing piece for me.

If you''re reading this and struggling with chronic pain: don''t give up. Keep trying. Keep tracking. Keep looking for answers. Your breakthrough might be just around the corner.', true, '2025-10-10 14:20:00');
    
    RAISE NOTICE 'Inserted 6 journal entries';
    
    -- ============================================
    -- STACK ITEMS (15+ items)
    -- ============================================
    
    INSERT INTO stack_items (profile_id, item_type, name, dose, timing, brand, notes, public, created_at) VALUES
    (v_emma_profile_id, 'supplements', 'Low Dose Naltrexone (LDN)', '4.5mg', 'bedtime', 'Compounded', 'Prescribed for chronic pain. Started at 1.5mg, titrated up over 6 weeks. Game changer!', true, '2025-09-01'),
    (v_emma_profile_id, 'supplements', 'Magnesium Glycinate', '400mg', 'bedtime', 'Thorne', 'Helps with muscle relaxation and sleep quality. Much better absorbed than magnesium oxide.', true, '2025-09-15'),
    (v_emma_profile_id, 'supplements', 'Vitamin D3', '2000 IU', 'morning', 'Pure Encapsulations', 'Was severely deficient (18 ng/mL). Working to get to optimal range (50-70 ng/mL).', true, '2025-09-15'),
    (v_emma_profile_id, 'supplements', 'Omega-3 Fish Oil', '1000mg', 'morning', 'Nordic Naturals', 'EPA/DHA for anti-inflammatory support. High quality, third-party tested.', true, '2025-10-01'),
    (v_emma_profile_id, 'supplements', 'Vitamin B12 (Methylcobalamin)', '1000mcg', 'morning', 'Pure Encapsulations', 'Methylated form for better absorption. Supports nerve health.', true, '2025-10-01'),
    (v_emma_profile_id, 'supplements', 'Curcumin (Turmeric)', '500mg', 'with meals', 'Thorne', 'With black pepper extract (piperine) for absorption. Anti-inflammatory.', true, '2025-10-05'),
    (v_emma_profile_id, 'supplements', 'Melatonin', '3mg', 'bedtime', 'Pure Encapsulations', 'For sleep support. Only when needed, not daily.', true, '2025-08-31'),
    (v_emma_profile_id, 'supplements', 'Zinc', '15mg', 'morning', 'Thorne', 'Immune support and wound healing. Important for chronic conditions.', true, '2025-10-01'),
    (v_emma_profile_id, 'supplements', 'Vitamin C', '1000mg', 'morning', 'Pure Encapsulations', 'Immune support and collagen synthesis. Helps with tissue repair.', true, '2025-10-01'),
    (v_emma_profile_id, 'movement', 'Gentle Yoga', '30min', 'morning', 'Yoga with Adriene', 'Restorative poses for pain relief. Start gentle, build gradually.', true, '2025-09-20'),
    (v_emma_profile_id, 'movement', 'Walking', '45min', 'afternoon', 'Outdoor', 'Start slow, build endurance. Nature therapy + gentle movement.', true, '2025-09-25'),
    (v_emma_profile_id, 'movement', 'Swimming', '30min', 'evening', 'Local Pool', 'Low-impact, full-body movement. Water provides natural resistance.', true, '2025-10-01'),
    (v_emma_profile_id, 'movement', 'Light Strength Training', '20min', 'morning', 'Home Gym', 'Bodyweight exercises. Focus on form, not intensity.', true, '2025-10-05'),
    (v_emma_profile_id, 'mindfulness', 'Meditation', '15min', 'morning', 'Headspace', 'Mindfulness for pain management. Helps with stress and anxiety.', true, '2025-09-15'),
    (v_emma_profile_id, 'mindfulness', 'Breathing Exercises', '10min', 'as needed', 'Wim Hof Method', 'For pain flares and stress. Simple but effective.', true, '2025-09-20'),
    (v_emma_profile_id, 'mindfulness', 'Gratitude Journaling', '5min', 'evening', 'Paper Journal', 'Daily gratitude practice. Helps shift mindset during recovery.', true, '2025-10-01');
    
    RAISE NOTICE 'Inserted 16 stack items';
    
    -- ============================================
    -- PROTOCOLS (4 protocols)
    -- ============================================
    
    INSERT INTO protocols (profile_id, name, description, frequency, public, created_at) VALUES
    (v_emma_profile_id, 'LDN Titration Protocol', 'Week 1-2: 1.5mg | Week 3-4: 3mg | Week 5+: 4.5mg. Take at bedtime. Gradual titration reduces vivid dream side effects.', 'ongoing', true, '2025-09-01'),
    (v_emma_profile_id, 'Heat Therapy', 'Heating pad 20min on affected areas during flares. Helps muscle relaxation and pain reduction.', 'as needed', true, '2025-09-01'),
    (v_emma_profile_id, 'Sleep Hygiene Routine', 'Cool room 65-68°F, blackout curtains, blue light blockers 2hr before bed, magnesium at bedtime. Sleep tracking with Oura Ring.', 'nightly', true, '2025-09-20'),
    (v_emma_profile_id, 'Pacing Strategy', 'The 50% Rule: Only do 50% of what you think you can. Rest BEFORE exhaustion, not after. Prevents post-exertional crashes.', 'daily', true, '2025-09-22');
    
    RAISE NOTICE 'Inserted 4 protocols';
    
    -- ============================================
    -- GEAR (5 items)
    -- ============================================
    
    INSERT INTO gear (profile_id, name, brand, model, category, description, public, created_at) VALUES
    (v_emma_profile_id, 'Oura Ring', 'Oura', 'Gen 3', 'Wearables', 'Tracks sleep stages, HRV, recovery score, body temp. Data revealed patterns between sleep quality and pain levels.', true, '2025-09-10'),
    (v_emma_profile_id, 'Heating Pad', 'Sunbeam', 'XL', 'Recovery', 'Large size for full back coverage. Auto-shutoff. Used multiple times daily during worst pain.', true, '2025-09-01'),
    (v_emma_profile_id, 'Foam Roller', 'TriggerPoint', 'GRID', 'Recovery', 'Self-myofascial release. Start gentle! Too much pressure can trigger flares.', true, '2025-10-02'),
    (v_emma_profile_id, 'Standing Desk', 'Uplift', 'V2', 'Fitness', 'Alternate sitting/standing every 30min. Proper ergonomics = less pain.', true, '2025-09-20'),
    (v_emma_profile_id, 'TENS Unit', 'iReliev', 'Wireless', 'Recovery', 'Electrical nerve stimulation for drug-free pain relief during breakthrough pain episodes.', true, '2025-09-12');
    
    RAISE NOTICE 'Inserted 5 gear items';
    
    -- ============================================
    -- LIBRARY ITEMS (3 items)
    -- ============================================
    
    INSERT INTO library_items (profile_id, title, category, provider, summary_public, file_type, file_size, file_url, is_public, created_at) VALUES
    (v_emma_profile_id, 'LDN Prescription - Dr. Smith', 'other', 'Dr. Smith - Pain Clinic', 'Low Dose Naltrexone prescription for chronic pain management. Started at 1.5mg, titrated to 4.5mg.', 'application/pdf', 245760, '/uploads/emma/ldn-prescription-dr-smith.pdf', true, '2025-09-01'),
    (v_emma_profile_id, 'Vitamin D Lab Results - Quest', 'lab', 'Quest Diagnostics', 'Vitamin D deficiency (18 ng/mL) - significantly below optimal range. Supplementing with 2000 IU daily.', 'application/pdf', 189440, '/uploads/emma/vitamin-d-lab-quest.pdf', true, '2025-09-15'),
    (v_emma_profile_id, 'Pain Management Protocol - Dr. Smith', 'assessment', 'Dr. Smith - Pain Clinic', 'Comprehensive pain management plan including LDN titration, heat therapy, pacing strategy, and sleep hygiene.', 'application/pdf', 356864, '/uploads/emma/pain-management-protocol-dr-smith.pdf', true, '2025-09-20');
    
    RAISE NOTICE 'Inserted 3 library items';
    
    -- ============================================
    -- FOLLOWERS (52)
    -- ============================================
    
    INSERT INTO stack_followers (owner_user_id, follower_email, verified_at, created_at)
    SELECT
        v_emma_user_id,
        'follower' || gs || '@biostackr-community.com',
        NOW() - (gs || ' days')::INTERVAL,
        NOW() - (gs || ' days')::INTERVAL
    FROM generate_series(1, 52) gs;
    
    RAISE NOTICE 'Inserted 52 followers';
    
    RAISE NOTICE 'Emma profile setup complete! Check /biostackr/emma-chronic-pain-journey';
    
END $$;
