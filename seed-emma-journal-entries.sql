-- Add detailed journal entries to Emma's profile
-- Run this after seed-emma-v2.sql

DO $$
DECLARE
  v_emma_profile_id UUID;
BEGIN
  -- Get Emma's profile ID
  SELECT id INTO v_emma_profile_id 
  FROM profiles 
  WHERE slug = 'emma-chronic-pain-journey';

  IF v_emma_profile_id IS NULL THEN
    RAISE EXCEPTION 'Emma profile not found. Run seed-emma-v2.sql first.';
  END IF;

  -- Insert 5 detailed journal entries
  INSERT INTO journal_entries (profile_id, heading, body, public, created_at) VALUES
  
  (v_emma_profile_id, 
   'Starting My Fibromyalgia Journey', 
   E'I\'ve been dealing with chronic pain for 3 years, but I\'m just now starting to track things systematically.\n\nThe pain is constant - some days it\'s a 4, some days it\'s a 9. The worst is waking up feeling like I\'ve been hit by a truck, even after 8 hours of sleep.\n\nWhat I\'m trying now:\n- Pregabalin for nerve pain\n- Magnesium and basic supplements\n- Gentle yoga when I can manage it\n- Heat therapy every evening\n\nHoping to find patterns and figure out what actually moves the needle.',
   true, 
   NOW() - INTERVAL '60 days'),

  (v_emma_profile_id,
   'The LDN Experiment',
   E'After months of research, my doctor finally agreed to let me try Low Dose Naltrexone (LDN).\n\nI\'m starting at 4.5mg before bed. The theory is that it modulates the immune system and reduces neuroinflammation.\n\nThe research shows it takes 2-3 weeks to see effects. Fingers crossed this helps.',
   true,
   NOW() - INTERVAL '40 days'),

  (v_emma_profile_id,
   'It''s Working - LDN Update',
   E'Week 2 of LDN and I\'m cautiously optimistic.\n\nMy pain levels have dropped from an average of 7-8 to about 4-5. That might not sound like much, but it\'s the difference between barely functioning and actually living.\n\nThe morning stiffness is SO much better. I\'m waking up and actually able to get out of bed without needing 30 minutes to mobilize.\n\nFor the first time in years, I feel like I\'m getting better instead of just managing.',
   true,
   NOW() - INTERVAL '32 days'),

  (v_emma_profile_id,
   'The Crash - Learning About Pacing',
   E'I crashed hard this week.\n\nI felt so good that I pushed too hard - cleaned the entire house, went on a 2-hour hike. Now I\'m in a severe flare - pain 8/10, exhausted.\n\nThis is the hardest part of chronic illness - you feel good and want to DO ALL THE THINGS. But that\'s exactly when you need to pace yourself most.\n\nBack to basics: extra rest, heat therapy, very gentle movement only. Having limits doesn\'t make me weak - it makes me smart.',
   true,
   NOW() - INTERVAL '15 days'),

  (v_emma_profile_id,
   'Two Months of Tracking - What I\'ve Learned',
   E'Looking back at 60 days of data, I can finally see patterns clearly:\n\nWHAT HELPS:\n- LDN (game-changer - average pain down 3 points)\n- Swimming in warm water\n- Heat therapy every single evening\n- Pacing - doing 70% of what I think I can handle\n- Consistent sleep schedule\n\nWHAT DOESN\'T:\n- Pushing through pain (always makes it worse later)\n- Irregular sleep\n- High-intensity exercise\n- Stress (pain always spikes)\n\nI\'m not cured. I still have bad days. But I\'m having MORE good days than bad days now, and that\'s everything.\n\nIf you\'re struggling with chronic pain: Keep tracking. Keep advocating. Keep trying. Small improvements compound over time.',
   true,
   NOW() - INTERVAL '2 days');

  RAISE NOTICE '✅ Added 5 detailed journal entries for Emma';
  
END $$;
