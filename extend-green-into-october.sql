-- Extend green progression into October 1-9
-- Continue the dark green colors from September

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
    
    -- October 1: Dark Green (pain 2)
    UPDATE daily_entries SET
        mood = 8,
        sleep_quality = 8,
        pain = 2,
        sleep_hours = 8,
        night_wakes = 1,
        journal = 'Great start to October! Pain 2/10. Still amazing!'
    WHERE user_id = v_emma_user_id AND local_date = '2025-10-01';
    
    -- October 2: Dark Green (pain 2)
    UPDATE daily_entries SET
        mood = 8,
        sleep_quality = 8,
        pain = 2,
        sleep_hours = 8,
        night_wakes = 1,
        journal = 'Another fantastic day! Pain 2/10. So grateful!'
    WHERE user_id = v_emma_user_id AND local_date = '2025-10-02';
    
    -- October 3: Dark Green (pain 1)
    UPDATE daily_entries SET
        mood = 9,
        sleep_quality = 9,
        pain = 1,
        sleep_hours = 8,
        night_wakes = 1,
        journal = 'Perfect day! Pain 1/10. Life is incredible!'
    WHERE user_id = v_emma_user_id AND local_date = '2025-10-03';
    
    -- October 4: Dark Green (pain 2)
    UPDATE daily_entries SET
        mood = 8,
        sleep_quality = 8,
        pain = 2,
        sleep_hours = 8,
        night_wakes = 1,
        journal = 'Still amazing! Pain 2/10. This is life-changing!'
    WHERE user_id = v_emma_user_id AND local_date = '2025-10-04';
    
    -- October 5: Dark Green (pain 1)
    UPDATE daily_entries SET
        mood = 9,
        sleep_quality = 9,
        pain = 1,
        sleep_hours = 8,
        night_wakes = 1,
        journal = 'Outstanding day! Pain 1/10. Best feeling ever!'
    WHERE user_id = v_emma_user_id AND local_date = '2025-10-05';
    
    -- October 6: Dark Green (pain 1)
    UPDATE daily_entries SET
        mood = 9,
        sleep_quality = 9,
        pain = 1,
        sleep_hours = 8,
        night_wakes = 1,
        journal = 'Incredible day! Pain 1/10. This is perfect!'
    WHERE user_id = v_emma_user_id AND local_date = '2025-10-06';
    
    -- October 7: Dark Green (pain 2)
    UPDATE daily_entries SET
        mood = 8,
        sleep_quality = 8,
        pain = 2,
        sleep_hours = 8,
        night_wakes = 1,
        journal = 'Still fantastic! Pain 2/10. So blessed!'
    WHERE user_id = v_emma_user_id AND local_date = '2025-10-07';
    
    -- October 8: Dark Green (pain 1)
    UPDATE daily_entries SET
        mood = 9,
        sleep_quality = 9,
        pain = 1,
        sleep_hours = 8,
        night_wakes = 1,
        journal = 'Perfect day! Pain 1/10. This is amazing!'
    WHERE user_id = v_emma_user_id AND local_date = '2025-10-08';
    
    -- October 9: Dark Green (pain 1)
    UPDATE daily_entries SET
        mood = 9,
        sleep_quality = 9,
        pain = 1,
        sleep_hours = 8,
        night_wakes = 1,
        journal = 'Best day ever! Pain 1/10. Life is perfect!'
    WHERE user_id = v_emma_user_id AND local_date = '2025-10-09';
    
    RAISE NOTICE 'Updated October 1-9 with continued green progression (pain 1-2)';
    
    -- Verify the changes
    SELECT COUNT(*) INTO v_count FROM daily_entries 
    WHERE user_id = v_emma_user_id 
    AND local_date BETWEEN '2025-10-01' AND '2025-10-09';
    
    RAISE NOTICE 'Verified: % entries updated for October 1-9', v_count;
    
END $$;
