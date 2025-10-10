-- Emma's Complete Demo Account: Chronic Pain Management Journey
-- A realistic, fully-fleshed out profile with 60 days of authentic data

-- Clean up any existing demo data
DELETE FROM journal_entries WHERE profile_id IN (
  SELECT id FROM profiles WHERE slug = 'emma-chronic-pain-journey'
);
DELETE FROM stack_followers WHERE owner_user_id IN (
  SELECT user_id FROM profiles WHERE slug = 'emma-chronic-pain-journey'
);
DELETE FROM daily_entries WHERE user_id IN (
  SELECT user_id FROM profiles WHERE slug = 'emma-chronic-pain-journey'
);
DELETE FROM stack_items WHERE profile_id IN (
  SELECT id FROM profiles WHERE slug = 'emma-chronic-pain-journey'
);
DELETE FROM profiles WHERE slug = 'emma-chronic-pain-journey';
DELETE FROM auth.users WHERE email = 'emma.demo@biostackr.io';

-- Create Emma's complete profile
DO $$
DECLARE
  emma_user_id UUID;
  emma_profile_id UUID;
  entry_date DATE;
  day_num INT;
  pain_score INT;
  mood_score INT;
  sleep_score INT;
  pain_chips TEXT[];
  mood_chips TEXT[];
  journal_text TEXT;
  is_flare BOOLEAN;
  is_good_period BOOLEAN;
  follower_email TEXT;
  i INT;
BEGIN
  -- Create auth user for Emma
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
    is_super_admin, role, aud
  ) VALUES (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'emma.demo@biostackr.io',
    '$2a$10$dummyencryptedpasswordhash1234567890123456789012',
    NOW() - INTERVAL '65 days',
    NOW() - INTERVAL '65 days',
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"display_name":"Emma"}',
    false, 'authenticated', 'authenticated'
  ) RETURNING id INTO emma_user_id;

  -- Create Emma's profile with proper header
  INSERT INTO profiles (
    user_id, display_name, slug, bio, public, avatar_url,
    created_at, updated_at, onboarding_completed, allow_stack_follow,
    show_public_followers, show_journal_public
  ) VALUES (
    emma_user_id,
    'Emma',
    'emma-chronic-pain-journey',
    'Managing fibromyalgia and chronic pain through a holistic approach. Tracking what works, what doesn''t, and finding hope in the small victories. 💜',
    true,
    'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400&h=400&fit=crop', -- Golden retriever (therapy dog)
    NOW() - INTERVAL '65 days',
    NOW(),
    true, true, true, true
  ) RETURNING id INTO emma_profile_id;

  RAISE NOTICE 'Created Emma profile';

  -- SUPPLEMENTS & MEDICATIONS (realistic fibromyalgia stack)
  INSERT INTO stack_items (profile_id, name, dose, item_type, frequency, schedule_days, timing, brand, notes, created_at) VALUES 
  -- Pain Management
  (emma_profile_id, 'Pregabalin (Lyrica)', '150mg', 'supplements', 'daily', '{1,2,3,4,5,6,7}', 'evening', 'Generic', 'Prescribed for nerve pain - helps with sleep too', NOW() - INTERVAL '60 days'),
  (emma_profile_id, 'Low-Dose Naltrexone (LDN)', '4.5mg', 'supplements', 'daily', '{1,2,3,4,5,6,7}', 'evening', 'Compounded', 'Game changer for pain levels', NOW() - INTERVAL '45 days'),
  (emma_profile_id, 'Magnesium Glycinate', '400mg', 'supplements', 'daily', '{1,2,3,4,5,6,7}', 'evening', 'Thorne', 'Helps muscle tension and sleep', NOW() - INTERVAL '60 days'),
  
  -- Anti-inflammatory & Support
  (emma_profile_id, 'Turmeric Curcumin', '1000mg', 'supplements', 'daily', '{1,2,3,4,5,6,7}', 'morning', 'Life Extension', 'With black pepper for absorption', NOW() - INTERVAL '55 days'),
  (emma_profile_id, 'Omega-3 Fish Oil', '2000mg', 'supplements', 'daily', '{1,2,3,4,5,6,7}', 'morning', 'Nordic Naturals', 'EPA/DHA for inflammation', NOW() - INTERVAL '60 days'),
  (emma_profile_id, 'Vitamin D3 + K2', '5000 IU', 'supplements', 'daily', '{1,2,3,4,5,6,7}', 'morning', 'Thorne', 'Levels were critically low', NOW() - INTERVAL '60 days'),
  (emma_profile_id, 'CoQ10', '200mg', 'supplements', 'daily', '{1,2,3,4,5,6,7}', 'morning', 'Jarrow', 'For energy and mitochondrial support', NOW() - INTERVAL '50 days'),
  
  -- As-needed
  (emma_profile_id, 'CBD Oil (Full Spectrum)', '25mg', 'supplements', 'as_needed', '{}', 'anytime', 'Charlotte''s Web', 'For breakthrough pain', NOW() - INTERVAL '40 days'),
  (emma_profile_id, 'Tylenol', '500mg', 'supplements', 'as_needed', '{}', 'anytime', 'Generic', 'Bad pain days only', NOW() - INTERVAL '60 days');

  -- PROTOCOLS (evidence-based for fibromyalgia)
  INSERT INTO stack_items (profile_id, name, dose, item_type, frequency, schedule_days, timing, brand, notes, created_at) VALUES 
  (emma_profile_id, 'Gentle Yoga', '20 min', 'protocols', 'daily', '{1,2,3,4,5,6,7}', 'morning', null, 'Yoga with Adriene - modified poses', NOW() - INTERVAL '55 days'),
  (emma_profile_id, 'Heat Therapy', '30 min', 'protocols', 'daily', '{1,2,3,4,5,6,7}', 'evening', null, 'Heating pad on lower back and shoulders', NOW() - INTERVAL '60 days'),
  (emma_profile_id, 'Meditation', '15 min', 'protocols', 'daily', '{1,2,3,4,5,6,7}', 'evening', null, 'Insight Timer - pain management tracks', NOW() - INTERVAL '50 days'),
  (emma_profile_id, 'Epsom Salt Bath', '20 min', 'protocols', 'weekly', '{3,7}', 'evening', null, '2 cups Epsom salt - helps muscle aches', NOW() - INTERVAL '60 days');

  -- MOVEMENT (pacing is key for fibromyalgia)
  INSERT INTO stack_items (profile_id, name, dose, item_type, frequency, schedule_days, timing, brand, notes, created_at) VALUES 
  (emma_profile_id, 'Morning Walk', '15 min', 'movement', 'daily', '{1,2,3,4,5,6,7}', 'morning', null, 'Slow pace - with my dog Finn', NOW() - INTERVAL '60 days'),
  (emma_profile_id, 'Gentle Swimming', '30 min', 'movement', 'weekly', '{2,5}', 'morning', null, 'Warm pool - best for joint pain', NOW() - INTERVAL '45 days'),
  (emma_profile_id, 'Stretching Routine', '10 min', 'movement', 'daily', '{1,2,3,4,5,6,7}', 'evening', null, 'Before bed - prevents morning stiffness', NOW() - INTERVAL '55 days');

  -- MINDFULNESS & STRESS MANAGEMENT
  INSERT INTO stack_items (profile_id, name, dose, item_type, frequency, schedule_days, timing, brand, notes, created_at) VALUES 
  (emma_profile_id, 'Breathing Exercises', '5 min', 'mindfulness', 'daily', '{1,2,3,4,5,6,7}', 'anytime', null, '4-7-8 breathing when pain spikes', NOW() - INTERVAL '60 days'),
  (emma_profile_id, 'Gratitude Journaling', '5 min', 'mindfulness', 'daily', '{1,2,3,4,5,6,7}', 'evening', null, '3 things I''m grateful for', NOW() - INTERVAL '50 days'),
  (emma_profile_id, 'Progressive Muscle Relaxation', '10 min', 'mindfulness', 'daily', '{1,2,3,4,5,6,7}', 'evening', null, 'Reduces muscle tension', NOW() - INTERVAL '45 days');

  -- DEVICES (common for pain management)
  INSERT INTO stack_items (profile_id, name, dose, item_type, frequency, schedule_days, timing, brand, notes, created_at) VALUES 
  (emma_profile_id, 'TENS Unit', '30 min', 'devices', 'as_needed', '{}', 'anytime', 'iReliev', 'For lower back pain flares', NOW() - INTERVAL '40 days'),
  (emma_profile_id, 'Red Light Therapy', '15 min', 'devices', 'daily', '{1,2,3,4,5,6,7}', 'morning', 'Joovv Mini', 'Helps with inflammation and energy', NOW() - INTERVAL '30 days');

  RAISE NOTICE 'Created Emma''s complete stack (% items)', 20;

  -- CREATE 60 DAYS OF REALISTIC DATA WITH CLEAR PATTERNS
  -- Pattern: Days 1-20 (rough period), Days 21-40 (improvement after LDN), Days 41-50 (setback), Days 51-60 (recovery)
  
  FOR i IN 0..59 LOOP
    entry_date := CURRENT_DATE - (59 - i);
    day_num := i + 1;
    
    -- PERIOD 1: Days 1-20 (Before LDN, struggling)
    IF day_num <= 20 THEN
      -- Flare days (every 5-7 days)
      IF (day_num % 6) = 0 OR (day_num % 7) = 0 THEN
        pain_score := 8 + (random() * 2)::int; -- 8-10
        mood_score := 2 + (random() * 2)::int; -- 2-4
        sleep_score := 2 + (random() * 2)::int; -- 2-4
        pain_chips := ARRAY['debilitating', 'burning', 'tender'];
        mood_chips := ARRAY['defeated', 'exhausted', 'struggling'];
      ELSE
        -- Baseline (still high pain)
        pain_score := 6 + (random() * 2)::int; -- 6-8
        mood_score := 3 + (random() * 3)::int; -- 3-6
        sleep_score := 3 + (random() * 3)::int; -- 3-6
        pain_chips := ARRAY['achy', 'stiff', 'persistent'];
        mood_chips := ARRAY['hopeful', 'managing', 'tired'];
      END IF;
    
    -- PERIOD 2: Days 21-40 (Started LDN - improvement!)
    ELSIF day_num > 20 AND day_num <= 40 THEN
      is_good_period := true;
      -- Occasional flares still happen
      IF (day_num % 10) = 0 THEN
        pain_score := 6 + (random() * 2)::int; -- 6-8
        mood_score := 4 + (random() * 2)::int; -- 4-6
        sleep_score := 4 + (random() * 2)::int; -- 4-6
        pain_chips := ARRAY['flaring_up', 'tender', 'manageable'];
        mood_chips := ARRAY['frustrated', 'patient', 'resilient'];
      ELSE
        -- Much better baseline
        pain_score := 3 + (random() * 3)::int; -- 3-6
        mood_score := 6 + (random() * 3)::int; -- 6-9
        sleep_score := 6 + (random() * 3)::int; -- 6-9
        pain_chips := ARRAY['mild', 'manageable', 'tolerable'];
        mood_chips := ARRAY['grateful', 'hopeful', 'energized'];
      END IF;
    
    -- PERIOD 3: Days 41-50 (Setback - overdid it)
    ELSIF day_num > 40 AND day_num <= 50 THEN
      pain_score := 7 + (random() * 2)::int; -- 7-9
      mood_score := 3 + (random() * 2)::int; -- 3-5
      sleep_score := 3 + (random() * 2)::int; -- 3-5
      pain_chips := ARRAY['flaring_up', 'sharp', 'overwhelming'];
      mood_chips := ARRAY['disappointed', 'learning', 'adjusting'];
    
    -- PERIOD 4: Days 51-60 (Recovery - learned pacing)
    ELSE
      IF (day_num % 8) = 0 THEN
        pain_score := 5 + (random() * 2)::int; -- 5-7
        mood_score := 5 + (random() * 2)::int; -- 5-7
        sleep_score := 5 + (random() * 2)::int; -- 5-7
        pain_chips := ARRAY['moderate', 'manageable', 'accepting'];
        mood_chips := ARRAY['balanced', 'mindful', 'patient'];
      ELSE
        pain_score := 3 + (random() * 2)::int; -- 3-5
        mood_score := 6 + (random() * 3)::int; -- 6-9
        sleep_score := 6 + (random() * 3)::int; -- 6-9
        pain_chips := ARRAY['mild', 'tolerable', 'background'];
        mood_chips := ARRAY['grateful', 'peaceful', 'strong'];
      END IF;
    END IF;
    
    -- Add journal entries on key days
    journal_text := null;
    
    -- Day 1: Starting point
    IF day_num = 1 THEN
      journal_text := 'Starting to track everything more carefully. Doctor suggested keeping detailed notes about pain patterns and what helps. Today was rough - pain 7/10, barely slept. But I''m hopeful this tracking will help us figure things out.';
    
    -- Day 8: Bad flare
    ELSIF day_num = 8 THEN
      journal_text := 'Worst flare in weeks. Pain woke me up at 3am - that burning sensation in my shoulders and back. Used heat pad and CBD oil. Finn (my golden retriever) stayed close all day, such a good therapy dog. Days like this are so hard, but trying to remember they pass.';
    
    -- Day 21: Started LDN
    ELSIF day_num = 21 THEN
      journal_text := 'Big day - starting Low Dose Naltrexone (LDN) tonight. My rheumatologist finally agreed to try it after I showed her the research. Nervous but hopeful. She said it takes 2-3 weeks to notice effects, but some people see improvement sooner. Fingers crossed 🤞';
    
    -- Day 28: LDN working!
    ELSIF day_num = 28 THEN
      journal_text := 'This might be working!! Pain has been consistently lower this week - averaging 4-5 instead of 7-8. Woke up without that awful morning stiffness for the first time in months. Slept through the night. Almost crying with relief. It''s not perfect but this is HUGE.';
    
    -- Day 35: Good period
    ELSIF day_num = 35 THEN
      journal_text := 'Best week I''ve had in over a year. Went swimming twice, walked Finn every morning, even had coffee with a friend. Pain is still there (always is) but it''s background noise instead of the main event. This is what I''ve been fighting for - just to feel somewhat normal again.';
    
    -- Day 43: Overdid it
    ELSIF day_num = 43 THEN
      journal_text := 'I overdid it. Felt so good last week that I pushed too hard - cleaned the whole house, went hiking with friends. Now I''m paying for it. Severe flare - pain 8/10. Frustrated with myself because I know better. Fibromyalgia doesn''t care that you''re ''feeling good.'' Pacing is everything and I forgot that. Back to basics: heat, rest, gentle movement only.';
    
    -- Day 52: Learning
    ELSIF day_num = 52 THEN
      journal_text := 'Recovering from the setback. Learned (again) that even when I feel good, I can''t push like I used to. It''s not giving up - it''s being smart. Modified my routine: shorter walks, more rest days, listening to my body. The LDN is still helping, I just need to honor my limits.';
    
    -- Day 59: Reflection
    ELSIF day_num = 59 THEN
      journal_text := 'Looking back at these 60 days - I can see real patterns now. LDN made a genuine difference. Swimming helps more than I thought. Rest is medicine, not laziness. Bad days still happen, but they''re less frequent and less severe. I''m learning to work WITH my body instead of fighting it. Still have a long way to go, but I''m finally moving forward.';
    
    -- Occasional other entries
    ELSIF (day_num % 12) = 0 THEN
      CASE (random() * 3)::int
        WHEN 0 THEN journal_text := 'Heat therapy and stretching before bed really helping with morning stiffness. Small wins.';
        WHEN 1 THEN journal_text := 'Grateful for this tracking system - it''s helping me see what actually works vs what I think works.';
        ELSE journal_text := 'Reminder to self: yoga doesn''t cure fibromyalgia, but it does help me feel more in control.';
      END CASE;
    END IF;
    
    -- Insert daily entry
    INSERT INTO daily_entries (
      user_id, local_date, mood, sleep_quality, pain,
      sleep_hours, night_wakes, tags, journal, created_at
    ) VALUES (
      emma_user_id, entry_date, mood_score, sleep_score, pain_score,
      5 + (random() * 3)::int, -- 5-8 hours
      (random() * 3)::int, -- 0-3 wakes
      pain_chips || mood_chips,
      journal_text,
      entry_date::timestamp + interval '9 hours' -- Morning check-ins
    );
  END LOOP;

  RAISE NOTICE 'Created 60 days of realistic data with clear patterns (including today)';

  -- CREATE 5 DETAILED JOURNAL ENTRIES
  INSERT INTO journal_entries (profile_id, heading, body, public, created_at) VALUES
  (emma_profile_id, 'Starting My Fibromyalgia Journey Here',
   'I''''ve been dealing with chronic pain for 3 years, but I''''m just now starting to track things systematically. My rheumatologist suggested keeping detailed records of what helps and what doesn''''t. So here goes.

The pain is constant - some days it''''s a 4, some days it''''s a 9. The worst is waking up feeling like I''''ve been hit by a truck, even after 8 hours of sleep. My shoulders, neck, and lower back are the main problem areas.

What I''''m trying now:
- Pregabalin (helps with sleep and nerve pain)
- Magnesium and basic supplements
- Gentle yoga when I can manage it
- Heat therapy every evening

Hoping to find patterns and figure out what actually moves the needle.',
   true, NOW() - INTERVAL '60 days'),

  (emma_profile_id, 'The LDN Experiment',
   'After months of research and advocating for myself, my doctor finally agreed to let me try Low Dose Naltrexone (LDN). It''''s off-label for fibromyalgia, but the studies are promising and the online support groups have so many success stories.

I''''m starting at 4.5mg before bed. The theory is that it modulates the immune system and reduces neuroinflammation. Honestly, I''''m just hoping for anything that gives me my life back.

The research shows it takes 2-3 weeks to see effects. Some people report vivid dreams initially. I''''ll track everything here and see what happens.

If this works even a little bit, it''''ll be worth the fight to get it prescribed.',
   true, NOW() - INTERVAL '40 days'),

  (emma_profile_id, 'It''''s Working - LDN Update',
   'Week 2 of LDN and I''''m cautiously optimistic. My pain levels have dropped from an average of 7-8 to about 4-5. That might not sound like much, but it''''s the difference between barely functioning and actually living.

The morning stiffness is SO much better. I''''m waking up and actually able to get out of bed without needing 30 minutes to mobilize. Yesterday I walked my dog without pain shooting through my legs. 

I know fibromyalgia is unpredictable and this could be a good week unrelated to the LDN. But my gut says this is different. For the first time in years, I feel like I''''m getting better instead of just managing.

Still doing all my other protocols - yoga, heat therapy, pacing, supplements. It all works together.',
   true, NOW() - INTERVAL '32 days'),

  (emma_profile_id, 'The Crash - Learning About Pacing (Again)',
   'I crashed hard this week and I''''m frustrated with myself. I felt so good that I pushed too hard - cleaned the entire house, went on a 2-hour hike, stayed up late with friends. All things that ''''normal'''' people do without thinking.

But I''''m not normal. My body doesn''''t recover the same way. And now I''''m in a severe flare - pain 8/10, exhausted, back to struggling with basic tasks.

This is the hardest part of chronic illness - you feel good and want to DO ALL THE THINGS. But that''''s exactly when you need to pace yourself most. It''''s not giving up, it''''s being strategic.

So I''''m back to basics: extra rest, heat therapy, very gentle movement only. And reminding myself that having limits doesn''''t make me weak - it makes me smart.',
   true, NOW() - INTERVAL '15 days'),

  (emma_profile_id, 'Two Months of Tracking - What I''''ve Learned',
   'Looking back at 60 days of data, I can finally see patterns clearly:

WHAT HELPS:
- LDN has been a game-changer (average pain down 3 points)
- Swimming in warm water (better than any other exercise)
- Heat therapy every single evening (not just on bad days)
- Pacing - doing 70% of what I think I can handle
- Consistent sleep schedule (even weekends)

WHAT DOESN''''T:
- Pushing through pain (always makes it worse later)
- Irregular sleep (even one late night affects me for days)
- High-intensity exercise (gentle is the only way)
- Stress (pain always spikes when I''''m stressed)

I''''m not cured. I still have bad days. But I''''m having MORE good days than bad days now, and that''''s everything.

If you''''re reading this and struggling with chronic pain: Keep tracking. Keep advocating. Keep trying. Small improvements compound over time.',
   true, NOW() - INTERVAL '2 days');

  RAISE NOTICE 'Created 5 detailed journal entries';

  -- Create 45 realistic followers (mix of patients, friends, medical professionals)
  FOR i IN 1..45 LOOP
    -- Create varied follower types
    IF i <= 15 THEN
      follower_email := 'chronic-pain-friend-' || i || '@example.com';
    ELSIF i <= 30 THEN
      follower_email := 'supporter-' || i || '@example.com';
    ELSE
      follower_email := 'medical-pro-' || i || '@example.com';
    END IF;
    
    -- Insert follower relationship (simplified - just the relationship, not full user accounts)
    INSERT INTO stack_followers (owner_user_id, follower_user_id, follower_email, verified_at, created_at)
    VALUES (
      emma_user_id,
      NULL, -- Email-only followers
      follower_email,
      NOW() - (random() * interval '60 days'),
      NOW() - (random() * interval '60 days')
    );
  END LOOP;

  RAISE NOTICE 'Created 45 followers for Emma';
  RAISE NOTICE '✅ Emma''s complete profile created successfully!';
  RAISE NOTICE '📍 Profile URL: https://www.biostackr.io/u/emma-chronic-pain-journey';
  RAISE NOTICE '📊 60 days of data with clear patterns';
  RAISE NOTICE '📝 5 authentic journal entries';
  RAISE NOTICE '💊 20 stack items across all categories';
  RAISE NOTICE '👥 45 followers';
  
END $$;
