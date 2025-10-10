-- Fix Emma's profile with missing sections and varied mood scores
-- User ID: c1b5662e-73dd-48b1-a5d8-ec0d1a648415

DO $$
DECLARE
    v_emma_user_id UUID := 'c1b5662e-73dd-48b1-a5d8-ec0d1a648415';
    v_emma_profile_id UUID;
    v_day_offset INTEGER;
    v_date DATE;
    v_mood INTEGER;
    v_pain INTEGER;
    v_sleep INTEGER;
    v_tags TEXT[];
BEGIN
    RAISE NOTICE 'Fixing Emma profile for user: %', v_emma_user_id;
    
    -- Get the existing profile ID
    SELECT id INTO v_emma_profile_id
    FROM profiles 
    WHERE user_id = v_emma_user_id;
    
    IF v_emma_profile_id IS NULL THEN
        RAISE NOTICE 'ERROR: No existing profile found for user ID: %', v_emma_user_id;
        RETURN;
    END IF;
    
    RAISE NOTICE 'Found existing Emma profile with ID: %', v_emma_profile_id;
    
    -- Update profile with proper avatar
    UPDATE profiles SET
        avatar_url = 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face',
        updated_at = NOW()
    WHERE id = v_emma_profile_id;
    
    -- Clean existing data
    DELETE FROM daily_entries WHERE user_id = v_emma_user_id;
    DELETE FROM stack_items WHERE profile_id = v_emma_profile_id;
    DELETE FROM protocols WHERE profile_id = v_emma_profile_id;
    
    RAISE NOTICE 'Cleaned existing data';
    
    -- ============================================
    -- DAILY ENTRIES WITH VARIED MOOD SCORES
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
        v_mood := 2 + (v_day_offset % 2); -- 2-3
        v_pain := 8 + (v_day_offset % 2); -- 8-9
        v_sleep := 3 + (v_day_offset % 2); -- 3-4
        
        IF v_day_offset = 1 THEN
            v_tags := ARRAY['train_wreck', 'exhausted', 'frustrated'];
        ELSIF v_day_offset = 2 THEN
            v_tags := ARRAY['train_wreck', 'exhausted', 'overwhelmed'];
        ELSIF v_day_offset = 3 THEN
            v_tags := ARRAY['train_wreck', 'frustrated', 'overwhelmed'];
        ELSIF v_day_offset = 4 THEN
            v_tags := ARRAY['exhausted', 'frustrated', 'overwhelmed'];
        ELSE
            v_tags := ARRAY['train_wreck', 'exhausted', 'frustrated', 'overwhelmed'];
        END IF;
        
        INSERT INTO daily_entries (user_id, local_date, mood, sleep_quality, pain, sleep_hours, night_wakes, tags, journal, meds, protocols, activity, devices, wearables)
        VALUES (
            v_emma_user_id, v_date,
            v_mood, v_sleep, v_pain, 5.5, 3,
            v_tags,
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
        v_mood := 3 + (v_day_offset % 3); -- 3-5
        v_pain := 5 + (v_day_offset % 2); -- 5-6
        v_sleep := 4 + (v_day_offset % 2); -- 4-5
        
        IF v_day_offset = 6 THEN
            v_tags := ARRAY['hanging_in_there', 'cautiously_hopeful', 'tired'];
        ELSIF v_day_offset = 7 THEN
            v_tags := ARRAY['hanging_in_there', 'tired', 'frustrated'];
        ELSIF v_day_offset = 8 THEN
            v_tags := ARRAY['cautiously_hopeful', 'tired', 'hanging_in_there'];
        ELSIF v_day_offset = 9 THEN
            v_tags := ARRAY['hanging_in_there', 'cautiously_hopeful', 'tired'];
        ELSE
            v_tags := ARRAY['cautiously_hopeful', 'tired', 'hanging_in_there'];
        END IF;
        
        INSERT INTO daily_entries (user_id, local_date, mood, sleep_quality, pain, sleep_hours, night_wakes, tags, journal, meds, protocols, activity, devices, wearables)
        VALUES (
            v_emma_user_id, v_date,
            v_mood, v_sleep, v_pain, 6.5, 2,
            v_tags,
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
        v_mood := 5 + (v_day_offset % 3); -- 5-7
        v_pain := 3 + (v_day_offset % 2); -- 3-4
        v_sleep := 6 + (v_day_offset % 2); -- 6-7
        
        IF v_day_offset <= 15 THEN
            v_tags := ARRAY['solid_baseline', 'grateful', 'hopeful'];
        ELSE
            v_tags := ARRAY['solid_baseline', 'grateful', 'hopeful', 'tired'];
        END IF;
        
        INSERT INTO daily_entries (user_id, local_date, mood, sleep_quality, pain, sleep_hours, night_wakes, tags, journal, meds, protocols, activity, devices, wearables)
        VALUES (
            v_emma_user_id, v_date,
            v_mood, v_sleep, v_pain, 7.5, 1,
            v_tags,
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
        v_mood := 7 + (v_day_offset % 3); -- 7-9
        v_pain := 1 + (v_day_offset % 2); -- 1-2
        v_sleep := 7 + (v_day_offset % 2); -- 7-8
        
        IF v_day_offset <= 25 THEN
            v_tags := ARRAY['on_top_world', 'unstoppable', 'dialed_in'];
        ELSIF v_day_offset <= 28 THEN
            v_tags := ARRAY['on_top_world', 'unstoppable', 'main_character'];
        ELSE
            v_tags := ARRAY['on_top_world', 'unstoppable', 'dialed_in', 'main_character'];
        END IF;
        
        INSERT INTO daily_entries (user_id, local_date, mood, sleep_quality, pain, sleep_hours, night_wakes, tags, journal, meds, protocols, activity, devices, wearables)
        VALUES (
            v_emma_user_id, v_date,
            v_mood, v_sleep, v_pain, 8.0, 0,
            v_tags,
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
        v_mood := 8 + (v_day_offset % 2); -- 8-9
        v_pain := 1 + (v_day_offset % 2); -- 1-2
        v_sleep := 8 + (v_day_offset % 2); -- 8-9
        
        IF v_day_offset <= 5 THEN
            v_tags := ARRAY['on_top_world', 'unstoppable', 'dialed_in', 'main_character'];
        ELSE
            v_tags := ARRAY['on_top_world', 'unstoppable', 'dialed_in', 'main_character'];
        END IF;
        
        INSERT INTO daily_entries (user_id, local_date, mood, sleep_quality, pain, sleep_hours, night_wakes, tags, journal, meds, protocols, activity, devices, wearables)
        VALUES (
            v_emma_user_id, v_date,
            v_mood, v_sleep, v_pain, 8.5, 0,
            v_tags,
            'Pain at 1/10! Living my best life. LDN maintenance dose.',
            '["Low Dose Naltrexone (LDN) 4.5mg"]'::jsonb,
            '["Physical therapy", "Acupuncture", "LDN therapy"]'::jsonb,
            '["Gentle stretching", "Short walks", "Light yoga", "Swimming", "Hiking"]'::jsonb,
            '["Heating pad", "Ice pack", "Oura Ring"]'::jsonb,
            '{"recovery_score": 90, "sleep_score": 90}'::jsonb
        );
    END LOOP;
    
    RAISE NOTICE 'Added 40 days of varied mood data';
    
    -- ============================================
    -- SUPPLEMENTS & PROTOCOLS (INCLUDING TRAINING/REHAB & STRESS/MINDSET)
    -- ============================================
    
    -- Supplements
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
    
    -- Movement/Training & Rehab
    INSERT INTO stack_items (profile_id, item_type, name, dose, timing, brand, notes, public, created_at) VALUES
    (v_emma_profile_id, 'movement', 'Physical Therapy', '45 min', '3x weekly', 'Local PT Clinic', 'Gentle stretching and strengthening exercises for chronic pain management.', true, '2025-09-01'),
    (v_emma_profile_id, 'movement', 'Swimming', '30 min', '3x weekly', 'Local Pool', 'Low-impact cardio that doesn''t aggravate pain. Started after LDN kicked in.', true, '2025-09-20'),
    (v_emma_profile_id, 'movement', 'Gentle Yoga', '20 min', 'daily', 'YouTube', 'Restorative yoga for pain relief and flexibility. Essential for maintaining mobility.', true, '2025-09-15'),
    (v_emma_profile_id, 'movement', 'Walking', '15-30 min', 'daily', 'Neighborhood', 'Started with 5 minutes, now up to 30. Progress tracking has been motivating.', true, '2025-09-10'),
    (v_emma_profile_id, 'movement', 'Foam Rolling', '10 min', 'daily', 'TriggerPoint', 'Self-myofascial release for muscle tension and pain relief.', true, '2025-09-15'),
    (v_emma_profile_id, 'movement', 'Stretching Routine', '15 min', 'twice daily', 'Custom', 'Morning and evening stretching to maintain flexibility and reduce stiffness.', true, '2025-08-31');
    
    -- Mindfulness/Stress & Mindset
    INSERT INTO stack_items (profile_id, item_type, name, dose, timing, brand, notes, public, created_at) VALUES
    (v_emma_profile_id, 'mindfulness', 'Meditation', '10-20 min', 'daily', 'Headspace', 'Mindfulness meditation for pain management and stress reduction.', true, '2025-09-15'),
    (v_emma_profile_id, 'mindfulness', 'Breathing Exercises', '5 min', 'as needed', 'Custom', 'Box breathing and 4-7-8 technique for pain flares and anxiety.', true, '2025-09-01'),
    (v_emma_profile_id, 'mindfulness', 'Gratitude Journaling', '5 min', 'daily', 'Notebook', 'Daily gratitude practice to maintain positive mindset during recovery.', true, '2025-09-20'),
    (v_emma_profile_id, 'mindfulness', 'Progressive Muscle Relaxation', '15 min', 'bedtime', 'YouTube', 'PMR for sleep and pain relief. Especially helpful during flare-ups.', true, '2025-09-10'),
    (v_emma_profile_id, 'mindfulness', 'Pain Visualization', '10 min', 'as needed', 'Custom', 'Guided visualization to reframe pain and build resilience.', true, '2025-09-25'),
    (v_emma_profile_id, 'mindfulness', 'Body Scan Meditation', '20 min', 'weekly', 'Insight Timer', 'Full body awareness meditation for pain management and relaxation.', true, '2025-09-30');
    
    -- Protocols
    INSERT INTO protocols (profile_id, name, description, frequency, public, created_at) VALUES
    (v_emma_profile_id, 'LDN Therapy', 'Low Dose Naltrexone for chronic pain management', 'daily', true, '2025-09-08'),
    (v_emma_profile_id, 'Physical Therapy', 'Gentle stretching and strengthening exercises', '3x weekly', true, '2025-09-01'),
    (v_emma_profile_id, 'Acupuncture', 'Traditional Chinese medicine for pain relief', 'weekly', true, '2025-09-01'),
    (v_emma_profile_id, 'Heat Therapy', 'Heating pad for muscle relaxation', 'daily', true, '2025-08-31'),
    (v_emma_profile_id, 'Ice Therapy', 'Ice packs for inflammation reduction', 'as needed', true, '2025-08-31'),
    (v_emma_profile_id, 'Sleep Hygiene', 'Consistent bedtime routine and sleep environment', 'daily', true, '2025-09-15'),
    (v_emma_profile_id, 'Stress Management', 'Meditation and breathing exercises', 'daily', true, '2025-09-20'),
    (v_emma_profile_id, 'Gentle Movement', 'Walking, swimming, light yoga', 'daily', true, '2025-09-20'),
    (v_emma_profile_id, 'Pain Tracking', 'Daily mood, pain, and symptom logging', 'daily', true, '2025-08-31'),
    (v_emma_profile_id, 'Recovery Protocol', 'Rest and recovery days to prevent overexertion', '2x weekly', true, '2025-09-25');
    
    RAISE NOTICE 'Added supplements, movement, mindfulness, and protocols';
    
    RAISE NOTICE 'Emma profile fix COMPLETE!';
    RAISE NOTICE 'Profile ID: %', v_emma_profile_id;
    RAISE NOTICE 'User ID: %', v_emma_user_id;
    RAISE NOTICE 'Slug: emma-chronic-pain-journey';
    RAISE NOTICE 'Public: true';
    RAISE NOTICE 'Link: http://localhost:3009/biostackr/emma-chronic-pain-journey?public=true';
    
END $$;
