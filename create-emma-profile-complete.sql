-- Create Emma's profile and populate it with complete data
-- This script will create the profile if it doesn't exist, then add all the data

DO $$
DECLARE
    v_emma_user_id UUID;
    v_emma_profile_id UUID;
    v_existing_profile RECORD;
    v_day_offset INTEGER;
    v_date DATE;
BEGIN
    -- Check if Emma's profile already exists
    SELECT user_id, id INTO v_existing_profile
    FROM profiles WHERE slug = 'emma-chronic-pain-journey';
    
    IF v_existing_profile.user_id IS NULL THEN
        RAISE NOTICE 'Emma profile does not exist. Creating new profile...';
        
        -- Create a new user first (we'll use a dummy UUID for demo purposes)
        -- In a real scenario, this would be created through Supabase Auth
        v_emma_user_id := gen_random_uuid();
        
        -- Create Emma's profile
        INSERT INTO profiles (user_id, slug, display_name, bio, avatar_url, public, created_at, updated_at)
        VALUES (
            v_emma_user_id,
            'emma-chronic-pain-journey',
            'Emma',
            'Chronic pain warrior sharing my journey with Low Dose Naltrexone (LDN) therapy. After 3 months of 8-9/10 pain, I found relief through systematic tracking and LDN. Documenting the good, the bad, and everything in between.',
            'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face',
            true,
            NOW(),
            NOW()
        ) RETURNING id INTO v_emma_profile_id;
        
        RAISE NOTICE 'Created Emma profile with user_id=% and profile_id=%', v_emma_user_id, v_emma_profile_id;
    ELSE
        v_emma_user_id := v_existing_profile.user_id;
        v_emma_profile_id := v_existing_profile.id;
        RAISE NOTICE 'Found existing Emma profile: user_id=%, profile_id=%', v_emma_user_id, v_emma_profile_id;
    END IF;
    
    -- Clean existing data
    DELETE FROM daily_entries WHERE user_id = v_emma_user_id;
    DELETE FROM journal_entries WHERE profile_id = v_emma_profile_id;
    DELETE FROM stack_followers WHERE owner_user_id = v_emma_user_id;
    DELETE FROM stack_items WHERE profile_id = v_emma_profile_id;
    DELETE FROM protocols WHERE profile_id = v_emma_profile_id;
    DELETE FROM gear WHERE profile_id = v_emma_profile_id;
    DELETE FROM library_items WHERE profile_id = v_emma_profile_id;
    
    RAISE NOTICE 'Cleaned existing data';
    
    -- ============================================
    -- DAILY ENTRIES (40 days with mood chips)
    -- ============================================
    
    -- Aug 31: RED (baseline - severe pain before LDN)
    INSERT INTO daily_entries (user_id, local_date, mood, sleep_quality, pain, sleep_hours, night_wakes, tags, journal, meds, protocols, activity, devices, wearables)
    VALUES (
        v_emma_user_id, '2025-08-31',
        2, 3, 9, 5.5, 4,
        ARRAY['train_wreck', 'exhausted', 'frustrated', 'overwhelmed'],
        'Rock bottom. 3 months of constant 8-9/10 pain. Starting LDN tonight as last resort.',
        '["Low Dose Naltrexone (LDN) 1.5mg"]'::jsonb,
        '["Physical therapy", "Acupuncture"]'::jsonb,
        '["Gentle stretching"]'::jsonb,
        '["Heating pad", "Ice pack"]'::jsonb,
        '{"recovery_score": 25, "sleep_score": 35}'::jsonb
    );
    
    -- Sept 1-5: RED (still severe pain, LDN starting)
    FOR v_day_offset IN 1..5 LOOP
        v_date := '2025-09-01'::date + (v_day_offset - 1);
        INSERT INTO daily_entries (user_id, local_date, mood, sleep_quality, pain, sleep_hours, night_wakes, tags, journal, meds, protocols, activity, devices, wearables)
        VALUES (
            v_emma_user_id, v_date,
            2, 3, 8, 5.5, 3,
            ARRAY['train_wreck', 'exhausted', 'frustrated'],
            'LDN day ' || v_day_offset || '. Still severe pain but maybe slightly less intense? Hard to tell.',
            '["Low Dose Naltrexone (LDN) 1.5mg"]'::jsonb,
            '["Physical therapy", "Acupuncture"]'::jsonb,
            '["Gentle stretching"]'::jsonb,
            '["Heating pad", "Ice pack"]'::jsonb,
            '{"recovery_score": 30, "sleep_score": 40}'::jsonb
        );
    END LOOP;
    
    -- Sept 6-10: YELLOW (pain starting to decrease)
    FOR v_day_offset IN 6..10 LOOP
        v_date := '2025-09-01'::date + (v_day_offset - 1);
        INSERT INTO daily_entries (user_id, local_date, mood, sleep_quality, pain, sleep_hours, night_wakes, tags, journal, meds, protocols, activity, devices, wearables)
        VALUES (
            v_emma_user_id, v_date,
            4, 5, 6, 6.5, 2,
            ARRAY['hanging_in_there', 'cautiously_hopeful', 'tired'],
            'Pain down to 6/10! LDN seems to be working. Increased to 3mg today.',
            '["Low Dose Naltrexone (LDN) 3mg"]'::jsonb,
            '["Physical therapy", "Acupuncture", "LDN therapy"]'::jsonb,
            '["Gentle stretching", "Short walks"]'::jsonb,
            '["Heating pad", "Ice pack", "Oura Ring"]'::jsonb,
            '{"recovery_score": 45, "sleep_score": 55}'::jsonb
        );
    END LOOP;
    
    -- Sept 11-20: LIGHT GREEN (significant improvement)
    FOR v_day_offset IN 11..20 LOOP
        v_date := '2025-09-01'::date + (v_day_offset - 1);
        INSERT INTO daily_entries (user_id, local_date, mood, sleep_quality, pain, sleep_hours, night_wakes, tags, journal, meds, protocols, activity, devices, wearables)
        VALUES (
            v_emma_user_id, v_date,
            6, 7, 4, 7.5, 1,
            ARRAY['solid_baseline', 'grateful', 'hopeful'],
            'Pain down to 4/10! This is incredible. LDN at 4.5mg now.',
            '["Low Dose Naltrexone (LDN) 4.5mg"]'::jsonb,
            '["Physical therapy", "Acupuncture", "LDN therapy"]'::jsonb,
            '["Gentle stretching", "Short walks", "Light yoga"]'::jsonb,
            '["Heating pad", "Ice pack", "Oura Ring"]'::jsonb,
            '{"recovery_score": 65, "sleep_score": 70}'::jsonb
        );
    END LOOP;
    
    -- Sept 21-30: DARK GREEN (excellent - pain 2/10)
    FOR v_day_offset IN 21..30 LOOP
        v_date := '2025-09-01'::date + (v_day_offset - 1);
        INSERT INTO daily_entries (user_id, local_date, mood, sleep_quality, pain, sleep_hours, night_wakes, tags, journal, meds, protocols, activity, devices, wearables)
        VALUES (
            v_emma_user_id, v_date,
            8, 8, 2, 8.0, 0,
            ARRAY['on_top_world', 'unstoppable', 'dialed_in', 'main_character'],
            'Pain at 2/10! I feel like myself again. LDN is a miracle.',
            '["Low Dose Naltrexone (LDN) 4.5mg"]'::jsonb,
            '["Physical therapy", "Acupuncture", "LDN therapy"]'::jsonb,
            '["Gentle stretching", "Short walks", "Light yoga", "Swimming"]'::jsonb,
            '["Heating pad", "Ice pack", "Oura Ring"]'::jsonb,
            '{"recovery_score": 85, "sleep_score": 85}'::jsonb
        );
    END LOOP;
    
    -- Oct 1-10: DARK GREEN (maintaining excellent results)
    FOR v_day_offset IN 1..10 LOOP
        v_date := '2025-10-01'::date + (v_day_offset - 1);
        INSERT INTO daily_entries (user_id, local_date, mood, sleep_quality, pain, sleep_hours, night_wakes, tags, journal, meds, protocols, activity, devices, wearables)
        VALUES (
            v_emma_user_id, v_date,
            9, 9, 1, 8.5, 0,
            ARRAY['on_top_world', 'unstoppable', 'dialed_in', 'main_character'],
            'Pain at 1/10! Living my best life. LDN maintenance dose.',
            '["Low Dose Naltrexone (LDN) 4.5mg"]'::jsonb,
            '["Physical therapy", "Acupuncture", "LDN therapy"]'::jsonb,
            '["Gentle stretching", "Short walks", "Light yoga", "Swimming", "Hiking"]'::jsonb,
            '["Heating pad", "Ice pack", "Oura Ring"]'::jsonb,
            '{"recovery_score": 90, "sleep_score": 90}'::jsonb
        );
    END LOOP;
    
    RAISE NOTICE 'Added 40 days of mood data';
    
    -- ============================================
    -- JOURNAL ENTRIES
    -- ============================================
    
    INSERT INTO journal_entries (profile_id, heading, body, public, created_at) VALUES
    (v_emma_profile_id, 'Rock Bottom', 'I don''t know how much longer I can do this. It''s been 3 months of constant pain - 8 or 9 out of 10 every single day. I can''t sleep. I can''t work properly. I can''t be present with my family.

My doctor suggested Low Dose Naltrexone (LDN) as a last resort. I''ve tried everything else: physical therapy, acupuncture, every NSAID under the sun. Nothing touches this pain.

I''m scared to hope again. But I''m also desperate. Starting 1.5mg tonight.

If you''re reading this and you''re in chronic pain: I see you. I know how isolating this is. How exhausting it is to explain to people who don''t understand. How hard it is to keep going when your body feels like it''s fighting against you.

I''m going to document this journey - the good, the bad, and the ugly. If nothing else, maybe it''ll help someone else feel less alone.', true, '2025-09-10 14:23:00'),
    
    (v_emma_profile_id, 'First Glimmer of Hope', 'Day 6 on LDN and I think... I think it might be working? Pain went from 8/10 to 6/10 today. That''s the first time in months I''ve seen a 6.

I know it''s early days and I''m trying not to get my hopes up, but for the first time in forever, I slept through the night without waking up from pain.

My doctor said to increase to 3mg if I was tolerating it well, so I did that today. Fingers crossed this trend continues.

Still exhausted from months of poor sleep, but maybe, just maybe, there''s light at the end of this tunnel.', true, '2025-09-15 09:45:00'),
    
    (v_emma_profile_id, 'The Turnaround', 'Holy shit. Pain is down to 4/10 today. 4/10! I haven''t seen a 4 since this nightmare began.

LDN is at 4.5mg now and the difference is incredible. I went for a short walk today - an actual walk, not just hobbling around the house. I felt like a human being again.

The best part? I''m sleeping 7+ hours straight. No more waking up every 2 hours from pain. My energy is starting to come back.

I know I need to be careful not to overdo it, but for the first time in months, I''m starting to believe I might actually get my life back.', true, '2025-09-20 16:30:00'),
    
    (v_emma_profile_id, 'Living Again', 'Pain at 2/10 today. 2/10! I can''t even remember the last time my pain was this low.

I went swimming today. Swimming! Something I used to love but had given up on because the pain was too much. I felt like myself again.

LDN has been a game changer. I know everyone responds differently, but for me, it''s been nothing short of miraculous. I''m back to work full time, sleeping well, and actually enjoying life again.

To anyone reading this who''s in the depths of chronic pain: don''t give up. Keep trying different approaches. What works for one person might not work for another, but there are options out there.', true, '2025-09-25 19:15:00'),
    
    (v_emma_profile_id, 'Gratitude and Hope', 'One month on LDN and I feel like I''ve been given my life back. Pain is consistently 1-2/10, I''m sleeping 8+ hours a night, and my energy is better than it''s been in years.

I know this journey isn''t over - chronic pain is complex and I need to stay vigilant about my health. But for now, I''m grateful for every good day.

I''m sharing this because I wish I''d known about LDN sooner. If you''re struggling with chronic pain and haven''t tried it, it might be worth discussing with your doctor. It''s not a cure-all, but for some of us, it can be life-changing.

Here''s to hoping this good streak continues. And to anyone reading this who''s still in the trenches - keep fighting. Your breakthrough might be just around the corner.', true, '2025-10-05 11:20:00'),
    
    (v_emma_profile_id, 'The New Normal', 'Two months into this journey and I''m still amazed at how much my life has changed. Pain is consistently 1-2/10, I''m back to all my favorite activities, and I''m sleeping like a baby.

LDN maintenance dose of 4.5mg seems to be my sweet spot. I''m also maintaining all the other healthy habits I''ve built - regular movement, good sleep hygiene, stress management.

The tracking has been crucial. Being able to see the patterns and correlations has helped me understand what works and what doesn''t. Data doesn''t lie, and it''s been incredibly empowering to have concrete evidence of my progress.

To anyone following this journey - thank you for your support. Chronic pain can be incredibly isolating, but knowing others are rooting for you makes all the difference.', true, '2025-10-10 14:00:00');
    
    RAISE NOTICE 'Added 6 journal entries';
    
    -- ============================================
    -- SUPPLEMENTS & PROTOCOLS
    -- ============================================
    
    INSERT INTO stack_items (profile_id, item_type, name, dose, timing, brand, notes, public, created_at) VALUES
    (v_emma_profile_id, 'supplements', 'Low Dose Naltrexone (LDN)', '4.5mg', 'bedtime', 'Compounded', 'Prescribed for chronic pain. Started at 1.5mg, titrated up over 4 weeks. Game changer!', true, '2025-09-08'),
    (v_emma_profile_id, 'supplements', 'Magnesium Glycinate', '400mg', 'bedtime', 'Thorne', 'Helps with muscle relaxation and sleep quality. Much better absorbed than magnesium oxide.', true, '2025-09-15'),
    (v_emma_profile_id, 'supplements', 'Vitamin D3', '2000 IU', 'morning', 'Nordic Naturals', 'Was severely deficient (18 ng/mL). Working to get to optimal range (50-70 ng/mL).', true, '2025-09-15'),
    (v_emma_profile_id, 'supplements', 'Omega-3 Fish Oil', '1000mg', 'morning', 'Nordic Naturals', 'EPA/DHA for anti-inflammatory support.', true, '2025-10-01'),
    (v_emma_profile_id, 'supplements', 'Vitamin B12 (Methylcobalamin)', '1000mcg', 'morning', 'Thorne', 'Methylated form for better absorption. Supports nerve health.', true, '2025-10-01'),
    (v_emma_profile_id, 'supplements', 'Curcumin (Turmeric)', '500mg', 'twice daily', 'Life Extension', 'With black pepper extract (piperine) for absorption. Anti-inflammatory.', true, '2025-10-05'),
    (v_emma_profile_id, 'supplements', 'Probiotics', '50 billion CFU', 'morning', 'Seed', 'Gut health is crucial for inflammation management.', true, '2025-10-05'),
    (v_emma_profile_id, 'supplements', 'Zinc', '15mg', 'morning', 'Thorne', 'Immune support and wound healing.', true, '2025-10-05'),
    (v_emma_profile_id, 'supplements', 'Vitamin C', '1000mg', 'morning', 'Thorne', 'Antioxidant support and immune function.', true, '2025-10-05'),
    (v_emma_profile_id, 'supplements', 'Iron Bisglycinate', '18mg', 'morning', 'Thorne', 'Was slightly anemic. Gentle form that doesn''t cause constipation.', true, '2025-10-05'),
    (v_emma_profile_id, 'supplements', 'Ashwagandha', '600mg', 'bedtime', 'Thorne', 'Adaptogen for stress and sleep support.', true, '2025-10-05'),
    (v_emma_profile_id, 'supplements', 'L-Theanine', '200mg', 'as needed', 'Thorne', 'For anxiety and stress management.', true, '2025-10-05'),
    (v_emma_profile_id, 'supplements', 'Melatonin', '3mg', 'bedtime', 'Thorne', 'Sleep support, especially during pain flares.', true, '2025-10-05'),
    (v_emma_profile_id, 'supplements', 'CoQ10', '100mg', 'morning', 'Thorne', 'Mitochondrial support and energy.', true, '2025-10-05'),
    (v_emma_profile_id, 'supplements', 'Alpha-Lipoic Acid', '300mg', 'morning', 'Thorne', 'Antioxidant and nerve support.', true, '2025-10-05');
    
    INSERT INTO protocols (profile_id, name, description, frequency, public, created_at) VALUES
    (v_emma_profile_id, 'LDN Therapy', 'Low Dose Naltrexone for chronic pain management', 'daily', true, '2025-09-08'),
    (v_emma_profile_id, 'Physical Therapy', 'Gentle stretching and strengthening exercises', '3x weekly', true, '2025-09-01'),
    (v_emma_profile_id, 'Acupuncture', 'Traditional Chinese medicine for pain relief', 'weekly', true, '2025-09-01'),
    (v_emma_profile_id, 'Heat Therapy', 'Heating pad for muscle relaxation', 'daily', true, '2025-08-31'),
    (v_emma_profile_id, 'Ice Therapy', 'Ice packs for inflammation reduction', 'as needed', true, '2025-08-31'),
    (v_emma_profile_id, 'Sleep Hygiene', 'Consistent bedtime routine and sleep environment', 'daily', true, '2025-09-15'),
    (v_emma_profile_id, 'Stress Management', 'Meditation and breathing exercises', 'daily', true, '2025-09-20'),
    (v_emma_profile_id, 'Gentle Movement', 'Walking, swimming, light yoga', 'daily', true, '2025-09-20');
    
    -- ============================================
    -- GEAR
    -- ============================================
    
    INSERT INTO gear (profile_id, name, category, brand, description, public, created_at) VALUES
    (v_emma_profile_id, 'Oura Ring', 'wearable', 'Oura', 'Sleep and recovery tracking. Essential for monitoring progress.', true, '2025-09-15'),
    (v_emma_profile_id, 'Heating Pad', 'therapy', 'Sunbeam', 'Electric heating pad for muscle relaxation and pain relief.', true, '2025-08-31'),
    (v_emma_profile_id, 'Ice Pack Set', 'therapy', 'TheraPearl', 'Reusable ice packs for inflammation reduction.', true, '2025-08-31'),
    (v_emma_profile_id, 'Yoga Mat', 'fitness', 'Manduka', 'High-quality mat for gentle stretching and yoga.', true, '2025-09-20'),
    (v_emma_profile_id, 'Foam Roller', 'recovery', 'TriggerPoint', 'Self-myofascial release and muscle recovery.', true, '2025-09-20');
    
    -- ============================================
    -- LIBRARY ITEMS
    -- ============================================
    
    INSERT INTO library_items (profile_id, title, category, is_public, provider, summary_public, file_type, created_at) VALUES
    (v_emma_profile_id, 'LDN Prescription & Lab Results', 'lab', true, 'Dr. Sarah Chen, MD', 'Comprehensive lab panel showing inflammation markers and LDN prescription details.', 'application/pdf', '2025-09-08'),
    (v_emma_profile_id, 'Physical Therapy Assessment', 'assessment', true, 'Mike Rodriguez, DPT', 'Initial PT evaluation and treatment plan for chronic pain management.', 'application/pdf', '2025-09-01'),
    (v_emma_profile_id, 'Pain Management Protocol', 'other', true, 'Dr. Sarah Chen, MD', 'Detailed treatment protocol including LDN titration schedule and monitoring plan.', 'application/pdf', '2025-09-08');
    
    -- ============================================
    -- FOLLOWERS (52 followers)
    -- ============================================
    
    -- Create 52 follower relationships
    FOR v_day_offset IN 1..52 LOOP
        INSERT INTO stack_followers (owner_user_id, follower_user_id, created_at)
        VALUES (v_emma_user_id, gen_random_uuid(), NOW() - (v_day_offset || ' days')::interval);
    END LOOP;
    
    RAISE NOTICE 'Added 52 followers';
    
    RAISE NOTICE 'Emma profile creation COMPLETE!';
    RAISE NOTICE 'Profile ID: %', v_emma_profile_id;
    RAISE NOTICE 'User ID: %', v_emma_user_id;
    RAISE NOTICE 'Slug: emma-chronic-pain-journey';
    RAISE NOTICE 'Public: true';
    
END $$;
