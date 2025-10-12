-- Clean up test follower accounts created by create-emma-followers.sql
-- This removes all followerXX@biostackr.com accounts and their associated data

DO $$
DECLARE
    v_deleted_users INTEGER := 0;
    v_deleted_followers INTEGER := 0;
    v_deleted_profiles INTEGER := 0;
    v_user_record RECORD;
BEGIN
    RAISE NOTICE 'Starting cleanup of test follower accounts...';
    
    -- First, delete from stack_followers table where follower_user_id references test accounts
    DELETE FROM stack_followers 
    WHERE follower_user_id IN (
        SELECT id FROM auth.users 
        WHERE email LIKE 'follower%@biostackr.com'
    );
    
    GET DIAGNOSTICS v_deleted_followers = ROW_COUNT;
    RAISE NOTICE 'Deleted % follower relationships', v_deleted_followers;
    
    -- Delete from stack_followers where follower_email matches test accounts
    DELETE FROM stack_followers 
    WHERE follower_email LIKE 'follower%@biostackr.com';
    
    GET DIAGNOSTICS v_deleted_followers = ROW_COUNT;
    RAISE NOTICE 'Deleted % more follower relationships (by email)', v_deleted_followers;
    
    -- Delete profiles associated with test users
    DELETE FROM profiles 
    WHERE user_id IN (
        SELECT id FROM auth.users 
        WHERE email LIKE 'follower%@biostackr.com'
    );
    
    GET DIAGNOSTICS v_deleted_profiles = ROW_COUNT;
    RAISE NOTICE 'Deleted % test profiles', v_deleted_profiles;
    
    -- Delete the test users from auth.users
    DELETE FROM auth.users 
    WHERE email LIKE 'follower%@biostackr.com';
    
    GET DIAGNOSTICS v_deleted_users = ROW_COUNT;
    RAISE NOTICE 'Deleted % test user accounts', v_deleted_users;
    
    RAISE NOTICE '---';
    RAISE NOTICE 'Cleanup complete!';
    RAISE NOTICE 'Removed % test users, % profiles, and % follower relationships', 
        v_deleted_users, v_deleted_profiles, v_deleted_followers;
    
    -- Show remaining user count
    RAISE NOTICE 'Remaining users: %', (SELECT COUNT(*) FROM auth.users);
    
END $$;
