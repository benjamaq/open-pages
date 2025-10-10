-- Fix September 24-29 to show light green to dark green progression
-- This will show the improvement phase with green colors

DO $$
DECLARE
    v_emma_user_id UUID;
    v_count INTEGER;
BEGIN
    -- Get Emma's user_id
    SELECT user_id INTO v_emma_user_id 
    FROM profiles 
    WHERE slug = 'emma-chronic-pain-journey';
    
    IF v_emma_user_id IS NULL THEN
        RAISE NOTICE 'Emma profile not found';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Found Emma user_id: %', v_emma_user_id;
    
    -- Update September 24-29 with green progression (light to dark green)
    UPDATE daily_entries SET
        mood = 7,
        sleep_quality = 7,
        pain = 3,
        sleep_hours = 7,
        night_wakes = 1,
        journal = 'Starting to see real improvement! Pain 3/10. This is working!'
    WHERE user_id = v_emma_user_id AND local_date = '2025-09-24';
    
    UPDATE daily_entries SET
        mood = 8,
        sleep_quality = 8,
        pain = 2,
        sleep_hours = 8,
        night_wakes = 1,
        journal = 'Even better today! Pain 2/10. Feeling hopeful!'
    WHERE user_id = v_emma_user_id AND local_date = '2025-09-25';
    
    UPDATE daily_entries SET
        mood = 8,
        sleep_quality = 8,
        pain = 2,
        sleep_hours = 8,
        night_wakes = 1,
        journal = 'Amazing day! Pain 2/10. This is incredible!'
    WHERE user_id = v_emma_user_id AND local_date = '2025-09-26';
    
    UPDATE daily_entries SET
        mood = 9,
        sleep_quality = 9,
        pain = 1,
        sleep_hours = 8,
        night_wakes = 1,
        journal = 'Best day in years! Pain 1/10. Life-changing!'
    WHERE user_id = v_emma_user_id AND local_date = '2025-09-27';
    
    UPDATE daily_entries SET
        mood = 8,
        sleep_quality = 8,
        pain = 2,
        sleep_hours = 7,
        night_wakes = 1,
        journal = 'Still great! Pain 2/10. So grateful!'
    WHERE user_id = v_emma_user_id AND local_date = '2025-09-28';
    
    UPDATE daily_entries SET
        mood = 9,
        sleep_quality = 9,
        pain = 1,
        sleep_hours = 8,
        night_wakes = 1,
        journal = 'Outstanding day! Pain 1/10. This is amazing!'
    WHERE user_id = v_emma_user_id AND local_date = '2025-09-29';
    
    RAISE NOTICE 'Updated September 24-29 with green progression (pain 1-3)';
    
    -- Verify the changes
    SELECT COUNT(*) INTO v_count FROM daily_entries 
    WHERE user_id = v_emma_user_id 
    AND local_date BETWEEN '2025-09-24' AND '2025-09-29';
    
    RAISE NOTICE 'Verified: % entries updated for September 24-29', v_count;
    
END $$;
