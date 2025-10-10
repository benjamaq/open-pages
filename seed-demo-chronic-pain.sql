-- Demo Account: Chronic Pain Management
-- Realistic data for someone managing chronic pain conditions

DO $$
DECLARE
  emma_user_id UUID;
  emma_profile_id UUID;
  follower_1_id UUID := gen_random_uuid();
  follower_2_id UUID := gen_random_uuid();
  follower_3_id UUID := gen_random_uuid();
  follower_4_id UUID := gen_random_uuid();
  entry_date DATE;
  pain_score INT;
  mood_score INT;
  sleep_score INT;
  pain_chips TEXT[];
  mood_chips TEXT[];
  journal_text TEXT;
  pain_flare BOOLEAN;
  mag_item_id UUID;
  turmeric_item_id UUID;
  yoga_item_id UUID;
  walking_item_id UUID;
BEGIN
  -- Create auth user for Emma
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role,
    aud
  ) VALUES (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'emma.demo@biostackr.io',
    crypt('demo-password-123', gen_salt('bf')),
    NOW() - INTERVAL '90 days',
    NOW() - INTERVAL '90 days',
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"display_name":"Emma"}',
    false,
    'authenticated',
    'authenticated'
  ) RETURNING id INTO emma_user_id;

  RAISE NOTICE 'Created auth user for Emma with ID: %', emma_user_id;

  -- Create the demo profile
  INSERT INTO profiles (
    user_id,
    display_name,
    slug,
    bio,
    public,
    avatar_url,
    created_at,
    updated_at,
    onboarding_completed,
    allow_stack_follow
  ) VALUES (
    emma_user_id,
    'Emma',
    'emma-chronic-pain-journey',
    'Managing chronic pain through a holistic approach. Tracking pain patterns, optimizing sleep, and finding what works through careful experimentation.',
    true,
    null,
    NOW() - INTERVAL '90 days',
    NOW(),
    true,
    true
  ) RETURNING id INTO emma_profile_id;

  RAISE NOTICE 'Created Emma profile with ID: %', emma_profile_id;

  -- Insert realistic stack items for chronic pain management
  INSERT INTO stack_items (
    profile_id, name, dose, item_type, frequency, schedule_days, timing, brand, notes, created_at
  ) VALUES 
  -- Supplements
  (emma_profile_id, 'Magnesium Glycinate', '400mg', 'supplements', 'daily', '{1,2,3,4,5,6,7}', 'evening', 'Thorne', 'Helps with muscle tension and sleep quality', NOW() - INTERVAL '85 days'),
  (emma_profile_id, 'Turmeric Curcumin', '500mg', 'supplements', 'daily', '{1,2,3,4,5,6,7}', 'morning', 'Life Extension', 'Anti-inflammatory, take with food', NOW() - INTERVAL '80 days'),
  (emma_profile_id, 'Omega-3', '1000mg', 'supplements', 'daily', '{1,2,3,4,5,6,7}', 'morning', 'Nordic Naturals', 'EPA/DHA for inflammation', NOW() - INTERVAL '75 days'),
  (emma_profile_id, 'Vitamin D3', '2000 IU', 'supplements', 'daily', '{1,2,3,4,5,6,7}', 'morning', 'Nature Made', 'Low levels detected in blood work', NOW() - INTERVAL '70 days'),
  (emma_profile_id, 'CBD Oil', '25mg', 'supplements', 'as_needed', '{}', 'anytime', 'Charlotte''s Web', 'For flare-ups, full spectrum', NOW() - INTERVAL '65 days'),
  -- Medications
  (emma_profile_id, 'Gabapentin', '300mg', 'supplements', 'daily', '{1,2,3,4,5,6,7}', 'evening', 'Generic', 'Prescribed for nerve pain', NOW() - INTERVAL '90 days'),
  (emma_profile_id, 'Meloxicam', '15mg', 'supplements', 'daily', '{1,2,3,4,5,6,7}', 'morning', 'Generic', 'NSAID for inflammation', NOW() - INTERVAL '88 days'),
  -- Protocols
  (emma_profile_id, 'Gentle Yoga', '20 minutes', 'protocols', 'daily', '{1,2,3,4,5,6,7}', 'morning', null, 'Yoga with Adriene - gentle flows only', NOW() - INTERVAL '60 days'),
  (emma_profile_id, 'Heat Therapy', '30 minutes', 'protocols', 'as_needed', '{}', 'evening', null, 'Heating pad on lower back', NOW() - INTERVAL '55 days'),
  (emma_profile_id, 'Meditation', '15 minutes', 'protocols', 'daily', '{1,2,3,4,5,6,7}', 'evening', null, 'Headspace app - pain management course', NOW() - INTERVAL '50 days'),
  -- Movement
  (emma_profile_id, 'Walking', '20 minutes', 'movement', 'daily', '{1,2,3,4,5,6,7}', 'morning', null, 'Gentle pace, listen to body', NOW() - INTERVAL '45 days'),
  (emma_profile_id, 'Swimming', '30 minutes', 'movement', 'weekly', '{3,6}', 'morning', null, 'Low impact, helps with stiffness', NOW() - INTERVAL '40 days'),
  -- Mindfulness
  (emma_profile_id, 'Breathing Exercises', '10 minutes', 'mindfulness', 'daily', '{1,2,3,4,5,6,7}', 'anytime', null, '4-7-8 breathing for pain flares', NOW() - INTERVAL '35 days');

  RAISE NOTICE 'Created stack items for Emma';

  -- Insert 90 days of realistic daily entries with pain patterns
  FOR i IN 0..89 LOOP
    entry_date := CURRENT_DATE - (89 - i);
    
    -- Create realistic pain patterns (flare-ups every 7-10 days)
    IF (i % 8) = 0 OR (i % 11) = 0 THEN
      pain_flare := true;
      pain_score := 7 + (random() * 3)::int;
      mood_score := 3 + (random() * 3)::int;
      sleep_score := 3 + (random() * 3)::int;
      pain_chips := ARRAY['flaring_up', 'tender', 'achy'];
      mood_chips := ARRAY['frustrated', 'overwhelmed', 'managing'];
    ELSIF (i % 15) = 0 THEN
      pain_flare := true;
      pain_score := 8 + (random() * 2)::int;
      mood_score := 2 + (random() * 3)::int;
      sleep_score := 2 + (random() * 3)::int;
      pain_chips := ARRAY['debilitating', 'sharp', 'burning'];
      mood_chips := ARRAY['defeated', 'exhausted', 'coping'];
    ELSE
      pain_flare := false;
      pain_score := 2 + (random() * 4)::int;
      mood_score := 5 + (random() * 4)::int;
      sleep_score := 5 + (random() * 4)::int;
      
      CASE (random() * 3)::int
        WHEN 0 THEN pain_chips := ARRAY['manageable', 'dull'];
        WHEN 1 THEN pain_chips := ARRAY['mild', 'stiff'];
        ELSE pain_chips := ARRAY['background', 'tolerable'];
      END CASE;
      
      CASE (random() * 4)::int
        WHEN 0 THEN mood_chips := ARRAY['hopeful', 'grateful'];
        WHEN 1 THEN mood_chips := ARRAY['determined', 'focused'];
        WHEN 2 THEN mood_chips := ARRAY['peaceful', 'content'];
        ELSE mood_chips := ARRAY['resilient', 'positive'];
      END CASE;
    END IF;
    
    journal_text := null;
    IF (i % 3) = 0 OR pain_flare THEN
      CASE (random() * 6)::int
        WHEN 0 THEN journal_text := 'Had a flare-up today. Heat therapy and CBD helped some. Reminding myself this is temporary and I''ve gotten through worse.';
        WHEN 1 THEN journal_text := 'Good day overall. Made it through my morning walk without too much stiffness. The magnesium seems to be helping with sleep.';
        WHEN 2 THEN journal_text := 'Feeling frustrated with the pain today. Trying to focus on what I can control - my supplements, gentle movement, and stress management.';
        WHEN 3 THEN journal_text := 'Swimming felt amazing today. The water really helps with the joint stiffness. Need to remember this for next time I''m feeling stuck.';
        WHEN 4 THEN journal_text := 'Meditation helped me get through a rough patch. The breathing exercises are becoming a real tool in my toolkit.';
        ELSE journal_text := 'Tracking my patterns is helping me see connections I never noticed before. Small wins feel bigger when I can see the progress.';
      END CASE;
    END IF;
    
    INSERT INTO daily_entries (
      profile_id, local_date, mood, sleep_quality, pain, sleep_hours, night_wakes, tags, journal, created_at
    ) VALUES (
      emma_profile_id,
      entry_date,
      mood_score,
      sleep_score,
      pain_score,
      7 + (random() * 2)::int,
      (random() * 2)::int,
      pain_chips || mood_chips,
      journal_text,
      entry_date::timestamp + (random() * interval '12 hours')
    );
  END LOOP;

  RAISE NOTICE 'Created 90 days of daily entries for Emma';

  -- Create follower auth users and profiles
  INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, role, aud) VALUES 
  (follower_1_id, '00000000-0000-0000-0000-000000000000', 'jessica.demo@biostackr.io', crypt('demo-password-123', gen_salt('bf')), NOW() - INTERVAL '35 days', NOW() - INTERVAL '35 days', NOW(), '{"provider":"email","providers":["email"]}', '{"display_name":"Jessica"}', false, 'authenticated', 'authenticated'),
  (follower_2_id, '00000000-0000-0000-0000-000000000000', 'mom.demo@biostackr.io', crypt('demo-password-123', gen_salt('bf')), NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days', NOW(), '{"provider":"email","providers":["email"]}', '{"display_name":"Mom"}', false, 'authenticated', 'authenticated'),
  (follower_3_id, '00000000-0000-0000-0000-000000000000', 'sarah.demo@biostackr.io', crypt('demo-password-123', gen_salt('bf')), NOW() - INTERVAL '25 days', NOW() - INTERVAL '25 days', NOW(), '{"provider":"email","providers":["email"]}', '{"display_name":"Sarah"}', false, 'authenticated', 'authenticated'),
  (follower_4_id, '00000000-0000-0000-0000-000000000000', 'drchen.demo@biostackr.io', crypt('demo-password-123', gen_salt('bf')), NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days', NOW(), '{"provider":"email","providers":["email"]}', '{"display_name":"Dr. Chen"}', false, 'authenticated', 'authenticated');

  INSERT INTO profiles (user_id, display_name, slug, bio, public, created_at, onboarding_completed) VALUES 
  (follower_1_id, 'Jessica', 'jessica-wellness', 'Supporting friends on their health journeys', true, NOW() - INTERVAL '35 days', true),
  (follower_2_id, 'Mom', 'family-support', 'Proud parent supporting my daughter', true, NOW() - INTERVAL '30 days', true),
  (follower_3_id, 'Sarah', 'sarah-similar-journey', 'Also managing chronic pain - finding community helps', true, NOW() - INTERVAL '25 days', true),
  (follower_4_id, 'Dr. Chen', 'dr-chen-pain-specialist', 'Pain management specialist', true, NOW() - INTERVAL '20 days', true);

  -- Insert follower relationships
  INSERT INTO stack_followers (owner_user_id, follower_user_id, follower_email, verified_at, created_at) VALUES 
  (emma_user_id, follower_1_id, 'jessica.demo@biostackr.io', NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days'),
  (emma_user_id, follower_2_id, 'mom.demo@biostackr.io', NOW() - INTERVAL '25 days', NOW() - INTERVAL '25 days'),
  (emma_user_id, follower_3_id, 'sarah.demo@biostackr.io', NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days'),
  (emma_user_id, follower_4_id, 'drchen.demo@biostackr.io', NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days');

  RAISE NOTICE 'Created 4 followers for Emma';

  -- Get item IDs for completed items
  SELECT id INTO mag_item_id FROM stack_items WHERE profile_id = emma_profile_id AND name = 'Magnesium Glycinate';
  SELECT id INTO turmeric_item_id FROM stack_items WHERE profile_id = emma_profile_id AND name = 'Turmeric Curcumin';
  SELECT id INTO yoga_item_id FROM stack_items WHERE profile_id = emma_profile_id AND name = 'Gentle Yoga';
  SELECT id INTO walking_item_id FROM stack_items WHERE profile_id = emma_profile_id AND name = 'Walking';

  -- Add completed items for today
  INSERT INTO completed_items (profile_id, item_id, completed_at, item_type) VALUES 
  (emma_profile_id, mag_item_id, CURRENT_DATE::timestamp + interval '9 hours', 'supplement'),
  (emma_profile_id, turmeric_item_id, CURRENT_DATE::timestamp + interval '8 hours', 'supplement'),
  (emma_profile_id, yoga_item_id, CURRENT_DATE::timestamp + interval '7 hours', 'protocol'),
  (emma_profile_id, walking_item_id, CURRENT_DATE::timestamp + interval '6 hours', 'movement');

  RAISE NOTICE 'Created completed items for Emma';
  RAISE NOTICE '✅ Demo account created successfully!';
  RAISE NOTICE 'Profile URL: /u/emma-chronic-pain-journey';
  RAISE NOTICE 'Login: emma.demo@biostackr.io / demo-password-123';
  
END $$;