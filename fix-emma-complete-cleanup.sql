-- Complete cleanup and rebuild of Emma's data
-- This will remove ALL existing data and rebuild it properly

DO $$
DECLARE
    v_emma_user_id UUID;
    v_emma_profile_id UUID;
BEGIN
    -- Get Emma's user_id
    SELECT user_id INTO v_emma_user_id 
    FROM profiles 
    WHERE slug = 'emma-chronic-pain-journey';
    
    IF v_emma_user_id IS NULL THEN
        RAISE NOTICE 'Emma profile not found!';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Emma user_id: %', v_emma_user_id;
    
    -- COMPLETE CLEANUP - Remove ALL existing data
    DELETE FROM daily_entries WHERE user_id = v_emma_user_id;
    DELETE FROM journal_entries WHERE profile_id = (SELECT id FROM profiles WHERE user_id = v_emma_user_id);
    DELETE FROM stack_followers WHERE owner_user_id = v_emma_user_id;
    DELETE FROM stack_items WHERE profile_id = (SELECT id FROM profiles WHERE user_id = v_emma_user_id);
    
    RAISE NOTICE 'Cleaned all existing data';
    
    -- Rebuild with complete September + October data
    -- September 1-24: High pain (red/orange)
    INSERT INTO daily_entries (user_id, local_date, mood, sleep_quality, pain, sleep_hours, night_wakes, tags, journal, meds, protocols, activity, devices, wearables)
    VALUES 
    -- September 1-9: Early struggle period (RED/ORANGE)
    (v_emma_user_id, '2025-09-01', 2, 2, 9, 5, 3, ARRAY['terrible', 'cant sleep', 'crying'], 'Worst day ever. Pain 9/10. Desperate for relief.', '["Basic pain meds"]'::jsonb, '["Rest only"]'::jsonb, '["Bed rest"]'::jsonb, '["Heating pad"]'::jsonb, '{"device": "None", "score": 2}'::jsonb),
    (v_emma_user_id, '2025-09-02', 3, 3, 8, 6, 2, ARRAY['awful', 'exhausted', 'hopeless'], 'Still terrible. Pain 8/10. Can''t function.', '["Basic pain meds"]'::jsonb, '["Rest only"]'::jsonb, '["Bed rest"]'::jsonb, '["Heating pad"]'::jsonb, '{"device": "None", "score": 3}'::jsonb),
    (v_emma_user_id, '2025-09-03', 2, 2, 9, 5, 3, ARRAY['terrible', 'cant sleep', 'crying'], 'Another awful day. Pain 9/10. Need help.', '["Basic pain meds"]'::jsonb, '["Rest only"]'::jsonb, '["Bed rest"]'::jsonb, '["Heating pad"]'::jsonb, '{"device": "None", "score": 2}'::jsonb),
    (v_emma_user_id, '2025-09-04', 4, 4, 7, 6, 2, ARRAY['bad', 'tired', 'frustrated'], 'Slightly better but still bad. Pain 7/10.', '["Basic pain meds"]'::jsonb, '["Rest only"]'::jsonb, '["Bed rest"]'::jsonb, '["Heating pad"]'::jsonb, '{"device": "None", "score": 4}'::jsonb),
    (v_emma_user_id, '2025-09-05', 3, 3, 8, 5, 3, ARRAY['awful', 'exhausted', 'hopeless'], 'Bad day again. Pain 8/10. So tired.', '["Basic pain meds"]'::jsonb, '["Rest only"]'::jsonb, '["Bed rest"]'::jsonb, '["Heating pad"]'::jsonb, '{"device": "None", "score": 3}'::jsonb),
    (v_emma_user_id, '2025-09-06', 2, 2, 9, 5, 3, ARRAY['terrible', 'cant sleep', 'crying'], 'Worst pain in weeks. Pain 9/10. Desperate.', '["Basic pain meds"]'::jsonb, '["Rest only"]'::jsonb, '["Bed rest"]'::jsonb, '["Heating pad"]'::jsonb, '{"device": "None", "score": 2}'::jsonb),
    (v_emma_user_id, '2025-09-07', 3, 3, 8, 6, 2, ARRAY['awful', 'exhausted', 'hopeless'], 'Still terrible. Pain 8/10. Need breakthrough.', '["Basic pain meds"]'::jsonb, '["Rest only"]'::jsonb, '["Bed rest"]'::jsonb, '["Heating pad"]'::jsonb, '{"device": "None", "score": 3}'::jsonb),
    (v_emma_user_id, '2025-09-08', 4, 4, 7, 6, 2, ARRAY['bad', 'tired', 'frustrated'], 'Maybe slightly better? Pain 7/10.', '["Basic pain meds"]'::jsonb, '["Rest only"]'::jsonb, '["Bed rest"]'::jsonb, '["Heating pad"]'::jsonb, '{"device": "None", "score": 4}'::jsonb),
    (v_emma_user_id, '2025-09-09', 3, 3, 8, 5, 3, ARRAY['awful', 'exhausted', 'hopeless'], 'Bad day. Pain 8/10. So exhausted.', '["Basic pain meds"]'::jsonb, '["Rest only"]'::jsonb, '["Bed rest"]'::jsonb, '["Heating pad"]'::jsonb, '{"device": "None", "score": 3}'::jsonb),
    
    -- September 10-24: Continued struggle (RED/ORANGE)
    (v_emma_user_id, '2025-09-10', 2, 2, 9, 5, 3, ARRAY['terrible', 'cant sleep', 'crying'], 'Terrible pain again. 9/10. Need a breakthrough.', '["Basic pain meds", "Magnesium"]'::jsonb, '["Heat therapy"]'::jsonb, '["Walking 10min"]'::jsonb, '["Heating pad"]'::jsonb, '{"device": "None", "score": 2}'::jsonb),
    (v_emma_user_id, '2025-09-11', 4, 4, 7, 6, 2, ARRAY['bad', 'tired', 'frustrated'], 'Still struggling. Pain 7/10. Exhausted.', '["Basic pain meds", "Magnesium"]'::jsonb, '["Heat therapy"]'::jsonb, '["Walking 10min"]'::jsonb, '["Heating pad"]'::jsonb, '{"device": "None", "score": 4}'::jsonb),
    (v_emma_user_id, '2025-09-12', 3, 3, 8, 5, 3, ARRAY['awful', 'exhausted', 'hopeless'], 'Another bad day. Pain 8/10. Feeling hopeless.', '["Basic pain meds", "Magnesium"]'::jsonb, '["Heat therapy"]'::jsonb, '["Walking 10min"]'::jsonb, '["Heating pad"]'::jsonb, '{"device": "None", "score": 3}'::jsonb),
    (v_emma_user_id, '2025-09-13', 2, 2, 9, 5, 3, ARRAY['terrible', 'cant sleep', 'crying'], 'Worst day in weeks. Pain 9/10. Desperate.', '["Basic pain meds", "Magnesium"]'::jsonb, '["Heat therapy"]'::jsonb, '["Walking 10min"]'::jsonb, '["Heating pad"]'::jsonb, '{"device": "None", "score": 2}'::jsonb),
    (v_emma_user_id, '2025-09-14', 4, 4, 7, 6, 2, ARRAY['bad', 'tired', 'frustrated'], 'Still bad but maybe slightly better. Pain 7/10.', '["Basic pain meds", "Magnesium"]'::jsonb, '["Heat therapy"]'::jsonb, '["Walking 10min"]'::jsonb, '["Heating pad"]'::jsonb, '{"device": "None", "score": 4}'::jsonb),
    (v_emma_user_id, '2025-09-15', 3, 3, 8, 5, 3, ARRAY['awful', 'exhausted', 'hopeless'], 'Bad day again. Pain 8/10. Frustrated.', '["Basic pain meds", "Magnesium"]'::jsonb, '["Heat therapy"]'::jsonb, '["Walking 10min"]'::jsonb, '["Heating pad"]'::jsonb, '{"device": "None", "score": 3}'::jsonb),
    (v_emma_user_id, '2025-09-16', 2, 2, 9, 5, 3, ARRAY['terrible', 'cant sleep', 'crying'], 'Another awful day. Pain 9/10. Need help.', '["Basic pain meds", "Magnesium"]'::jsonb, '["Heat therapy"]'::jsonb, '["Walking 10min"]'::jsonb, '["Heating pad"]'::jsonb, '{"device": "None", "score": 2}'::jsonb),
    (v_emma_user_id, '2025-09-17', 4, 4, 7, 6, 2, ARRAY['bad', 'tired', 'frustrated'], 'Slightly better. Pain 7/10. Hope this continues.', '["Basic pain meds", "Magnesium"]'::jsonb, '["Heat therapy"]'::jsonb, '["Walking 10min"]'::jsonb, '["Heating pad"]'::jsonb, '{"device": "None", "score": 4}'::jsonb),
    (v_emma_user_id, '2025-09-18', 3, 3, 8, 5, 3, ARRAY['awful', 'exhausted', 'hopeless'], 'Another tough day. Pain 8/10. Need relief.', '["Basic pain meds", "Magnesium"]'::jsonb, '["Heat therapy"]'::jsonb, '["Walking 10min"]'::jsonb, '["Heating pad"]'::jsonb, '{"device": "None", "score": 3}'::jsonb),
    (v_emma_user_id, '2025-09-19', 4, 4, 7, 6, 2, ARRAY['bad', 'tired', 'frustrated'], 'Maybe seeing some improvement? Pain 7/10.', '["Basic pain meds", "Magnesium"]'::jsonb, '["Heat therapy"]'::jsonb, '["Walking 10min"]'::jsonb, '["Heating pad"]'::jsonb, '{"device": "None", "score": 4}'::jsonb),
    (v_emma_user_id, '2025-09-20', 3, 3, 8, 5, 3, ARRAY['awful', 'exhausted', 'hopeless'], 'Bad day. Pain 8/10. Two steps forward, one back.', '["Basic pain meds", "Magnesium"]'::jsonb, '["Heat therapy"]'::jsonb, '["Walking 10min"]'::jsonb, '["Heating pad"]'::jsonb, '{"device": "None", "score": 3}'::jsonb),
    (v_emma_user_id, '2025-09-21', 4, 4, 7, 6, 2, ARRAY['bad', 'tired', 'frustrated'], 'Slightly better again. Pain 7/10. Cautiously hopeful.', '["Basic pain meds", "Magnesium"]'::jsonb, '["Heat therapy"]'::jsonb, '["Walking 10min"]'::jsonb, '["Heating pad"]'::jsonb, '{"device": "None", "score": 4}'::jsonb),
    (v_emma_user_id, '2025-09-22', 3, 3, 8, 5, 3, ARRAY['awful', 'exhausted', 'hopeless'], 'Tough day. Pain 8/10. But maybe I''m seeing patterns?', '["Basic pain meds", "Magnesium"]'::jsonb, '["Heat therapy"]'::jsonb, '["Walking 10min"]'::jsonb, '["Heating pad"]'::jsonb, '{"device": "None", "score": 3}'::jsonb),
    (v_emma_user_id, '2025-09-23', 4, 4, 7, 6, 2, ARRAY['bad', 'tired', 'frustrated'], 'Still struggling but maybe improving? Pain 7/10.', '["Basic pain meds", "Magnesium"]'::jsonb, '["Heat therapy"]'::jsonb, '["Walking 10min"]'::jsonb, '["Heating pad"]'::jsonb, '{"device": "None", "score": 4}'::jsonb),
    (v_emma_user_id, '2025-09-24', 3, 3, 8, 5, 3, ARRAY['awful', 'exhausted', 'hopeless'], 'Bad day. Pain 8/10. Need something to change.', '["Basic pain meds", "Magnesium"]'::jsonb, '["Heat therapy"]'::jsonb, '["Walking 10min"]'::jsonb, '["Heating pad"]'::jsonb, '{"device": "None", "score": 3}'::jsonb),
    
    -- September 25-30: Beginning of improvement (YELLOW/GREEN)
    (v_emma_user_id, '2025-09-25', 5, 5, 6, 7, 2, ARRAY['better', 'hopeful', 'improving'], 'Something is different today. Pain 6/10. Is this working?', '["LDN 1.5mg", "Magnesium", "Vitamin D3"]'::jsonb, '["LDN protocol", "Heat therapy", "Gentle stretching"]'::jsonb, '["Walking 15min", "Yoga 10min"]'::jsonb, '["Heating pad", "Oura Ring"]'::jsonb, '{"device": "Oura Ring", "score": 5}'::jsonb),
    (v_emma_user_id, '2025-09-26', 6, 6, 5, 6, 2, ARRAY['better', 'hopeful', 'improving'], 'Better day! Pain 5/10. Could this be the breakthrough?', '["LDN 1.5mg", "Magnesium", "Vitamin D3"]'::jsonb, '["LDN protocol", "Heat therapy", "Gentle stretching"]'::jsonb, '["Walking 15min", "Yoga 10min"]'::jsonb, '["Heating pad", "Oura Ring"]'::jsonb, '{"device": "Oura Ring", "score": 6}'::jsonb),
    (v_emma_user_id, '2025-09-27', 6, 6, 5, 6, 1, ARRAY['better', 'hopeful', 'improving'], 'Another good day. Pain 5/10. I feel more like myself.', '["LDN 1.5mg", "Magnesium", "Vitamin D3"]'::jsonb, '["LDN protocol", "Heat therapy", "Gentle stretching"]'::jsonb, '["Walking 15min", "Yoga 10min"]'::jsonb, '["Heating pad", "Oura Ring"]'::jsonb, '{"device": "Oura Ring", "score": 6}'::jsonb),
    (v_emma_user_id, '2025-09-28', 7, 7, 4, 7, 2, ARRAY['great', 'excited', 'breakthrough'], 'Great day! Pain 4/10. This is amazing!', '["LDN 3mg", "Magnesium", "Vitamin D3", "Omega-3"]'::jsonb, '["LDN protocol", "Heat therapy", "Gentle stretching", "Meditation 10min"]'::jsonb, '["Walking 15min", "Yoga 20min"]'::jsonb, '["Heating pad", "Oura Ring", "Massage gun"]'::jsonb, '{"device": "Oura Ring", "score": 7}'::jsonb),
    (v_emma_user_id, '2025-09-29', 7, 7, 4, 7, 2, ARRAY['great', 'excited', 'breakthrough'], 'Excellent day. Pain 4/10. I''m getting my life back!', '["LDN 3mg", "Magnesium", "Vitamin D3", "Omega-3"]'::jsonb, '["LDN protocol", "Heat therapy", "Gentle stretching", "Meditation 10min"]'::jsonb, '["Walking 15min", "Yoga 20min"]'::jsonb, '["Heating pad", "Oura Ring", "Massage gun"]'::jsonb, '{"device": "Oura Ring", "score": 7}'::jsonb),
    (v_emma_user_id, '2025-09-30', 8, 8, 3, 6, 3, ARRAY['amazing', 'grateful', 'transformed'], 'Best day in months! Pain 3/10. This is working!', '["LDN 4.5mg", "Magnesium", "Vitamin D3", "Omega-3", "B12"]'::jsonb, '["LDN protocol", "Heat therapy", "Gentle stretching", "Meditation 10min"]'::jsonb, '["Walking 15min", "Yoga 20min", "Swimming 30min"]'::jsonb, '["Heating pad", "Oura Ring", "Massage gun"]'::jsonb, '{"device": "Oura Ring", "score": 8}'::jsonb),
    
    -- October 1-10: Continued improvement (GREEN)
    (v_emma_user_id, '2025-10-01', 7, 7, 4, 5, 2, ARRAY['great', 'excited', 'breakthrough'], 'Good day. Pain 4/10. The improvement continues!', '["LDN 4.5mg", "Magnesium", "Vitamin D3", "Omega-3", "B12"]'::jsonb, '["LDN protocol", "Heat therapy", "Gentle stretching", "Meditation 10min"]'::jsonb, '["Walking 15min", "Yoga 20min", "Swimming 30min"]'::jsonb, '["Heating pad", "Oura Ring", "Massage gun"]'::jsonb, '{"device": "Oura Ring", "score": 7}'::jsonb),
    (v_emma_user_id, '2025-10-02', 8, 8, 3, 5, 2, ARRAY['amazing', 'grateful', 'transformed'], 'Excellent day! Pain 3/10. Feeling hopeful.', '["LDN 4.5mg", "Magnesium", "Vitamin D3", "Omega-3", "B12"]'::jsonb, '["LDN protocol", "Heat therapy", "Gentle stretching", "Meditation 10min"]'::jsonb, '["Walking 15min", "Yoga 20min", "Swimming 30min"]'::jsonb, '["Heating pad", "Oura Ring", "Massage gun"]'::jsonb, '{"device": "Oura Ring", "score": 8}'::jsonb),
    (v_emma_user_id, '2025-10-03', 8, 8, 3, 6, 3, ARRAY['amazing', 'grateful', 'transformed'], 'Another great day. Pain 3/10. This is life-changing.', '["LDN 4.5mg", "Magnesium", "Vitamin D3", "Omega-3", "B12"]'::jsonb, '["LDN protocol", "Heat therapy", "Gentle stretching", "Meditation 10min"]'::jsonb, '["Walking 15min", "Yoga 20min", "Swimming 30min"]'::jsonb, '["Heating pad", "Oura Ring", "Massage gun"]'::jsonb, '{"device": "Oura Ring", "score": 8}'::jsonb),
    (v_emma_user_id, '2025-10-04', 7, 7, 4, 6, 2, ARRAY['great', 'excited', 'breakthrough'], 'Good day with some discomfort. Pain 4/10.', '["LDN 4.5mg", "Magnesium", "Vitamin D3", "Omega-3", "B12"]'::jsonb, '["LDN protocol", "Heat therapy", "Gentle stretching", "Meditation 10min"]'::jsonb, '["Walking 15min", "Yoga 20min", "Swimming 30min"]'::jsonb, '["Heating pad", "Oura Ring", "Massage gun"]'::jsonb, '{"device": "Oura Ring", "score": 7}'::jsonb),
    (v_emma_user_id, '2025-10-05', 8, 8, 3, 5, 3, ARRAY['amazing', 'grateful', 'transformed'], 'Fantastic day! Pain 3/10. I feel like a new person.', '["LDN 4.5mg", "Magnesium", "Vitamin D3", "Omega-3", "B12"]'::jsonb, '["LDN protocol", "Heat therapy", "Gentle stretching", "Meditation 10min"]'::jsonb, '["Walking 15min", "Yoga 20min", "Swimming 30min"]'::jsonb, '["Heating pad", "Oura Ring", "Massage gun"]'::jsonb, '{"device": "Oura Ring", "score": 8}'::jsonb),
    (v_emma_user_id, '2025-10-06', 9, 9, 2, 5, 2, ARRAY['amazing', 'grateful', 'transformed'], 'Amazing day! Pain 2/10. Best I''ve felt in years!', '["LDN 4.5mg", "Magnesium", "Vitamin D3", "Omega-3", "B12"]'::jsonb, '["LDN protocol", "Heat therapy", "Gentle stretching", "Meditation 10min"]'::jsonb, '["Walking 15min", "Yoga 20min", "Swimming 30min"]'::jsonb, '["Heating pad", "Oura Ring", "Massage gun"]'::jsonb, '{"device": "Oura Ring", "score": 9}'::jsonb),
    (v_emma_user_id, '2025-10-07', 8, 8, 3, 6, 3, ARRAY['amazing', 'grateful', 'transformed'], 'Great day. Pain 3/10. So grateful for this improvement.', '["LDN 4.5mg", "Magnesium", "Vitamin D3", "Omega-3", "B12"]'::jsonb, '["LDN protocol", "Heat therapy", "Gentle stretching", "Meditation 10min"]'::jsonb, '["Walking 15min", "Yoga 20min", "Swimming 30min"]'::jsonb, '["Heating pad", "Oura Ring", "Massage gun"]'::jsonb, '{"device": "Oura Ring", "score": 8}'::jsonb),
    (v_emma_user_id, '2025-10-08', 9, 9, 2, 6, 3, ARRAY['amazing', 'grateful', 'transformed'], 'Outstanding day! Pain 2/10. This is incredible!', '["LDN 4.5mg", "Magnesium", "Vitamin D3", "Omega-3", "B12"]'::jsonb, '["LDN protocol", "Heat therapy", "Gentle stretching", "Meditation 10min"]'::jsonb, '["Walking 15min", "Yoga 20min", "Swimming 30min"]'::jsonb, '["Heating pad", "Oura Ring", "Massage gun"]'::jsonb, '{"device": "Oura Ring", "score": 9}'::jsonb),
    (v_emma_user_id, '2025-10-09', 8, 8, 3, 5, 2, ARRAY['amazing', 'grateful', 'transformed'], 'Good day. Pain 3/10. Life is so much better now.', '["LDN 4.5mg", "Magnesium", "Vitamin D3", "Omega-3", "B12"]'::jsonb, '["LDN protocol", "Heat therapy", "Gentle stretching", "Meditation 10min"]'::jsonb, '["Walking 15min", "Yoga 20min", "Swimming 30min"]'::jsonb, '["Heating pad", "Oura Ring", "Massage gun"]'::jsonb, '{"device": "Oura Ring", "score": 8}'::jsonb);
    
    RAISE NOTICE 'Inserted 39 days of data';
    
    -- Verify the data
    RAISE NOTICE 'Verification: % entries created', (SELECT COUNT(*) FROM daily_entries WHERE user_id = v_emma_user_id);
    RAISE NOTICE 'September entries: %', (SELECT COUNT(*) FROM daily_entries WHERE user_id = v_emma_user_id AND local_date BETWEEN '2025-09-01' AND '2025-09-30');
    RAISE NOTICE 'October entries: %', (SELECT COUNT(*) FROM daily_entries WHERE user_id = v_emma_user_id AND local_date BETWEEN '2025-10-01' AND '2025-10-09');
    RAISE NOTICE 'Non-null pain entries: %', (SELECT COUNT(*) FROM daily_entries WHERE user_id = v_emma_user_id AND pain IS NOT NULL);
    
END $$;
