-- Check what users exist in the database
DO $$ 
DECLARE
    v_user RECORD;
    v_user_count INTEGER;
BEGIN
    -- Count total users in auth.users
    SELECT COUNT(*) INTO v_user_count FROM auth.users;
    RAISE NOTICE 'Total users in auth.users: %', v_user_count;
    
    IF v_user_count > 0 THEN
        RAISE NOTICE 'Existing users:';
        FOR v_user IN 
            SELECT id, email, created_at 
            FROM auth.users 
            ORDER BY created_at DESC 
            LIMIT 10
        LOOP
            RAISE NOTICE '  User ID: % | Email: % | Created: %', 
                v_user.id, 
                v_user.email, 
                v_user.created_at;
        END LOOP;
    ELSE
        RAISE NOTICE 'No users found in auth.users table';
    END IF;
    
    -- Check if any profiles exist
    SELECT COUNT(*) INTO v_user_count FROM profiles;
    RAISE NOTICE 'Total profiles: %', v_user_count;
    
    IF v_user_count > 0 THEN
        RAISE NOTICE 'Existing profiles:';
        FOR v_user IN 
            SELECT user_id, slug, display_name, public, created_at 
            FROM profiles 
            ORDER BY created_at DESC
        LOOP
            RAISE NOTICE '  Profile: % | User ID: % | Public: % | Created: %', 
                v_user.slug, 
                v_user.user_id,
                v_user.public,
                v_user.created_at;
        END LOOP;
    END IF;
    
END $$;
