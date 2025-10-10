-- ============================================
-- MUM PROFILE - CORRECT MOOD CHIPS (MATCHING CHIP_CATALOG)
-- ============================================
-- This updates the tags to use actual chip catalog slugs so mood chips display properly

DO $$
DECLARE
    v_mum_user_id UUID;
BEGIN
    -- Get Mum's user ID
    SELECT user_id INTO v_mum_user_id FROM profiles WHERE slug = 'mum-chronic-pain';
    
    IF v_mum_user_id IS NULL THEN
        RAISE NOTICE 'ERROR: Mum profile not found!';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Found Mum: user_id=%', v_mum_user_id;
    
    -- ============================================
    -- UPDATE TAGS TO USE CHIP CATALOG SLUGS
    -- ============================================
    
    -- July 27-31: Baseline tracking (neutral/good chips)
    UPDATE daily_entries 
    SET tags = ARRAY['solid_baseline', 'calm_steady', 'back_online', 'managing_well']
    WHERE user_id = v_mum_user_id 
    AND local_date >= '2025-07-27' 
    AND local_date <= '2025-07-31';
    
    -- Aug 1-8: Severe pain (low energy/bad chips)
    UPDATE daily_entries 
    SET tags = ARRAY['train_wreck', 'absolutely_broken', 'running_on_fumes', 'completely_cooked']
    WHERE user_id = v_mum_user_id 
    AND local_date >= '2025-08-01' 
    AND local_date <= '2025-08-08';
    
    -- Aug 9-10: Moderate pain (neutral chips)
    UPDATE daily_entries 
    SET tags = ARRAY['foggy', 'under_slept', 'low_slow', 'glassy_eyed']
    WHERE user_id = v_mum_user_id 
    AND local_date >= '2025-08-09' 
    AND local_date <= '2025-08-10';
    
    -- Aug 11-17: Good days (neutral to good chips)
    UPDATE daily_entries 
    SET tags = ARRAY['solid_baseline', 'back_online', 'calm_steady', 'managing_well']
    WHERE user_id = v_mum_user_id 
    AND local_date >= '2025-08-11' 
    AND local_date <= '2025-08-17';
    
    -- Aug 18-24: Excellent days (high energy/good chips - 7 green days in a row!)
    UPDATE daily_entries 
    SET tags = ARRAY['on_top_world', 'unstoppable', 'dialed_in', 'main_character']
    WHERE user_id = v_mum_user_id 
    AND local_date >= '2025-08-18' 
    AND local_date <= '2025-08-24';
    
    -- Aug 25-27: Regression (low energy/bad chips)
    UPDATE daily_entries 
    SET tags = ARRAY['running_on_fumes', 'foggy', 'under_slept', 'low_slow']
    WHERE user_id = v_mum_user_id 
    AND local_date >= '2025-08-25' 
    AND local_date <= '2025-08-27';
    
    -- Aug 28-31: Recovery (neutral to good chips)
    UPDATE daily_entries 
    SET tags = ARRAY['back_online', 'solid_baseline', 'calm_steady', 'managing_well']
    WHERE user_id = v_mum_user_id 
    AND local_date >= '2025-08-28' 
    AND local_date <= '2025-08-31';
    
    -- Sept 1-6: Continued tracking (good chips)
    UPDATE daily_entries 
    SET tags = ARRAY['dialed_in', 'calm_steady', 'solid_baseline', 'managing_well']
    WHERE user_id = v_mum_user_id 
    AND local_date >= '2025-09-01' 
    AND local_date <= '2025-09-06';
    
    RAISE NOTICE 'Updated mood chips to use CHIP_CATALOG slugs';
    
END $$;

-- Verification - Show tags for each phase
SELECT 'Verification - Mood chips by phase (using CHIP_CATALOG slugs):' as info;

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
