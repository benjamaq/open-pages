-- Check all existing profiles in the database
DO $$ 
DECLARE
    v_profile RECORD;
    v_profile_count INTEGER;
BEGIN
    -- Count total profiles
    SELECT COUNT(*) INTO v_profile_count FROM profiles;
    RAISE NOTICE 'Total profiles in database: %', v_profile_count;
    
    IF v_profile_count > 0 THEN
        RAISE NOTICE 'Existing profiles:';
        FOR v_profile IN 
            SELECT slug, display_name, public, created_at 
            FROM profiles 
            ORDER BY created_at DESC
        LOOP
            RAISE NOTICE '  Slug: "%" | Name: "%" | Public: % | Created: %', 
                v_profile.slug, 
                v_profile.display_name, 
                v_profile.public, 
                v_profile.created_at;
        END LOOP;
    ELSE
        RAISE NOTICE 'No profiles found in database';
    END IF;
    
END $$;
