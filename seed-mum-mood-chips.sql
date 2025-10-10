-- ============================================
-- MUM PROFILE - ADD MOOD CHIPS (TAGS)
-- ============================================
-- This ensures all daily entries have proper mood chips/tags for display

DO $$
DECLARE
    v_mum_user_id UUID;
    v_day_offset INTEGER;
    v_date DATE;
BEGIN
    -- Get Mum's user ID
    SELECT user_id INTO v_mum_user_id FROM profiles WHERE slug = 'mum-chronic-pain';
    
    IF v_mum_user_id IS NULL THEN
        RAISE NOTICE 'ERROR: Mum profile not found!';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Found Mum: user_id=%', v_mum_user_id;
    
    -- ============================================
    -- UPDATE TAGS FOR MOOD CHIPS
    -- ============================================
    
    -- July 27-31: Baseline tracking tags
    UPDATE daily_entries 
    SET tags = ARRAY['baseline', 'tracking', 'moderate', 'stable']
    WHERE user_id = v_mum_user_id 
    AND local_date >= '2025-07-27' 
    AND local_date <= '2025-07-31';
    
    -- Aug 1-8: Severe pain tags (RED days)
    UPDATE daily_entries 
    SET tags = ARRAY['exhausted', 'frustrated', 'desperate', 'hopeless', 'severe-pain']
    WHERE user_id = v_mum_user_id 
    AND local_date >= '2025-08-01' 
    AND local_date <= '2025-08-08';
    
    -- Aug 9-10: Moderate pain tags (YELLOW days)
    UPDATE daily_entries 
    SET tags = ARRAY['hopeful', 'cautious', 'tired', 'improving']
    WHERE user_id = v_mum_user_id 
    AND local_date >= '2025-08-09' 
    AND local_date <= '2025-08-10';
    
    -- Aug 11-17: Good days tags (LIGHT GREEN days)
    UPDATE daily_entries 
    SET tags = ARRAY['hopeful', 'grateful', 'motivated', 'improving', 'good-days']
    WHERE user_id = v_mum_user_id 
    AND local_date >= '2025-08-11' 
    AND local_date <= '2025-08-17';
    
    -- Aug 18-24: Excellent days tags (DARK GREEN days - 7 green days in a row!)
    UPDATE daily_entries 
    SET tags = ARRAY['amazing', 'grateful', 'energetic', 'confident', 'healing', 'breakthrough']
    WHERE user_id = v_mum_user_id 
    AND local_date >= '2025-08-18' 
    AND local_date <= '2025-08-24';
    
    -- Aug 25-27: Regression tags (YELLOW days)
    UPDATE daily_entries 
    SET tags = ARRAY['frustrated', 'worried', 'determined', 'setback']
    WHERE user_id = v_mum_user_id 
    AND local_date >= '2025-08-25' 
    AND local_date <= '2025-08-27';
    
    -- Aug 28-31: Recovery tags (GREEN days)
    UPDATE daily_entries 
    SET tags = ARRAY['relieved', 'hopeful', 'grateful', 'recovering', 'back-on-track']
    WHERE user_id = v_mum_user_id 
    AND local_date >= '2025-08-28' 
    AND local_date <= '2025-08-31';
    
    -- Sept 1-6: Continued tracking tags (GREEN days)
    UPDATE daily_entries 
    SET tags = ARRAY['maintaining', 'grateful', 'confident', 'healing', 'consistent']
    WHERE user_id = v_mum_user_id 
    AND local_date >= '2025-09-01' 
    AND local_date <= '2025-09-06';
    
    RAISE NOTICE 'Updated mood chips/tags for all daily entries';
    
END $$;

-- Verification - Show tags for each phase
SELECT 'Verification - Mood chips by phase:' as info;

SELECT 'July 27-31 (Baseline):' as phase, local_date, tags
FROM daily_entries 
WHERE user_id = (SELECT user_id FROM profiles WHERE slug = 'mum-chronic-pain')
AND local_date >= '2025-07-27' AND local_date <= '2025-07-31'
ORDER BY local_date;

SELECT 'Aug 1-8 (Red - Severe):' as phase, local_date, tags
FROM daily_entries 
WHERE user_id = (SELECT user_id FROM profiles WHERE slug = 'mum-chronic-pain')
AND local_date >= '2025-08-01' AND local_date <= '2025-08-08'
ORDER BY local_date
LIMIT 3;

SELECT 'Aug 18-24 (Dark Green - Excellent):' as phase, local_date, tags
FROM daily_entries 
WHERE user_id = (SELECT user_id FROM profiles WHERE slug = 'mum-chronic-pain')
AND local_date >= '2025-08-18' AND local_date <= '2025-08-24'
ORDER BY local_date
LIMIT 3;
