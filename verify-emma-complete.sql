-- Verification script for Emma's complete data
-- Run this AFTER seed-emma-complete-fixed.sql

DO $$
DECLARE
    v_emma_user_id UUID;
    v_count INTEGER;
    v_sept_count INTEGER;
    v_oct_count INTEGER;
    v_sept_30 INTEGER;
BEGIN
    -- Get Emma's user_id
    SELECT user_id INTO v_emma_user_id 
    FROM profiles 
    WHERE slug = 'emma-chronic-pain-journey';
    
    IF v_emma_user_id IS NULL THEN
        RAISE NOTICE '❌ Emma profile not found!';
        RETURN;
    END IF;
    
    RAISE NOTICE '✅ Found Emma profile: %', v_emma_user_id;
    RAISE NOTICE '';
    
    -- Check total count
    SELECT COUNT(*) INTO v_count
    FROM daily_entries
    WHERE user_id = v_emma_user_id;
    
    RAISE NOTICE '📊 Total daily entries: %', v_count;
    
    -- Check September count
    SELECT COUNT(*) INTO v_sept_count
    FROM daily_entries
    WHERE user_id = v_emma_user_id
    AND local_date >= '2025-09-01'
    AND local_date <= '2025-09-30';
    
    RAISE NOTICE '📊 September entries (should be 30): %', v_sept_count;
    
    -- Check October count
    SELECT COUNT(*) INTO v_oct_count
    FROM daily_entries
    WHERE user_id = v_emma_user_id
    AND local_date >= '2025-10-01'
    AND local_date <= '2025-10-09';
    
    RAISE NOTICE '📊 October entries (should be 9): %', v_oct_count;
    
    -- Check September 30th specifically
    SELECT COUNT(*) INTO v_sept_30
    FROM daily_entries
    WHERE user_id = v_emma_user_id
    AND local_date = '2025-09-30';
    
    RAISE NOTICE '📊 September 30th (should be 1): %', v_sept_30;
    RAISE NOTICE '';
    
    -- Show date range
    RAISE NOTICE '📅 Date Range:';
    RAISE NOTICE '   First entry: %', (
        SELECT local_date FROM daily_entries 
        WHERE user_id = v_emma_user_id 
        ORDER BY local_date ASC LIMIT 1
    );
    RAISE NOTICE '   Last entry: %', (
        SELECT local_date FROM daily_entries 
        WHERE user_id = v_emma_user_id 
        ORDER BY local_date DESC LIMIT 1
    );
    RAISE NOTICE '';
    
    -- Show color progression samples
    RAISE NOTICE '🎨 Color Progression (Red → Yellow → Green):';
    RAISE NOTICE '';
    RAISE NOTICE '   Sept 1 (RED): Mood=%, Pain=%', 
        (SELECT mood FROM daily_entries WHERE user_id = v_emma_user_id AND local_date = '2025-09-01'),
        (SELECT pain FROM daily_entries WHERE user_id = v_emma_user_id AND local_date = '2025-09-01');
    RAISE NOTICE '   Sept 15 (RED): Mood=%, Pain=%', 
        (SELECT mood FROM daily_entries WHERE user_id = v_emma_user_id AND local_date = '2025-09-15'),
        (SELECT pain FROM daily_entries WHERE user_id = v_emma_user_id AND local_date = '2025-09-15');
    RAISE NOTICE '   Sept 25 (YELLOW): Mood=%, Pain=%', 
        (SELECT mood FROM daily_entries WHERE user_id = v_emma_user_id AND local_date = '2025-09-25'),
        (SELECT pain FROM daily_entries WHERE user_id = v_emma_user_id AND local_date = '2025-09-25');
    RAISE NOTICE '   Sept 30 (GREEN): Mood=%, Pain=%', 
        (SELECT mood FROM daily_entries WHERE user_id = v_emma_user_id AND local_date = '2025-09-30'),
        (SELECT pain FROM daily_entries WHERE user_id = v_emma_user_id AND local_date = '2025-09-30');
    RAISE NOTICE '   Oct 5 (GREEN): Mood=%, Pain=%', 
        (SELECT mood FROM daily_entries WHERE user_id = v_emma_user_id AND local_date = '2025-10-05'),
        (SELECT pain FROM daily_entries WHERE user_id = v_emma_user_id AND local_date = '2025-10-05');
    RAISE NOTICE '   Oct 9 (GREEN): Mood=%, Pain=%', 
        (SELECT mood FROM daily_entries WHERE user_id = v_emma_user_id AND local_date = '2025-10-09'),
        (SELECT pain FROM daily_entries WHERE user_id = v_emma_user_id AND local_date = '2025-10-09');
    RAISE NOTICE '';
    
    -- Final verdict
    IF v_count = 39 AND v_sept_count = 30 AND v_oct_count = 9 AND v_sept_30 = 1 THEN
        RAISE NOTICE '✅ ✅ ✅ ALL CHECKS PASSED! Emma''s data is complete!';
    ELSE
        RAISE NOTICE '❌ Some checks failed. Review the counts above.';
    END IF;
    
END $$;

