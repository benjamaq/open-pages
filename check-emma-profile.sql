-- Check if Emma's profile exists and is public
DO $$ 
DECLARE
    v_emma_profile RECORD;
    v_daily_entries_count INTEGER;
BEGIN
    -- Check if Emma's profile exists
    SELECT * INTO v_emma_profile
    FROM profiles 
    WHERE slug = 'emma-chronic-pain-journey';
    
    IF v_emma_profile IS NULL THEN
        RAISE NOTICE 'Emma profile with slug "emma-chronic-pain-journey" NOT FOUND';
        
        -- Show all existing profiles to see what's available
        RAISE NOTICE 'Available profiles:';
        FOR v_emma_profile IN 
            SELECT slug, display_name, public, created_at 
            FROM profiles 
            ORDER BY created_at DESC 
            LIMIT 20
        LOOP
            RAISE NOTICE '  %: % (public: %, created: %)', 
                v_emma_profile.slug, 
                v_emma_profile.display_name, 
                v_emma_profile.public, 
                v_emma_profile.created_at;
        END LOOP;
    ELSE
        RAISE NOTICE 'Emma profile FOUND:';
        RAISE NOTICE '  ID: %', v_emma_profile.id;
        RAISE NOTICE '  User ID: %', v_emma_profile.user_id;
        RAISE NOTICE '  Display Name: %', v_emma_profile.display_name;
        RAISE NOTICE '  Slug: %', v_emma_profile.slug;
        RAISE NOTICE '  Public: %', v_emma_profile.public;
        RAISE NOTICE '  Created: %', v_emma_profile.created_at;
        
        -- Check daily entries for Emma
        SELECT COUNT(*) INTO v_daily_entries_count
        FROM daily_entries 
        WHERE user_id = v_emma_profile.user_id;
        
        RAISE NOTICE 'Daily entries for Emma: %', v_daily_entries_count;
        
        IF v_daily_entries_count > 0 THEN
            RAISE NOTICE 'Date range: % to %', (
                SELECT MIN(local_date) FROM daily_entries WHERE user_id = v_emma_profile.user_id
            ), (
                SELECT MAX(local_date) FROM daily_entries WHERE user_id = v_emma_profile.user_id
            );
        END IF;
    END IF;
    
END $$;
