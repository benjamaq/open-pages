-- Verification script for Emma's complete profile
-- Run this AFTER seed-emma-complete-profile.sql

DO $$
DECLARE
    v_emma_user_id UUID;
    v_emma_profile_id UUID;
    v_daily_count INTEGER;
    v_journal_count INTEGER;
    v_supplements_count INTEGER;
    v_protocols_count INTEGER;
    v_movement_count INTEGER;
    v_mindfulness_count INTEGER;
    v_gear_count INTEGER;
    v_followers_count INTEGER;
    v_has_tags BOOLEAN;
BEGIN
    -- Get Emma's IDs
    SELECT user_id, id INTO v_emma_user_id, v_emma_profile_id
    FROM profiles 
    WHERE slug = 'emma-chronic-pain-journey';
    
    IF v_emma_user_id IS NULL THEN
        RAISE NOTICE '❌ Emma profile not found!';
        RETURN;
    END IF;
    
    RAISE NOTICE '✅ Found Emma profile';
    RAISE NOTICE '';
    
    -- Check daily entries
    SELECT COUNT(*) INTO v_daily_count
    FROM daily_entries
    WHERE user_id = v_emma_user_id;
    
    RAISE NOTICE '📊 Daily Entries: % (should be 39)', v_daily_count;
    
    -- Check if entries have tags (mood chips)
    SELECT EXISTS(
        SELECT 1 FROM daily_entries 
        WHERE user_id = v_emma_user_id 
        AND tags IS NOT NULL 
        AND array_length(tags, 1) > 0
    ) INTO v_has_tags;
    
    IF v_has_tags THEN
        RAISE NOTICE '   ✅ Mood chips (tags) present';
    ELSE
        RAISE NOTICE '   ❌ Missing mood chips (tags)';
    END IF;
    
    -- Check journal entries
    SELECT COUNT(*) INTO v_journal_count
    FROM journal_entries
    WHERE profile_id = v_emma_profile_id;
    
    RAISE NOTICE '📝 Journal Entries: % (should be 6)', v_journal_count;
    
    -- Check stack items by type
    SELECT COUNT(*) INTO v_supplements_count
    FROM stack_items
    WHERE profile_id = v_emma_profile_id AND item_type = 'supplements';
    
    SELECT COUNT(*) INTO v_protocols_count
    FROM stack_items
    WHERE profile_id = v_emma_profile_id AND item_type = 'protocols';
    
    SELECT COUNT(*) INTO v_movement_count
    FROM stack_items
    WHERE profile_id = v_emma_profile_id AND item_type = 'movement';
    
    SELECT COUNT(*) INTO v_mindfulness_count
    FROM stack_items
    WHERE profile_id = v_emma_profile_id AND item_type = 'mindfulness';
    
    SELECT COUNT(*) INTO v_gear_count
    FROM stack_items
    WHERE profile_id = v_emma_profile_id AND item_type = 'gear';
    
    RAISE NOTICE '💊 Stack Items:';
    RAISE NOTICE '   Supplements: % (should be 6)', v_supplements_count;
    RAISE NOTICE '   Protocols: % (should be 5)', v_protocols_count;
    RAISE NOTICE '   Movement: % (should be 4)', v_movement_count;
    RAISE NOTICE '   Mindfulness: % (should be 4)', v_mindfulness_count;
    RAISE NOTICE '   Gear: % (should be 5)', v_gear_count;
    
    -- Check followers
    SELECT COUNT(*) INTO v_followers_count
    FROM stack_followers
    WHERE owner_user_id = v_emma_user_id AND verified_at IS NOT NULL;
    
    RAISE NOTICE '👥 Followers: % (should be 52)', v_followers_count;
    
    -- Show sample journal titles
    RAISE NOTICE '';
    RAISE NOTICE '📖 Journal Entry Titles:';
    FOR rec IN (
        SELECT title, entry_date 
        FROM journal_entries 
        WHERE profile_id = v_emma_profile_id 
        ORDER BY entry_date
    ) LOOP
        RAISE NOTICE '   - % (%)', rec.title, rec.entry_date;
    END LOOP;
    
    -- Show sample mood chips from recent entry
    RAISE NOTICE '';
    RAISE NOTICE '🏷️  Sample Mood Chips (Oct 9):';
    FOR rec IN (
        SELECT unnest(tags) as tag 
        FROM daily_entries 
        WHERE user_id = v_emma_user_id 
        AND local_date = '2025-10-09'
    ) LOOP
        RAISE NOTICE '   - %', rec.tag;
    END LOOP;
    
    -- Show profile bio
    RAISE NOTICE '';
    RAISE NOTICE '👤 Profile Bio:';
    FOR rec IN (
        SELECT bio FROM profiles WHERE id = v_emma_profile_id
    ) LOOP
        RAISE NOTICE '%', rec.bio;
    END LOOP;
    
    RAISE NOTICE '';
    
    -- Final verdict
    IF v_daily_count = 39 AND 
       v_journal_count = 6 AND 
       v_supplements_count = 6 AND 
       v_protocols_count = 5 AND 
       v_movement_count = 4 AND 
       v_mindfulness_count = 4 AND 
       v_gear_count = 5 AND 
       v_followers_count = 52 AND 
       v_has_tags THEN
        RAISE NOTICE '========================================';
        RAISE NOTICE '✅ ✅ ✅ ALL CHECKS PASSED!';
        RAISE NOTICE 'Emma''s profile is complete and ready!';
        RAISE NOTICE '========================================';
    ELSE
        RAISE NOTICE '========================================';
        RAISE NOTICE '❌ Some items missing. Check counts above.';
        RAISE NOTICE '========================================';
    END IF;
    
END $$;

