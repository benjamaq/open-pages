-- Update Emma's LAST visible day (Sept 29) with varied colors and Whoop data
-- Make pain 3/10 (yellow), mood 7/10, and add Whoop with higher scores

DO $$
DECLARE
    v_emma_user_id UUID;
BEGIN
    SELECT user_id INTO v_emma_user_id 
    FROM profiles 
    WHERE slug = 'emma-chronic-pain-journey';
    
    IF v_emma_user_id IS NULL THEN
        RAISE NOTICE 'Emma profile not found';
        RETURN;
    END IF;
    
    -- Update September 29th (the last visible day in the heatmap)
    UPDATE daily_entries SET
        mood = 7,
        sleep_quality = 8,
        pain = 3,
        sleep_hours = 8,
        night_wakes = 1,
        tags = ARRAY['good day', 'varied colors', 'whoop data'],
        journal = 'Great day with varied colors! Pain 3/10, mood 7/10. Whoop showing excellent recovery and sleep scores.',
        meds = '["LDN 4.5mg", "Magnesium 400mg", "Vitamin D3 2000IU", "Omega-3 1000mg", "B12 1000mcg"]'::jsonb,
        protocols = '["LDN protocol", "Heat therapy", "Gentle stretching", "Meditation 10min"]'::jsonb,
        activity = '["Walking 15min", "Yoga 20min", "Swimming 30min"]'::jsonb,
        devices = '["Heating pad", "Oura Ring", "Massage gun", "Whoop"]'::jsonb,
        wearables = '{"score": 8, "device": "Oura Ring", "whoop": {"recovery_score": 85, "sleep_score": 92, "strain_score": 12, "device": "Whoop"}}'::jsonb
    WHERE user_id = v_emma_user_id AND local_date = '2025-09-29';
    
    RAISE NOTICE 'Updated Sept 29: Pain 3/10, Mood 7/10, Sleep 8/10, Whoop 85%%/92%%';
END $$;
