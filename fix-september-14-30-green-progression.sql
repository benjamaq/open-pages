-- Fix September 14-30 to show proper green progression
-- Starting from Sept 14: yellow → light green → dark green

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
    
    -- September 14: Yellow (pain 5)
    UPDATE daily_entries SET
        mood = 5,
        sleep_quality = 5,
        pain = 5,
        sleep_hours = 6,
        night_wakes = 2,
        journal = 'Starting to see some improvement. Pain 5/10. Hopeful!'
    WHERE user_id = v_emma_user_id AND local_date = '2025-09-14';
    
    -- September 15: Yellow (pain 5)
    UPDATE daily_entries SET
        mood = 5,
        sleep_quality = 5,
        pain = 5,
        sleep_hours = 6,
        night_wakes = 2,
        journal = 'Still improving. Pain 5/10. Feeling better!'
    WHERE user_id = v_emma_user_id AND local_date = '2025-09-15';
    
    -- September 16: Light Yellow (pain 4)
    UPDATE daily_entries SET
        mood = 6,
        sleep_quality = 6,
        pain = 4,
        sleep_hours = 7,
        night_wakes = 1,
        journal = 'Definitely improving. Pain 4/10. This is working!'
    WHERE user_id = v_emma_user_id AND local_date = '2025-09-16';
    
    -- September 17: Light Yellow (pain 4)
    UPDATE daily_entries SET
        mood = 6,
        sleep_quality = 6,
        pain = 4,
        sleep_hours = 7,
        night_wakes = 1,
        journal = 'Getting better each day. Pain 4/10. Amazing!'
    WHERE user_id = v_emma_user_id AND local_date = '2025-09-17';
    
    -- September 18: Light Green (pain 3)
    UPDATE daily_entries SET
        mood = 7,
        sleep_quality = 7,
        pain = 3,
        sleep_hours = 7,
        night_wakes = 1,
        journal = 'Major improvement! Pain 3/10. Life-changing!'
    WHERE user_id = v_emma_user_id AND local_date = '2025-09-18';
    
    -- September 19: Light Green (pain 3)
    UPDATE daily_entries SET
        mood = 7,
        sleep_quality = 7,
        pain = 3,
        sleep_hours = 7,
        night_wakes = 1,
        journal = 'Still great! Pain 3/10. So grateful!'
    WHERE user_id = v_emma_user_id AND local_date = '2025-09-19';
    
    -- September 20: Light Green (pain 3)
    UPDATE daily_entries SET
        mood = 7,
        sleep_quality = 7,
        pain = 3,
        sleep_hours = 8,
        night_wakes = 1,
        journal = 'Fantastic day! Pain 3/10. This is incredible!'
    WHERE user_id = v_emma_user_id AND local_date = '2025-09-20';
    
    -- September 21: Light Green (pain 3)
    UPDATE daily_entries SET
        mood = 7,
        sleep_quality = 7,
        pain = 3,
        sleep_hours = 8,
        night_wakes = 1,
        journal = 'Another great day! Pain 3/10. Feeling amazing!'
    WHERE user_id = v_emma_user_id AND local_date = '2025-09-21';
    
    -- September 22: Dark Green (pain 2)
    UPDATE daily_entries SET
        mood = 8,
        sleep_quality = 8,
        pain = 2,
        sleep_hours = 8,
        night_wakes = 1,
        journal = 'Outstanding day! Pain 2/10. Best in years!'
    WHERE user_id = v_emma_user_id AND local_date = '2025-09-22';
    
    -- September 23: Dark Green (pain 2)
    UPDATE daily_entries SET
        mood = 8,
        sleep_quality = 8,
        pain = 2,
        sleep_hours = 8,
        night_wakes = 1,
        journal = 'Incredible day! Pain 2/10. This is amazing!'
    WHERE user_id = v_emma_user_id AND local_date = '2025-09-23';
    
    -- September 24: Dark Green (pain 2)
    UPDATE daily_entries SET
        mood = 8,
        sleep_quality = 8,
        pain = 2,
        sleep_hours = 8,
        night_wakes = 1,
        journal = 'Perfect day! Pain 2/10. Life-changing!'
    WHERE user_id = v_emma_user_id AND local_date = '2025-09-24';
    
    -- September 25: Dark Green (pain 2)
    UPDATE daily_entries SET
        mood = 8,
        sleep_quality = 8,
        pain = 2,
        sleep_hours = 8,
        night_wakes = 1,
        journal = 'Amazing day! Pain 2/10. So grateful!'
    WHERE user_id = v_emma_user_id AND local_date = '2025-09-25';
    
    -- September 26: Dark Green (pain 2)
    UPDATE daily_entries SET
        mood = 8,
        sleep_quality = 8,
        pain = 2,
        sleep_hours = 8,
        night_wakes = 1,
        journal = 'Fantastic day! Pain 2/10. This is incredible!'
    WHERE user_id = v_emma_user_id AND local_date = '2025-09-26';
    
    -- September 27: Dark Green (pain 1)
    UPDATE daily_entries SET
        mood = 9,
        sleep_quality = 9,
        pain = 1,
        sleep_hours = 8,
        night_wakes = 1,
        journal = 'Best day ever! Pain 1/10. Absolutely perfect!'
    WHERE user_id = v_emma_user_id AND local_date = '2025-09-27';
    
    -- September 28: Dark Green (pain 1)
    UPDATE daily_entries SET
        mood = 9,
        sleep_quality = 9,
        pain = 1,
        sleep_hours = 8,
        night_wakes = 1,
        journal = 'Outstanding day! Pain 1/10. Life is perfect!'
    WHERE user_id = v_emma_user_id AND local_date = '2025-09-28';
    
    -- September 29: Dark Green (pain 1)
    UPDATE daily_entries SET
        mood = 9,
        sleep_quality = 9,
        pain = 1,
        sleep_hours = 8,
        night_wakes = 1,
        journal = 'Incredible day! Pain 1/10. This is amazing!'
    WHERE user_id = v_emma_user_id AND local_date = '2025-09-29';
    
    -- September 30: Dark Green (pain 1)
    UPDATE daily_entries SET
        mood = 9,
        sleep_quality = 9,
        pain = 1,
        sleep_hours = 8,
        night_wakes = 1,
        journal = 'Perfect end to September! Pain 1/10. Best month ever!'
    WHERE user_id = v_emma_user_id AND local_date = '2025-09-30';
    
    RAISE NOTICE 'Updated September 14-30 with green progression: yellow → light green → dark green';
    
    -- Verify the changes
    SELECT COUNT(*) INTO v_count FROM daily_entries 
    WHERE user_id = v_emma_user_id 
    AND local_date BETWEEN '2025-09-14' AND '2025-09-30';
    
    RAISE NOTICE 'Verified: % entries updated for September 14-30', v_count;
    
END $$;
