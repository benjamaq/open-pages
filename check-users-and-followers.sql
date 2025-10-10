-- Check users and followers in the database

DO $$
DECLARE
    v_user_count INTEGER;
    v_emma_user_id UUID := 'c1b5662e-73dd-48b1-a5d8-ec0d1a648415';
    v_follower_count INTEGER;
BEGIN
    -- Count total users
    SELECT COUNT(*) INTO v_user_count FROM auth.users;
    RAISE NOTICE 'Total users in database: %', v_user_count;
    
    -- List all users
    RAISE NOTICE '--- All Users ---';
    FOR v_user_record IN (SELECT id, email FROM auth.users) LOOP
        RAISE NOTICE 'User ID: %, Email: %', v_user_record.id, v_user_record.email;
    END LOOP;
    
    -- Count Emma's followers
    SELECT COUNT(*) INTO v_follower_count 
    FROM stack_followers 
    WHERE owner_user_id = v_emma_user_id;
    
    RAISE NOTICE '--- Emma''s Followers ---';
    RAISE NOTICE 'Emma follower count: %', v_follower_count;
    
    -- List Emma's followers
    IF v_follower_count > 0 THEN
        FOR v_follower_record IN (
            SELECT sf.follower_user_id, u.email 
            FROM stack_followers sf
            JOIN auth.users u ON u.id = sf.follower_user_id
            WHERE sf.owner_user_id = v_emma_user_id
        ) LOOP
            RAISE NOTICE 'Follower: % (%)', v_follower_record.email, v_follower_record.follower_user_id;
        END LOOP;
    ELSE
        RAISE NOTICE 'No followers found for Emma';
    END IF;
    
    RAISE NOTICE '---';
    RAISE NOTICE 'To add followers, you need to:';
    RAISE NOTICE '1. Create additional user accounts through the app signup';
    RAISE NOTICE '2. Or create demo accounts with Supabase Auth';
    RAISE NOTICE '3. Then run a script to make them follow Emma';
    
END $$;
