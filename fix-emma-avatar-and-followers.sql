-- Fix Emma's avatar and add followers
-- User ID: c1b5662e-73dd-48b1-a5d8-ec0d1a648415

DO $$
DECLARE
    v_emma_user_id UUID := 'c1b5662e-73dd-48b1-a5d8-ec0d1a648415';
    v_emma_profile_id UUID;
    v_follower_count INTEGER := 0;
    v_follower_record RECORD;
BEGIN
    RAISE NOTICE 'Fixing Emma avatar and followers for user: %', v_emma_user_id;
    
    -- Get the existing profile ID
    SELECT id INTO v_emma_profile_id
    FROM profiles 
    WHERE user_id = v_emma_user_id;
    
    IF v_emma_profile_id IS NULL THEN
        RAISE NOTICE 'ERROR: No existing profile found for user ID: %', v_emma_user_id;
        RETURN;
    END IF;
    
    RAISE NOTICE 'Found existing Emma profile with ID: %', v_emma_profile_id;
    
    -- Update profile with the dog image avatar
    UPDATE profiles SET
        avatar_url = 'https://images.unsplash.com/photo-1507146426996-ef05306b995a?w=400&h=400&fit=crop&crop=face',
        updated_at = NOW()
    WHERE id = v_emma_profile_id;
    
    RAISE NOTICE 'Updated Emma avatar to dog image';
    
    -- Clean existing followers
    DELETE FROM stack_followers WHERE owner_user_id = v_emma_user_id;
    
    -- Add followers using existing users from the database
    -- First, try to add real users as followers
    FOR v_follower_record IN (
        SELECT id FROM auth.users 
        WHERE id != v_emma_user_id 
        LIMIT 50
    ) LOOP
        BEGIN
            INSERT INTO stack_followers (owner_user_id, follower_user_id, created_at)
            VALUES (
                v_emma_user_id, 
                v_follower_record.id, 
                NOW() - (v_follower_count || ' days')::interval
            );
            v_follower_count := v_follower_count + 1;
        EXCEPTION WHEN unique_violation THEN
            -- Skip if already following
            CONTINUE;
        END;
    END LOOP;
    
    RAISE NOTICE 'Added % real followers', v_follower_count;
    
    -- If we don't have enough real users, that's okay - just show what we have
    IF v_follower_count = 0 THEN
        RAISE NOTICE 'No other users found to add as followers - this is expected in a fresh database';
        RAISE NOTICE 'Followers will show as 0 until other user accounts are created';
    END IF;
    
    RAISE NOTICE 'Emma profile avatar and followers fix COMPLETE!';
    RAISE NOTICE 'Profile ID: %', v_emma_profile_id;
    RAISE NOTICE 'User ID: %', v_emma_user_id;
    RAISE NOTICE 'Follower count: %', v_follower_count;
    RAISE NOTICE 'Avatar URL: https://images.unsplash.com/photo-1507146426996-ef05306b995a?w=400&h=400&fit=crop&crop=face';
    RAISE NOTICE 'Link: http://localhost:3009/biostackr/emma-chronic-pain-journey?public=true';
    
END $$;