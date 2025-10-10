-- ============================================
-- MUM'S CHRONIC PAIN PROFILE - AUGUST 2025
-- ============================================
-- Based on the Reddit post about struggling to communicate pain to doctors
-- August heatmap pattern: Red/Yellow start → Green breakthrough → Yellow regression → Green recovery

DO $$
DECLARE
    v_mum_user_id UUID;
    v_mum_profile_id UUID;
    v_day_offset INTEGER;
    v_date DATE;
BEGIN
    -- Get Mum's IDs (assuming slug is 'mum-chronic-pain')
    SELECT user_id, id INTO v_mum_user_id, v_mum_profile_id
    FROM profiles WHERE slug = 'mum-chronic-pain';
    
    IF v_mum_user_id IS NULL THEN
        RAISE NOTICE 'ERROR: Mum profile not found! Creating profile first...';
        
        -- Create the profile first
        INSERT INTO profiles (user_id, slug, display_name, bio, public, created_at)
        VALUES (
            (SELECT id FROM auth.users LIMIT 1), -- Use first available user or create one
            'mum-chronic-pain',
            'Sarah - Chronic Pain Journey',
            'Tracking chronic pain recovery and finding what actually works. After trying 15+ treatments, finally found relief through systematic tracking.',
            true,
            NOW()
        ) RETURNING user_id, id INTO v_mum_user_id, v_mum_profile_id;
        
        RAISE NOTICE 'Created Mum profile: user_id=%, profile_id=%', v_mum_user_id, v_mum_profile_id;
    END IF;
    
    RAISE NOTICE 'Found Mum: user_id=%, profile_id=%', v_mum_user_id, v_mum_profile_id;
    
    -- Clean existing data
    DELETE FROM daily_entries WHERE user_id = v_mum_user_id;
    DELETE FROM journal_entries WHERE profile_id = v_mum_profile_id;
    DELETE FROM stack_followers WHERE owner_user_id = v_mum_user_id;
    DELETE FROM stack_items WHERE profile_id = v_mum_profile_id;
    DELETE FROM protocols WHERE profile_id = v_mum_profile_id;
    DELETE FROM gear WHERE profile_id = v_mum_profile_id;
    DELETE FROM library_items WHERE profile_id = v_mum_profile_id;
    
    RAISE NOTICE 'Wiped all existing data';
    
    -- ============================================
    -- DAILY ENTRIES - AUGUST 2025 (31 days)
    -- ============================================
    
    -- Days 1-8: RED/YELLOW (severe pain, 8-9/10)
    -- "Maybe a bit better?" but actually in agony
    v_date := '2025-08-01';
    FOR v_day_offset IN 0..7 LOOP
        INSERT INTO daily_entries (user_id, local_date, mood, sleep_quality, pain, sleep_hours, night_wakes, tags, journal, meds, protocols, activity, devices, wearables)
        VALUES (
            v_mum_user_id, v_date + v_day_offset,
            CASE v_day_offset % 3 WHEN 0 THEN 2 WHEN 1 THEN 3 ELSE 2 END, -- Low mood due to pain
            CASE v_day_offset % 3 WHEN 0 THEN 2 WHEN 1 THEN 3 ELSE 3 END, -- Poor sleep
            CASE v_day_offset % 3 WHEN 0 THEN 9 WHEN 1 THEN 8 ELSE 9 END, -- Severe pain 8-9/10
            CASE v_day_offset % 3 WHEN 0 THEN 4.5 WHEN 1 THEN 5.0 ELSE 4.5 END, -- Poor sleep hours
            CASE v_day_offset % 3 WHEN 0 THEN 5 WHEN 1 THEN 4 ELSE 5 END, -- Many night wakes
            ARRAY['exhausted', 'frustrated', 'overwhelmed', 'hopeless'],
            CASE v_day_offset
                WHEN 0 THEN 'New medication day 1. Hoping this one works. Pain still 9/10.'
                WHEN 1 THEN 'Day 2 on new meds. Still in agony. "Maybe a bit better?" - but no, still terrible.'
                WHEN 2 THEN 'Pain at 8/10. Sleep terrible. Can''t think straight to track anything.'
                WHEN 3 THEN 'Another bad day. Pain 9/10. Doctor appointment next week - what will I tell them?'
                WHEN 4 THEN 'Pain 8/10. Tried heat therapy, nothing helps. Feeling hopeless.'
                WHEN 5 THEN 'Pain 9/10. Can''t get out of bed. This medication isn''t working either.'
                WHEN 6 THEN 'Pain 8/10. Family helping more now. They can see I''m struggling.'
                ELSE 'Pain 9/10. Week 1 complete. Still no improvement. Starting to track more consistently.'
            END,
            '["New Medication", "Ibuprofen 800mg", "Heat patches"]'::jsonb,
            '["Heat therapy", "Rest"]'::jsonb,
            '["Minimal movement"]'::jsonb,
            '["Heating pad", "Pain patches"]'::jsonb,
            '["Manual tracking"]'::jsonb
        );
    END LOOP;
    
    -- Days 9-10: YELLOW (moderate pain, 6-7/10)
    -- Starting to see some improvement, beginning to track consistently
    FOR v_day_offset IN 8..9 LOOP
        INSERT INTO daily_entries (user_id, local_date, mood, sleep_quality, pain, sleep_hours, night_wakes, tags, journal, meds, protocols, activity, devices, wearables)
        VALUES (
            v_mum_user_id, v_date + v_day_offset,
            CASE v_day_offset WHEN 8 THEN 4 ELSE 5 END, -- Slightly better mood
            CASE v_day_offset WHEN 8 THEN 4 ELSE 5 END, -- Slightly better sleep
            CASE v_day_offset WHEN 8 THEN 7 ELSE 6 END, -- Pain 6-7/10
            CASE v_day_offset WHEN 8 THEN 5.5 ELSE 6.0 END, -- Better sleep hours
            CASE v_day_offset WHEN 8 THEN 3 ELSE 2 END, -- Fewer night wakes
            ARRAY['hopeful', 'determined', 'progress'],
            CASE v_day_offset
                WHEN 8 THEN 'Pain 7/10 today. Actually better than yesterday. Maybe tracking is helping me see patterns?'
                ELSE 'Pain 6/10! First day under 7 in weeks. Starting to track what I take and when.'
            END,
            '["New Medication", "Ibuprofen 600mg", "Magnesium"]'::jsonb,
            '["Heat therapy", "Gentle stretching"]'::jsonb,
            '["Light walking"]'::jsonb,
            '["Heating pad"]'::jsonb,
            '["Manual tracking"]'::jsonb
        );
    END LOOP;
    
    -- Days 11-17: LIGHT GREEN (good days, 4-5/10)
    -- Found what works! Clear improvement pattern
    FOR v_day_offset IN 10..16 LOOP
        INSERT INTO daily_entries (user_id, local_date, mood, sleep_quality, pain, sleep_hours, night_wakes, tags, journal, meds, protocols, activity, devices, wearables)
        VALUES (
            v_mum_user_id, v_date + v_day_offset,
            CASE (v_day_offset - 10) % 3 WHEN 0 THEN 6 WHEN 1 THEN 7 ELSE 6 END, -- Better mood
            CASE (v_day_offset - 10) % 3 WHEN 0 THEN 6 WHEN 1 THEN 7 ELSE 6 END, -- Better sleep
            CASE (v_day_offset - 10) % 3 WHEN 0 THEN 5 WHEN 1 THEN 4 ELSE 5 END, -- Pain 4-5/10
            CASE (v_day_offset - 10) % 3 WHEN 0 THEN 6.5 WHEN 1 THEN 7.0 ELSE 6.5 END, -- Better sleep
            CASE (v_day_offset - 10) % 3 WHEN 0 THEN 2 WHEN 1 THEN 1 ELSE 2 END, -- Fewer wakes
            ARRAY['hopeful', 'grateful', 'progress', 'functional'],
            CASE (v_day_offset - 10)
                WHEN 0 THEN 'Pain 5/10! This is working! The new medication + tracking is helping me see what works.'
                WHEN 1 THEN 'Pain 4/10. Best day in months. I can actually function today.'
                WHEN 2 THEN 'Pain 5/10. Still good. Making sure I take everything on time.'
                WHEN 3 THEN 'Pain 4/10. Slept 7 hours! Haven''t done that in ages.'
                WHEN 4 THEN 'Pain 5/10. Good day. Family noticed I''m more like myself.'
                WHEN 5 THEN 'Pain 4/10. Another good day. This is the longest stretch of relief I''ve had.'
                ELSE 'Pain 5/10. Week of improvement! Doctor appointment next week - I have data to show them!'
            END,
            '["New Medication", "Ibuprofen 400mg", "Magnesium", "Vitamin D"]'::jsonb,
            '["Heat therapy", "Gentle stretching", "Pain tracking"]'::jsonb,
            '["Walking 20min", "Light housework"]'::jsonb,
            '["Heating pad"]'::jsonb,
            '["Manual tracking"]'::jsonb
        );
    END LOOP;
    
    -- Days 18-24: DARK GREEN (excellent, 2-3/10)
    -- 7 days in a row of significant relief - best stretch in months
    FOR v_day_offset IN 17..23 LOOP
        INSERT INTO daily_entries (user_id, local_date, mood, sleep_quality, pain, sleep_hours, night_wakes, tags, journal, meds, protocols, activity, devices, wearables)
        VALUES (
            v_mum_user_id, v_date + v_day_offset,
            CASE (v_day_offset - 17) % 3 WHEN 0 THEN 8 WHEN 1 THEN 8 ELSE 9 END, -- Excellent mood
            CASE (v_day_offset - 17) % 3 WHEN 0 THEN 8 WHEN 1 THEN 8 ELSE 9 END, -- Excellent sleep
            CASE (v_day_offset - 17) % 3 WHEN 0 THEN 3 WHEN 1 THEN 2 ELSE 3 END, -- Pain 2-3/10
            CASE (v_day_offset - 17) % 3 WHEN 0 THEN 7.5 WHEN 1 THEN 8.0 ELSE 7.5 END, -- Great sleep
            CASE (v_day_offset - 17) % 3 WHEN 0 THEN 1 WHEN 1 THEN 0 ELSE 1 END, -- Minimal wakes
            ARRAY['amazing', 'grateful', 'energetic', 'hopeful'],
            CASE (v_day_offset - 17)
                WHEN 0 THEN 'Pain 3/10! This is incredible. 7 days in a row of relief. I feel like myself again.'
                WHEN 1 THEN 'Pain 2/10! Best day in years. Slept 8 hours straight. No pain when I woke up.'
                WHEN 2 THEN 'Pain 3/10. Still amazing. I can do normal things again. Made dinner for the family.'
                WHEN 3 THEN 'Pain 2/10. Another incredible day. Went for a proper walk in the park.'
                WHEN 4 THEN 'Pain 3/10. Feeling so much better. Starting to plan things again.'
                WHEN 5 THEN 'Pain 2/10. Best week of my life in years. The tracking really worked.'
                ELSE 'Pain 3/10. Unbelievable week. Doctor appointment tomorrow - I have real data to show them!'
            END,
            '["New Medication", "Magnesium", "Vitamin D", "Omega-3"]'::jsonb,
            '["Heat therapy", "Gentle stretching", "Pain tracking", "Sleep hygiene"]'::jsonb,
            '["Walking 30min", "Gardening", "Normal activities"]'::jsonb,
            '["Heating pad"]'::jsonb,
            '["Manual tracking"]'::jsonb
        );
    END LOOP;
    
    -- Days 25-27: YELLOW (back to moderate, 5-6/10)
    -- Some regression, maybe forgot medication Y - shows importance of consistency
    FOR v_day_offset IN 24..26 LOOP
        INSERT INTO daily_entries (user_id, local_date, mood, sleep_quality, pain, sleep_hours, night_wakes, tags, journal, meds, protocols, activity, devices, wearables)
        VALUES (
            v_mum_user_id, v_date + v_day_offset,
            CASE (v_day_offset - 24) % 3 WHEN 0 THEN 5 WHEN 1 THEN 6 ELSE 5 END, -- Back to moderate mood
            CASE (v_day_offset - 24) % 3 WHEN 0 THEN 5 WHEN 1 THEN 6 ELSE 5 END, -- Back to moderate sleep
            CASE (v_day_offset - 24) % 3 WHEN 0 THEN 6 WHEN 1 THEN 5 ELSE 6 END, -- Pain 5-6/10
            CASE (v_day_offset - 24) % 3 WHEN 0 THEN 6.0 WHEN 1 THEN 6.5 ELSE 6.0 END, -- Moderate sleep
            CASE (v_day_offset - 24) % 3 WHEN 0 THEN 2 WHEN 1 THEN 2 ELSE 3 END, -- More wakes
            ARRAY['frustrated', 'determined', 'learning'],
            CASE (v_day_offset - 24)
                WHEN 0 THEN 'Pain 6/10. Not as good today. Forgot to take my morning supplements - maybe that''s why?'
                WHEN 1 THEN 'Pain 5/10. Better today. Made sure to take everything on time. Consistency matters.'
                ELSE 'Pain 6/10. Some regression but still much better than before. Learning what works.'
            END,
            '["New Medication", "Magnesium", "Vitamin D"]'::jsonb,
            '["Heat therapy", "Gentle stretching"]'::jsonb,
            '["Walking 15min"]'::jsonb,
            '["Heating pad"]'::jsonb,
            '["Manual tracking"]'::jsonb
        );
    END LOOP;
    
    -- Days 28-31: GREEN (recovery, 3-4/10)
    -- Back on track with proper tracking, ready for doctor appointment with data
    FOR v_day_offset IN 27..30 LOOP
        INSERT INTO daily_entries (user_id, local_date, mood, sleep_quality, pain, sleep_hours, night_wakes, tags, journal, meds, protocols, activity, devices, wearables)
        VALUES (
            v_mum_user_id, v_date + v_day_offset,
            CASE (v_day_offset - 27) % 3 WHEN 0 THEN 7 WHEN 1 THEN 8 ELSE 7 END, -- Good mood
            CASE (v_day_offset - 27) % 3 WHEN 0 THEN 7 WHEN 1 THEN 8 ELSE 7 END, -- Good sleep
            CASE (v_day_offset - 27) % 3 WHEN 0 THEN 4 WHEN 1 THEN 3 ELSE 4 END, -- Pain 3-4/10
            CASE (v_day_offset - 27) % 3 WHEN 0 THEN 7.0 WHEN 1 THEN 7.5 ELSE 7.0 END, -- Good sleep
            CASE (v_day_offset - 27) % 3 WHEN 0 THEN 1 WHEN 1 THEN 1 ELSE 2 END, -- Few wakes
            ARRAY['hopeful', 'grateful', 'optimistic', 'prepared'],
            CASE (v_day_offset - 27)
                WHEN 0 THEN 'Pain 4/10. Back on track. Made sure to be consistent with everything.'
                WHEN 1 THEN 'Pain 3/10. Good day. Ready for my doctor appointment tomorrow with real data.'
                WHEN 2 THEN 'Pain 4/10. Doctor appointment today. I have charts and data to show them!'
                ELSE 'Pain 3/10. Doctor was amazed at my tracking data. Finally felt heard and understood.'
            END,
            '["New Medication", "Magnesium", "Vitamin D", "Omega-3"]'::jsonb,
            '["Heat therapy", "Gentle stretching", "Pain tracking"]'::jsonb,
            '["Walking 25min", "Normal activities"]'::jsonb,
            '["Heating pad"]'::jsonb,
            '["Manual tracking"]'::jsonb
        );
    END LOOP;
    
    RAISE NOTICE 'Inserted 31 daily entries for August 2025';
    
    -- ============================================
    -- JOURNAL ENTRIES (6 entries matching the story)
    -- ============================================
    
    INSERT INTO journal_entries (profile_id, heading, body, public, created_at) VALUES
    (v_mum_profile_id, 'The Doctor Appointment Struggle', 'Every appointment it''s the same thing. Doctor asks how I''ve been, what''s helping, what''s not. And I just... freeze. Or say "I think it''s okay?" when I know I''ve been in agony.

I''ve tried 15+ different treatments over the years. Some days I''m functional, some days I can''t get out of bed. But I can never track what actually helps because when I''m in pain you can''t think straight.

The doctor just kind of sighs and moves on. I feel like they think I''m making it up or being dramatic. But the pain is real. It''s just so hard to communicate when you''re in the middle of it.', true, '2025-08-01 10:30:00'),

    (v_mum_profile_id, 'Maybe a Bit Better?', 'Went to the doctor today. He asked how the new medication was going and I said "maybe a bit better?" But I knew that just wasn''t true.

I''ve been in agony for days. Pain at 8-9/10 most of the time. But when he asked, I just couldn''t articulate it properly. It''s like my brain shuts down when I''m in pain.

He just kind of sighed and moved on. I felt so frustrated with myself. Why can''t I just tell him the truth? But the truth is, when you''re in that much pain, you can''t think clearly enough to explain it properly.', true, '2025-08-05 14:20:00'),

    (v_mum_profile_id, 'Starting to Track', 'My daughter convinced me to start tracking. Just pain levels, mood, sleep, what I''m taking. Takes like 10 seconds a day.

At first I thought it was pointless. How could writing down numbers help? But after a few days, I started to see patterns. Like my pain was worse on days I forgot to take my morning supplements.

It''s only been a week, but I''m starting to feel more in control. Maybe this will help me communicate better with my doctor next time.', true, '2025-08-10 19:45:00'),

    (v_mum_profile_id, 'The Breakthrough Week', 'I can''t believe it. Seven days in a row of significant pain relief. Pain down to 2-3/10 instead of 8-9/10.

The tracking helped me see what was working. The new medication, combined with consistent supplement timing and heat therapy, is actually helping. I can think clearly again. I can sleep properly. I can be present with my family.

This is the best I''ve felt in years. And I have actual data to show my doctor next time. No more "maybe a bit better?" - I can show them the numbers.', true, '2025-08-24 16:30:00'),

    (v_mum_profile_id, 'The Importance of Consistency', 'Had a few days where my pain went back up to 5-6/10. I was so frustrated. What went wrong?

Looking at my tracking, I realized I''d forgotten to take my morning supplements for a couple of days. It''s amazing how much difference consistency makes.

Back on track now, and the pain is back down to 3-4/10. This tracking thing really works. It''s helping me understand what my body needs and when.', true, '2025-08-27 20:15:00'),

    (v_mum_profile_id, 'Finally Feeling Heard', 'Doctor appointment today. For the first time, I had real data to show them. Charts of my pain levels, what I was taking, when I was taking it.

The doctor was amazed. "This is exactly what we need to see," they said. "This gives us so much more information than just asking how you''ve been."

I finally felt heard and understood. No more guessing. No more "maybe a bit better?" I had concrete evidence of what was working and what wasn''t.

If you''re struggling to remember what''s helping, seriously just start tracking something. Anything. Even just notes in your phone, it can really help!', true, '2025-08-31 18:00:00');
    
    RAISE NOTICE 'Inserted 6 journal entries';
    
    -- ============================================
    -- STACK ITEMS (pain management focused)
    -- ============================================
    
    INSERT INTO stack_items (profile_id, item_type, name, dose, timing, brand, notes, public, created_at) VALUES
    (v_mum_profile_id, 'supplements', 'New Pain Medication', 'As prescribed', 'twice daily', 'Prescribed', 'The medication that finally worked after trying 15+ others. Consistent timing is crucial.', true, '2025-08-01'),
    (v_mum_profile_id, 'supplements', 'Magnesium Glycinate', '400mg', 'bedtime', 'Thorne', 'Helps with muscle relaxation and sleep quality. Makes a noticeable difference.', true, '2025-08-10'),
    (v_mum_profile_id, 'supplements', 'Vitamin D3', '2000 IU', 'morning', 'Pure Encapsulations', 'Was deficient. Helps with overall pain and inflammation.', true, '2025-08-10'),
    (v_mum_profile_id, 'supplements', 'Omega-3 Fish Oil', '1000mg', 'morning', 'Nordic Naturals', 'Anti-inflammatory support. Helps with joint pain.', true, '2025-08-15'),
    (v_mum_profile_id, 'supplements', 'Ibuprofen', '400-800mg', 'as needed', 'Generic', 'Backup pain relief. Use less now that main medication is working.', true, '2025-08-01'),
    (v_mum_profile_id, 'movement', 'Gentle Walking', '20-30min', 'daily', 'Outdoor', 'Low-impact movement. Start slow, build gradually. Helps with stiffness.', true, '2025-08-15'),
    (v_mum_profile_id, 'movement', 'Gentle Stretching', '15min', 'morning', 'Home routine', 'Simple stretches for stiffness. Don''t overdo it on bad days.', true, '2025-08-12'),
    (v_mum_profile_id, 'mindfulness', 'Pain Tracking', '2min', 'evening', 'Manual notes', 'Just writing down pain levels, mood, what I took. Takes seconds but makes all the difference.', true, '2025-08-08'),
    (v_mum_profile_id, 'mindfulness', 'Deep Breathing', '5min', 'as needed', 'Simple technique', 'For pain flares. Helps calm the nervous system during bad moments.', true, '2025-08-10');
    
    RAISE NOTICE 'Inserted 9 stack items';
    
    -- ============================================
    -- PROTOCOLS (pain management focused)
    -- ============================================
    
    INSERT INTO protocols (profile_id, name, description, frequency, public, created_at) VALUES
    (v_mum_profile_id, 'Medication Timing Protocol', 'Take new pain medication at exactly the same times every day. Even 30 minutes off can affect pain levels.', 'twice daily', true, '2025-08-01'),
    (v_mum_profile_id, 'Heat Therapy', 'Heating pad on affected areas for 20-30 minutes. Helps relax muscles and reduce pain during flares.', 'as needed', true, '2025-08-01'),
    (v_mum_profile_id, 'Pain Tracking Protocol', 'Record pain level (1-10), mood, sleep, and medications taken every evening. Takes 2 minutes but provides crucial data.', 'daily', true, '2025-08-08'),
    (v_mum_profile_id, 'Gentle Movement Protocol', 'Light walking and stretching daily, even on bad days. Movement helps prevent stiffness and improves mood.', 'daily', true, '2025-08-12');
    
    RAISE NOTICE 'Inserted 4 protocols';
    
    -- ============================================
    -- GEAR (simple, practical)
    -- ============================================
    
    INSERT INTO gear (profile_id, name, brand, model, category, description, public, created_at) VALUES
    (v_mum_profile_id, 'Heating Pad', 'Sunbeam', 'Large', 'Recovery', 'Large size for full back coverage. Auto-shutoff for safety. Used multiple times daily.', true, '2025-08-01'),
    (v_mum_profile_id, 'Pain Tracking Journal', 'Simple notebook', 'Basic', 'Tracking', 'Just a simple notebook to write down pain levels, mood, and what I took each day.', true, '2025-08-08'),
    (v_mum_profile_id, 'Pain Patches', 'Thermacare', 'Heat patches', 'Recovery', 'Disposable heat patches for when heating pad isn''t available. Good for travel.', true, '2025-08-01'),
    (v_mum_profile_id, 'Pill Organizer', 'Weekly', '7-day', 'Organization', 'Helps remember to take medications consistently. Color-coded for morning and evening.', true, '2025-08-10');
    
    RAISE NOTICE 'Inserted 4 gear items';
    
    -- ============================================
    -- FOLLOWERS (modest number - family and friends)
    -- ============================================
    
    INSERT INTO stack_followers (owner_user_id, follower_email, verified_at, created_at)
    SELECT
        v_mum_user_id,
        'follower' || gs || '@family-friends.com',
        NOW() - (gs || ' days')::INTERVAL,
        NOW() - (gs || ' days')::INTERVAL
    FROM generate_series(1, 12) gs;
    
    RAISE NOTICE 'Inserted 12 followers (family and friends)';
    
    RAISE NOTICE 'Mum''s chronic pain profile setup complete! Check /biostackr/mum-chronic-pain';
    
END $$;
