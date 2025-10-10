-- Emma's Complete Demo Account: Chronic Pain Management Journey
-- Clean, tested version with proper escaping

-- Clean up existing demo data
DELETE FROM journal_entries WHERE profile_id IN (SELECT id FROM profiles WHERE slug = 'emma-chronic-pain-journey');
DELETE FROM stack_followers WHERE owner_user_id IN (SELECT user_id FROM profiles WHERE slug = 'emma-chronic-pain-journey');
DELETE FROM daily_entries WHERE user_id IN (SELECT user_id FROM profiles WHERE slug = 'emma-chronic-pain-journey');
DELETE FROM stack_items WHERE profile_id IN (SELECT id FROM profiles WHERE slug = 'emma-chronic-pain-journey');
DELETE FROM profiles WHERE slug = 'emma-chronic-pain-journey';
DELETE FROM auth.users WHERE email = 'emma.demo@biostackr.io';

-- Create Emma's profile with all data
DO $$
DECLARE
  v_emma_user_id UUID;
  v_emma_profile_id UUID;
  v_entry_date DATE;
  v_day_num INT;
  v_pain_score INT;
  v_mood_score INT;
  v_sleep_score INT;
  v_pain_chips TEXT[];
  v_mood_chips TEXT[];
  v_journal_text TEXT;
  v_follower_email TEXT;
  v_i INT;
BEGIN
  -- Create auth user
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
    is_super_admin, role, aud
  ) VALUES (
    gen_random_uuid(), '00000000-0000-0000-0000-000000000000',
    'emma.demo@biostackr.io',
    '$2a$10$dummyencryptedpasswordhash1234567890123456789012',
    NOW() - INTERVAL '65 days', NOW() - INTERVAL '65 days', NOW(),
    '{"provider":"email","providers":["email"]}', '{"display_name":"Emma"}',
    false, 'authenticated', 'authenticated'
  ) RETURNING id INTO v_emma_user_id;

  -- Create profile
  INSERT INTO profiles (
    user_id, display_name, slug, bio, public, avatar_url,
    created_at, updated_at, onboarding_completed, allow_stack_follow,
    show_public_followers, show_journal_public
  ) VALUES (
    v_emma_user_id, 'Emma', 'emma-chronic-pain-journey',
    'Managing fibromyalgia and chronic pain through a holistic approach. Tracking what works, what doesn''t, and finding hope in the small victories. 💜',
    true, 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400&h=400&fit=crop',
    NOW() - INTERVAL '65 days', NOW(), true, true, true, true
  ) RETURNING id INTO v_emma_profile_id;

  RAISE NOTICE 'Created Emma profile';

  -- Insert stack items (medications & supplements)
  INSERT INTO stack_items (profile_id, name, dose, item_type, frequency, schedule_days, timing, brand, notes, created_at) VALUES 
  (v_emma_profile_id, 'Pregabalin (Lyrica)', '150mg', 'supplements', 'daily', '{1,2,3,4,5,6,7}', 'evening', 'Generic', 'Prescribed for nerve pain', NOW() - INTERVAL '60 days'),
  (v_emma_profile_id, 'Low-Dose Naltrexone', '4.5mg', 'supplements', 'daily', '{1,2,3,4,5,6,7}', 'evening', 'Compounded', 'Game changer for pain', NOW() - INTERVAL '45 days'),
  (v_emma_profile_id, 'Magnesium Glycinate', '400mg', 'supplements', 'daily', '{1,2,3,4,5,6,7}', 'evening', 'Thorne', 'Muscle tension and sleep', NOW() - INTERVAL '60 days'),
  (v_emma_profile_id, 'Turmeric Curcumin', '1000mg', 'supplements', 'daily', '{1,2,3,4,5,6,7}', 'morning', 'Life Extension', 'Anti-inflammatory', NOW() - INTERVAL '55 days'),
  (v_emma_profile_id, 'Omega-3 Fish Oil', '2000mg', 'supplements', 'daily', '{1,2,3,4,5,6,7}', 'morning', 'Nordic Naturals', 'EPA/DHA', NOW() - INTERVAL '60 days'),
  (v_emma_profile_id, 'Vitamin D3 + K2', '5000 IU', 'supplements', 'daily', '{1,2,3,4,5,6,7}', 'morning', 'Thorne', 'Levels were low', NOW() - INTERVAL '60 days'),
  (v_emma_profile_id, 'CoQ10', '200mg', 'supplements', 'daily', '{1,2,3,4,5,6,7}', 'morning', 'Jarrow', 'Energy support', NOW() - INTERVAL '50 days'),
  (v_emma_profile_id, 'CBD Oil', '25mg', 'supplements', 'as_needed', '{}', 'anytime', 'Charlotte''s Web', 'Breakthrough pain', NOW() - INTERVAL '40 days'),
  (v_emma_profile_id, 'Tylenol', '500mg', 'supplements', 'as_needed', '{}', 'anytime', 'Generic', 'Bad days only', NOW() - INTERVAL '60 days');

  -- Protocols
  INSERT INTO stack_items (profile_id, name, dose, item_type, frequency, schedule_days, timing, notes, created_at) VALUES 
  (v_emma_profile_id, 'Gentle Yoga', '20 min', 'protocols', 'daily', '{1,2,3,4,5,6,7}', 'morning', 'Modified poses', NOW() - INTERVAL '55 days'),
  (v_emma_profile_id, 'Heat Therapy', '30 min', 'protocols', 'daily', '{1,2,3,4,5,6,7}', 'evening', 'Lower back and shoulders', NOW() - INTERVAL '60 days'),
  (v_emma_profile_id, 'Meditation', '15 min', 'protocols', 'daily', '{1,2,3,4,5,6,7}', 'evening', 'Pain management tracks', NOW() - INTERVAL '50 days'),
  (v_emma_profile_id, 'Epsom Salt Bath', '20 min', 'protocols', 'weekly', '{3,7}', 'evening', 'Muscle aches', NOW() - INTERVAL '60 days');

  -- Movement
  INSERT INTO stack_items (profile_id, name, dose, item_type, frequency, schedule_days, timing, notes, created_at) VALUES 
  (v_emma_profile_id, 'Morning Walk', '15 min', 'movement', 'daily', '{1,2,3,4,5,6,7}', 'morning', 'With my dog Finn', NOW() - INTERVAL '60 days'),
  (v_emma_profile_id, 'Gentle Swimming', '30 min', 'movement', 'weekly', '{2,5}', 'morning', 'Warm pool', NOW() - INTERVAL '45 days'),
  (v_emma_profile_id, 'Stretching', '10 min', 'movement', 'daily', '{1,2,3,4,5,6,7}', 'evening', 'Before bed', NOW() - INTERVAL '55 days');

  -- Mindfulness
  INSERT INTO stack_items (profile_id, name, dose, item_type, frequency, schedule_days, timing, notes, created_at) VALUES 
  (v_emma_profile_id, 'Breathing Exercises', '5 min', 'mindfulness', 'daily', '{1,2,3,4,5,6,7}', 'anytime', '4-7-8 breathing', NOW() - INTERVAL '60 days'),
  (v_emma_profile_id, 'Gratitude Journal', '5 min', 'mindfulness', 'daily', '{1,2,3,4,5,6,7}', 'evening', '3 things daily', NOW() - INTERVAL '50 days'),
  (v_emma_profile_id, 'Muscle Relaxation', '10 min', 'mindfulness', 'daily', '{1,2,3,4,5,6,7}', 'evening', 'Reduces tension', NOW() - INTERVAL '45 days');

  -- Devices
  INSERT INTO stack_items (profile_id, name, dose, item_type, frequency, schedule_days, timing, brand, notes, created_at) VALUES 
  (v_emma_profile_id, 'TENS Unit', '30 min', 'devices', 'as_needed', '{}', 'anytime', 'iReliev', 'Back pain flares', NOW() - INTERVAL '40 days'),
  (v_emma_profile_id, 'Red Light Therapy', '15 min', 'devices', 'daily', '{1,2,3,4,5,6,7}', 'morning', 'Joovv Mini', 'Inflammation', NOW() - INTERVAL '30 days');

  RAISE NOTICE 'Created 20 stack items';

  -- Create 60 days of daily entries with realistic patterns
  FOR v_i IN 0..59 LOOP
    v_entry_date := CURRENT_DATE - (59 - v_i);
    v_day_num := v_i + 1;
    
    -- Pattern: Days 1-20 (rough), 21-40 (improvement), 41-50 (setback), 51-60 (recovery)
    IF v_day_num <= 20 THEN
      IF (v_day_num % 6) = 0 THEN
        v_pain_score := 8 + (random() * 2)::int;
        v_mood_score := 2 + (random() * 2)::int;
        v_sleep_score := 2 + (random() * 2)::int;
        v_pain_chips := ARRAY['debilitating', 'burning'];
        v_mood_chips := ARRAY['exhausted', 'struggling'];
      ELSE
        v_pain_score := 6 + (random() * 2)::int;
        v_mood_score := 3 + (random() * 3)::int;
        v_sleep_score := 3 + (random() * 3)::int;
        v_pain_chips := ARRAY['achy', 'stiff'];
        v_mood_chips := ARRAY['hopeful', 'managing'];
      END IF;
    ELSIF v_day_num <= 40 THEN
      IF (v_day_num % 10) = 0 THEN
        v_pain_score := 6 + (random() * 2)::int;
        v_mood_score := 4 + (random() * 2)::int;
        v_sleep_score := 4 + (random() * 2)::int;
        v_pain_chips := ARRAY['flaring_up', 'manageable'];
        v_mood_chips := ARRAY['resilient', 'patient'];
      ELSE
        v_pain_score := 3 + (random() * 3)::int;
        v_mood_score := 6 + (random() * 3)::int;
        v_sleep_score := 6 + (random() * 3)::int;
        v_pain_chips := ARRAY['mild', 'tolerable'];
        v_mood_chips := ARRAY['grateful', 'energized'];
      END IF;
    ELSIF v_day_num <= 50 THEN
      v_pain_score := 7 + (random() * 2)::int;
      v_mood_score := 3 + (random() * 2)::int;
      v_sleep_score := 3 + (random() * 2)::int;
      v_pain_chips := ARRAY['flaring_up', 'sharp'];
      v_mood_chips := ARRAY['disappointed', 'learning'];
    ELSE
      v_pain_score := 3 + (random() * 2)::int;
      v_mood_score := 6 + (random() * 3)::int;
      v_sleep_score := 6 + (random() * 3)::int;
      v_pain_chips := ARRAY['mild', 'background'];
      v_mood_chips := ARRAY['grateful', 'peaceful'];
    END IF;
    
    -- Journal entries on key days
    v_journal_text := NULL;
    IF v_day_num = 1 THEN
      v_journal_text := 'Starting to track more carefully. Pain 7/10 today but hopeful tracking will help.';
    ELSIF v_day_num = 21 THEN
      v_journal_text := 'Starting Low Dose Naltrexone tonight. Nervous but hopeful after all the research.';
    ELSIF v_day_num = 28 THEN
      v_journal_text := 'LDN might be working! Pain down to 4-5. First time waking without stiffness in months.';
    ELSIF v_day_num = 43 THEN
      v_journal_text := 'Overdid it - severe flare. Learning that pacing is everything even when feeling good.';
    ELSIF v_day_num = 59 THEN
      v_journal_text := 'Looking back - LDN made a difference. More good days than bad. Still learning but moving forward.';
    END IF;
    
    INSERT INTO daily_entries (
      user_id, local_date, mood, sleep_quality, pain,
      sleep_hours, night_wakes, tags, journal, created_at
    ) VALUES (
      v_emma_user_id, v_entry_date, v_mood_score, v_sleep_score, v_pain_score,
      5 + (random() * 3)::int, (random() * 3)::int,
      v_pain_chips || v_mood_chips, v_journal_text,
      v_entry_date::timestamp + interval '9 hours'
    );
  END LOOP;

  RAISE NOTICE 'Created 60 days of data';

  -- Create 45 followers
  FOR v_i IN 1..45 LOOP
    IF v_i <= 15 THEN
      v_follower_email := 'chronic-pain-friend-' || v_i || '@example.com';
    ELSIF v_i <= 30 THEN
      v_follower_email := 'supporter-' || v_i || '@example.com';
    ELSE
      v_follower_email := 'medical-pro-' || v_i || '@example.com';
    END IF;
    
    INSERT INTO stack_followers (owner_user_id, follower_user_id, follower_email, verified_at, created_at)
    VALUES (v_emma_user_id, NULL, v_follower_email, NOW() - (random() * interval '60 days'), NOW() - (random() * interval '60 days'));
  END LOOP;

  RAISE NOTICE 'Created 45 followers';
  RAISE NOTICE '✅ Emma profile created: https://www.biostackr.io/u/emma-chronic-pain-journey';
  
END $$;
