-- Comprehensive debug script to check what's in the database
DO $$ 
DECLARE
    v_profile_count INTEGER;
    v_user_count INTEGER;
    v_daily_entries_count INTEGER;
    v_mum_profile RECORD;
BEGIN
    -- Check if Mum's profile exists
    SELECT COUNT(*) INTO v_profile_count
    FROM profiles 
    WHERE slug = 'mum-chronic-pain';
    
    RAISE NOTICE 'Profiles with slug "mum-chronic-pain": %', v_profile_count;
    
    -- If profile exists, get details
    IF v_profile_count > 0 THEN
        SELECT * INTO v_mum_profile
        FROM profiles 
        WHERE slug = 'mum-chronic-pain';
        
        RAISE NOTICE 'Profile found:';
        RAISE NOTICE '  ID: %', v_mum_profile.id;
        RAISE NOTICE '  User ID: %', v_mum_profile.user_id;
        RAISE NOTICE '  Display Name: %', v_mum_profile.display_name;
        RAISE NOTICE '  Public: %', v_mum_profile.public;
        RAISE NOTICE '  Created: %', v_mum_profile.created_at;
        
        -- Check daily entries for this user
        SELECT COUNT(*) INTO v_daily_entries_count
        FROM daily_entries 
        WHERE user_id = v_mum_profile.user_id;
        
        RAISE NOTICE 'Daily entries for this user: %', v_daily_entries_count;
        
        -- If there are entries, show some details
        IF v_daily_entries_count > 0 THEN
            RAISE NOTICE 'Date range: % to %', (
                SELECT MIN(local_date) FROM daily_entries WHERE user_id = v_mum_profile.user_id
            ), (
                SELECT MAX(local_date) FROM daily_entries WHERE user_id = v_mum_profile.user_id
            );
            
            -- Show a few sample entries
            RAISE NOTICE 'Sample entries:';
            FOR v_mum_profile IN 
                SELECT local_date, mood, sleep_quality, pain, tags 
                FROM daily_entries 
                WHERE user_id = v_mum_profile.user_id 
                ORDER BY local_date DESC 
                LIMIT 3
            LOOP
                RAISE NOTICE '  %: mood=%, sleep=%, pain=%, tags=%', 
                    v_mum_profile.local_date, 
                    v_mum_profile.mood, 
                    v_mum_profile.sleep_quality, 
                    v_mum_profile.pain, 
                    v_mum_profile.tags;
            END LOOP;
        END IF;
    ELSE
        RAISE NOTICE 'Profile with slug "mum-chronic-pain" not found';
        
        -- Show all existing profiles
        RAISE NOTICE 'Existing profiles:';
        FOR v_mum_profile IN 
            SELECT slug, display_name, public, created_at 
            FROM profiles 
            ORDER BY created_at DESC 
            LIMIT 10
        LOOP
            RAISE NOTICE '  %: % (public: %, created: %)', 
                v_mum_profile.slug, 
                v_mum_profile.display_name, 
                v_mum_profile.public, 
                v_mum_profile.created_at;
        END LOOP;
    END IF;
    
    -- Check total daily entries
    SELECT COUNT(*) INTO v_daily_entries_count
    FROM daily_entries;
    
    RAISE NOTICE 'Total daily entries in database: %', v_daily_entries_count;
    
END $$;
