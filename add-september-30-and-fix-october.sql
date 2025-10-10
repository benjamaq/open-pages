-- Add September 30th and ensure October 1-9 has green colors

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
    
    -- Add/Update September 30th (dark green - pain 1)
    INSERT INTO daily_entries (
        user_id, local_date, mood, sleep_quality, pain, sleep_hours, night_wakes,
        tags, journal, meds, protocols, activity, devices, wearables
    ) VALUES (
        v_emma_user_id, '2025-09-30', 9, 9, 1, 8, 1,
        ARRAY['perfect', 'healed', 'joyful'],
        'Perfect end to September! Pain 1/10. This protocol changed my life!',
        '["LDN 4.5mg", "Magnesium 400mg", "Vitamin D3 2000IU", "Omega-3 1000mg", "B12 1000mcg"]'::jsonb,
        '["LDN protocol", "Heat therapy", "Gentle stretching", "Meditation 10min"]'::jsonb,
        '["Walking 15min", "Yoga 20min", "Swimming 30min"]'::jsonb,
        '["Heating pad", "Oura Ring", "Massage gun"]'::jsonb,
        '{"score": 9, "device": "Oura Ring"}'::jsonb
    )
    ON CONFLICT (user_id, local_date) DO UPDATE SET
        mood = 9,
        sleep_quality = 9,
        pain = 1,
        sleep_hours = 8,
        night_wakes = 1,
        tags = ARRAY['perfect', 'healed', 'joyful'],
        journal = 'Perfect end to September! Pain 1/10. This protocol changed my life!',
        meds = '["LDN 4.5mg", "Magnesium 400mg", "Vitamin D3 2000IU", "Omega-3 1000mg", "B12 1000mcg"]'::jsonb,
        protocols = '["LDN protocol", "Heat therapy", "Gentle stretching", "Meditation 10min"]'::jsonb,
        activity = '["Walking 15min", "Yoga 20min", "Swimming 30min"]'::jsonb,
        devices = '["Heating pad", "Oura Ring", "Massage gun"]'::jsonb,
        wearables = '{"score": 9, "device": "Oura Ring"}'::jsonb;
    
    RAISE NOTICE 'Added September 30th';
    
    -- Update October 1-9 to have consistent dark green (pain 1-2)
    UPDATE daily_entries SET
        mood = 8,
        pain = 2,
        journal = 'Great start to October! Pain 2/10. Still amazing!'
    WHERE user_id = v_emma_user_id AND local_date = '2025-10-01';
    
    UPDATE daily_entries SET
        mood = 8,
        pain = 2,
        journal = 'Another fantastic day! Pain 2/10. So grateful!'
    WHERE user_id = v_emma_user_id AND local_date = '2025-10-02';
    
    UPDATE daily_entries SET
        mood = 9,
        pain = 1,
        journal = 'Perfect day! Pain 1/10. Life is incredible!'
    WHERE user_id = v_emma_user_id AND local_date = '2025-10-03';
    
    UPDATE daily_entries SET
        mood = 8,
        pain = 2,
        journal = 'Still amazing! Pain 2/10. This is life-changing!'
    WHERE user_id = v_emma_user_id AND local_date = '2025-10-04';
    
    UPDATE daily_entries SET
        mood = 9,
        pain = 1,
        journal = 'Outstanding day! Pain 1/10. Best feeling ever!'
    WHERE user_id = v_emma_user_id AND local_date = '2025-10-05';
    
    UPDATE daily_entries SET
        mood = 9,
        pain = 1,
        journal = 'Incredible day! Pain 1/10. This is perfect!'
    WHERE user_id = v_emma_user_id AND local_date = '2025-10-06';
    
    UPDATE daily_entries SET
        mood = 8,
        pain = 2,
        journal = 'Still fantastic! Pain 2/10. So blessed!'
    WHERE user_id = v_emma_user_id AND local_date = '2025-10-07';
    
    UPDATE daily_entries SET
        mood = 9,
        pain = 1,
        journal = 'Perfect day! Pain 1/10. This is amazing!'
    WHERE user_id = v_emma_user_id AND local_date = '2025-10-08';
    
    UPDATE daily_entries SET
        mood = 9,
        pain = 1,
        journal = 'Best day ever! Pain 1/10. Life is perfect!'
    WHERE user_id = v_emma_user_id AND local_date = '2025-10-09';
    
    RAISE NOTICE 'Updated October 1-9 with dark green progression (pain 1-2)';
    
    -- Verify the changes
    SELECT COUNT(*) INTO v_count FROM daily_entries 
    WHERE user_id = v_emma_user_id 
    AND local_date BETWEEN '2025-09-30' AND '2025-10-09';
    
    RAISE NOTICE 'Verified: % entries for Sept 30 - Oct 9', v_count;
    
    -- Show pain values
    SELECT COUNT(*) INTO v_count FROM daily_entries 
    WHERE user_id = v_emma_user_id 
    AND local_date BETWEEN '2025-10-01' AND '2025-10-09'
    AND pain <= 2;
    
    RAISE NOTICE 'October entries with pain <= 2: %', v_count;
    
END $$;
