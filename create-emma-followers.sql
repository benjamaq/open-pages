-- Create 50 dummy follower accounts and make them follow Emma
-- This creates users directly in auth.users (bypassing normal signup)

DO $$
DECLARE
    v_emma_user_id UUID := 'c1b5662e-73dd-48b1-a5d8-ec0d1a648415';
    v_follower_user_id UUID;
    v_follower_email TEXT;
    v_counter INTEGER;
BEGIN
    RAISE NOTICE 'Creating 50 follower accounts for Emma...';
    
    -- Create 50 dummy users and make them follow Emma
    FOR v_counter IN 1..50 LOOP
        -- Generate a unique user ID
        v_follower_user_id := gen_random_uuid();
        v_follower_email := 'follower' || v_counter || '@biostackr.com';
        
        -- Insert into auth.users
        BEGIN
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
                aud,
                role
            ) VALUES (
                v_follower_user_id,
                '00000000-0000-0000-0000-000000000000',
                v_follower_email,
                crypt('dummy_password_' || v_counter, gen_salt('bf')),
                NOW(),
                NOW() - (v_counter || ' days')::interval,
                NOW() - (v_counter || ' days')::interval,
                '{"provider":"email","providers":["email"]}'::jsonb,
                '{}'::jsonb,
                'authenticated',
                'authenticated'
            );
            
            RAISE NOTICE 'Created user: % (%)', v_follower_email, v_follower_user_id;
        EXCEPTION WHEN unique_violation THEN
            RAISE NOTICE 'User % already exists, skipping...', v_follower_email;
            -- Get the existing user ID
            SELECT id INTO v_follower_user_id FROM auth.users WHERE email = v_follower_email;
        END;
        
        -- Make this user follow Emma
        BEGIN
            INSERT INTO stack_followers (owner_user_id, follower_user_id, created_at)
            VALUES (
                v_emma_user_id,
                v_follower_user_id,
                NOW() - (v_counter || ' days')::interval
            );
            RAISE NOTICE 'User % is now following Emma', v_follower_email;
        EXCEPTION WHEN unique_violation THEN
            RAISE NOTICE 'User % already follows Emma', v_follower_email;
        END;
        
    END LOOP;
    
    RAISE NOTICE '---';
    RAISE NOTICE 'Emma now has 50 followers!';
    RAISE NOTICE 'Emma profile: http://localhost:3009/biostackr/emma-chronic-pain-journey?public=true';
    
END $$;
