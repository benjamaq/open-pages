-- Check what's actually in October for Emma

DO $$
DECLARE
    v_emma_user_id UUID;
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
    
    -- Check October data
    RAISE NOTICE 'October 1-9 data:';
    FOR i IN 1..9 LOOP
        DECLARE
            v_date DATE := '2025-10-01'::DATE + (i-1);
            v_mood INTEGER;
            v_pain INTEGER;
            v_journal TEXT;
        BEGIN
            SELECT mood, pain, journal INTO v_mood, v_pain, v_journal
            FROM daily_entries 
            WHERE user_id = v_emma_user_id AND local_date = v_date;
            
            RAISE NOTICE 'Oct %: mood=%, pain=%, journal=%', i, v_mood, v_pain, COALESCE(LEFT(v_journal, 50), 'NULL');
        END;
    END LOOP;
    
END $$;
