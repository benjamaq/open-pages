-- Debug script to check Mum's mood data structure
DO $$ 
DECLARE
    v_profile_id UUID;
    v_user_id UUID;
    v_recent_entry RECORD;
BEGIN
    -- Get Mum's profile ID and user_id
    SELECT id, user_id INTO v_profile_id, v_user_id
    FROM profiles 
    WHERE slug = 'mum-chronic-pain';
    
    IF v_profile_id IS NULL THEN
        RAISE NOTICE 'Profile not found for slug: mum-chronic-pain';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Found profile ID: %', v_profile_id;
    RAISE NOTICE 'Found user ID: %', v_user_id;
    
    -- Get the most recent entry
    SELECT * INTO v_recent_entry
    FROM daily_entries 
    WHERE user_id = v_user_id 
    ORDER BY local_date DESC 
    LIMIT 1;
    
    IF v_recent_entry IS NULL THEN
        RAISE NOTICE 'No daily entries found for user';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Most recent entry date: %', v_recent_entry.local_date;
    RAISE NOTICE 'Mood: %', v_recent_entry.mood;
    RAISE NOTICE 'Sleep quality: %', v_recent_entry.sleep_quality;
    RAISE NOTICE 'Pain: %', v_recent_entry.pain;
    RAISE NOTICE 'Tags: %', v_recent_entry.tags;
    
    -- Count total entries
    RAISE NOTICE 'Total entries: %', (
        SELECT COUNT(*) FROM daily_entries WHERE user_id = v_user_id
    );
    
    -- Show date range
    RAISE NOTICE 'Date range: % to %', (
        SELECT MIN(local_date) FROM daily_entries WHERE user_id = v_user_id
    ), (
        SELECT MAX(local_date) FROM daily_entries WHERE user_id = v_user_id
    );
    
END $$;
