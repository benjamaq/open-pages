-- Create Emma's demo profile without requiring auth.users
-- This script creates a demo profile that bypasses the auth system

DO $$
DECLARE
    v_emma_user_id UUID;
    v_emma_profile_id UUID;
    v_day_offset INTEGER;
    v_date DATE;
BEGIN
    -- Create a demo user ID (we'll use this for demo purposes)
    v_emma_user_id := '00000000-0000-0000-0000-000000000001'::UUID;
    
    RAISE NOTICE 'Creating Emma demo profile with user_id: %', v_emma_user_id;
    
    -- Create Emma's profile (we'll temporarily disable the foreign key constraint)
    -- First, let's try to insert directly into profiles
    BEGIN
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
        
        RAISE NOTICE 'Successfully created Emma profile with ID: %', v_emma_profile_id;
    EXCEPTION WHEN foreign_key_violation THEN
        RAISE NOTICE 'Foreign key constraint violation. Trying alternative approach...';
        
        -- Try to create a profile with a different approach
        -- We'll create a minimal profile first
        INSERT INTO profiles (user_id, slug, display_name, bio, avatar_url, public, created_at, updated_at)
        VALUES (
            v_emma_user_id,
            'emma-chronic-pain-journey',
            'Emma',
            'Chronic pain warrior sharing my journey with Low Dose Naltrexone (LDN) therapy.',
            'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face',
            true,
            NOW(),
            NOW()
        ) RETURNING id INTO v_emma_profile_id;
        
        RAISE NOTICE 'Created Emma profile with alternative approach, ID: %', v_emma_profile_id;
    END;
    
    -- Clean any existing data
    DELETE FROM daily_entries WHERE user_id = v_emma_user_id;
    DELETE FROM journal_entries WHERE profile_id = v_emma_profile_id;
    DELETE FROM stack_followers WHERE owner_user_id = v_emma_user_id;
    DELETE FROM stack_items WHERE profile_id = v_emma_profile_id;
    DELETE FROM protocols WHERE profile_id = v_emma_profile_id;
    DELETE FROM gear WHERE profile_id = v_emma_profile_id;
    DELETE FROM library_items WHERE profile_id = v_emma_profile_id;
    
    RAISE NOTICE 'Cleaned existing data';
    
    -- Add some basic daily entries
    INSERT INTO daily_entries (user_id, local_date, mood, sleep_quality, pain, sleep_hours, night_wakes, tags, journal, meds, protocols, activity, devices, wearables)
    VALUES (
        v_emma_user_id, '2025-10-10',
        9, 9, 1, 8.5, 0,
        ARRAY['on_top_world', 'unstoppable', 'dialed_in', 'main_character'],
        'Pain at 1/10! Living my best life. LDN maintenance dose.',
        '["Low Dose Naltrexone (LDN) 4.5mg"]'::jsonb,
        '["Physical therapy", "Acupuncture", "LDN therapy"]'::jsonb,
        '["Gentle stretching", "Short walks", "Light yoga", "Swimming", "Hiking"]'::jsonb,
        '["Heating pad", "Ice pack", "Oura Ring"]'::jsonb,
        '{"recovery_score": 90, "sleep_score": 90}'::jsonb
    );
    
    -- Add a journal entry
    INSERT INTO journal_entries (profile_id, heading, body, public, created_at) VALUES
    (v_emma_profile_id, 'The New Normal', 'Two months into this journey and I''m still amazed at how much my life has changed. Pain is consistently 1-2/10, I''m back to all my favorite activities, and I''m sleeping like a baby.

LDN maintenance dose of 4.5mg seems to be my sweet spot. I''m also maintaining all the other healthy habits I''ve built - regular movement, good sleep hygiene, stress management.

The tracking has been crucial. Being able to see the patterns and correlations has helped me understand what works and what doesn''t. Data doesn''t lie, and it''s been incredibly empowering to have concrete evidence of my progress.

To anyone following this journey - thank you for your support. Chronic pain can be incredibly isolating, but knowing others are rooting for you makes all the difference.', true, '2025-10-10 14:00:00');
    
    -- Add some supplements
    INSERT INTO stack_items (profile_id, item_type, name, dose, timing, brand, notes, public, created_at) VALUES
    (v_emma_profile_id, 'supplements', 'Low Dose Naltrexone (LDN)', '4.5mg', 'bedtime', 'Compounded', 'Prescribed for chronic pain. Game changer!', true, '2025-09-08'),
    (v_emma_profile_id, 'supplements', 'Magnesium Glycinate', '400mg', 'bedtime', 'Thorne', 'Helps with muscle relaxation and sleep quality.', true, '2025-09-15'),
    (v_emma_profile_id, 'supplements', 'Vitamin D3', '2000 IU', 'morning', 'Nordic Naturals', 'Was severely deficient. Working to get to optimal range.', true, '2025-09-15');
    
    RAISE NOTICE 'Emma demo profile creation COMPLETE!';
    RAISE NOTICE 'Profile ID: %', v_emma_profile_id;
    RAISE NOTICE 'User ID: %', v_emma_user_id;
    RAISE NOTICE 'Slug: emma-chronic-pain-journey';
    RAISE NOTICE 'Public: true';
    RAISE NOTICE 'Try accessing: http://localhost:3009/biostackr/emma-chronic-pain-journey?public=true';
    
END $$;
