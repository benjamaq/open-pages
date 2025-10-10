-- Insert September 1-9 data (these rows don't exist yet, so we need INSERT not UPDATE)
-- Fill early September with red/yellow colors showing high pain

-- First, get Emma's user_id
DO $$
DECLARE
  v_emma_user_id UUID;
BEGIN
  -- Get Emma's user_id
  SELECT user_id INTO v_emma_user_id 
  FROM profiles 
  WHERE slug = 'emma-chronic-pain-journey';

  -- Delete any existing entries for Sept 1-9 (in case they exist)
  DELETE FROM daily_entries 
  WHERE user_id = v_emma_user_id 
  AND local_date BETWEEN '2025-09-01' AND '2025-09-09';

  -- Insert September 1-9 with high pain (red/yellow colors)
  INSERT INTO daily_entries (user_id, local_date, mood, sleep_quality, pain, sleep_hours, night_wakes, tags, journal, meds, protocols, activity, devices)
  VALUES
    -- Sept 1: Very bad day (dark red)
    (v_emma_user_id, '2025-09-01', 2, 2, 9, 4, 4, ARRAY['desperate', 'exhausted', 'hopeless'], 'Day 1 of tracking. Pain is unbearable. 9/10. Can barely function.', '["LDN 4.5mg", "Magnesium 400mg", "Vitamin D3 2000IU"]'::jsonb, '["Heat therapy", "Gentle stretching"]'::jsonb, '["Walking 10min"]'::jsonb, '["Heating pad", "Oura Ring"]'::jsonb),
    
    -- Sept 2: Worst day (darkest red)
    (v_emma_user_id, '2025-09-02', 1, 1, 10, 3, 5, ARRAY['terrible', 'cant sleep', 'crying'], 'Worst day ever. Pain 10/10. I don''t know how much longer I can take this.', '["LDN 4.5mg", "Magnesium 400mg", "Vitamin D3 2000IU"]'::jsonb, '["Heat therapy"]'::jsonb, '[]'::jsonb, '["Heating pad", "Oura Ring"]'::jsonb),
    
    -- Sept 3: Still terrible (dark red)
    (v_emma_user_id, '2025-09-03', 2, 2, 9, 4, 4, ARRAY['awful', 'no relief', 'desperate'], 'Still terrible. Pain 9/10. Need help desperately. Nothing is working.', '["LDN 4.5mg", "Magnesium 400mg", "Vitamin D3 2000IU"]'::jsonb, '["Heat therapy", "Gentle stretching"]'::jsonb, '["Walking 10min"]'::jsonb, '["Heating pad", "Oura Ring"]'::jsonb),
    
    -- Sept 4: Bad day (red/orange)
    (v_emma_user_id, '2025-09-04', 3, 3, 8, 5, 3, ARRAY['struggling', 'exhausted', 'frustrated'], 'Still awful. Pain 8/10. Maybe slightly better than yesterday but still terrible.', '["LDN 4.5mg", "Magnesium 400mg", "Vitamin D3 2000IU", "Omega-3 1000mg"]'::jsonb, '["Heat therapy", "Gentle stretching", "Meditation 10min"]'::jsonb, '["Walking 15min"]'::jsonb, '["Heating pad", "Oura Ring"]'::jsonb),
    
    -- Sept 5: Another terrible day (red)
    (v_emma_user_id, '2025-09-05', 2, 2, 9, 4, 4, ARRAY['terrible', 'cant move', 'hopeless'], 'Bad day again. Pain 9/10. Can barely move. This is my life now.', '["LDN 4.5mg", "Magnesium 400mg", "Vitamin D3 2000IU"]'::jsonb, '["Heat therapy"]'::jsonb, '[]'::jsonb, '["Heating pad", "Oura Ring"]'::jsonb),
    
    -- Sept 6: Horrible pain (red/orange)
    (v_emma_user_id, '2025-09-06', 3, 3, 8, 5, 3, ARRAY['awful', 'no energy', 'desperate'], 'Horrible pain. 8/10. When will this end? Need something to work.', '["LDN 4.5mg", "Magnesium 400mg", "Vitamin D3 2000IU", "Omega-3 1000mg"]'::jsonb, '["Heat therapy", "Gentle stretching"]'::jsonb, '["Walking 10min"]'::jsonb, '["Heating pad", "Oura Ring"]'::jsonb),
    
    -- Sept 7: Still struggling badly (orange/yellow)
    (v_emma_user_id, '2025-09-07', 3, 3, 8, 5, 3, ARRAY['struggling', 'exhausted', 'frustrated'], 'Still struggling badly. Pain 8/10. This is exhausting.', '["LDN 4.5mg", "Magnesium 400mg", "Vitamin D3 2000IU", "Omega-3 1000mg"]'::jsonb, '["Heat therapy", "Gentle stretching", "Meditation 10min"]'::jsonb, '["Walking 15min"]'::jsonb, '["Heating pad", "Oura Ring"]'::jsonb),
    
    -- Sept 8: Slightly better? (yellow)
    (v_emma_user_id, '2025-09-08', 4, 4, 7, 6, 2, ARRAY['slightly better', 'cautious hope', 'still bad'], 'Maybe slightly better today? Pain 7/10. Dare I hope?', '["LDN 4.5mg", "Magnesium 400mg", "Vitamin D3 2000IU", "Omega-3 1000mg", "B12 1000mcg"]'::jsonb, '["Heat therapy", "Gentle stretching", "Meditation 10min"]'::jsonb, '["Walking 15min", "Yoga 20min"]'::jsonb, '["Heating pad", "Oura Ring", "Massage gun"]'::jsonb),
    
    -- Sept 9: Bad again (orange/yellow)
    (v_emma_user_id, '2025-09-09', 3, 3, 8, 5, 3, ARRAY['back to bad', 'disappointed', 'struggling'], 'Bad day again. Pain 8/10. The hope was short-lived.', '["LDN 4.5mg", "Magnesium 400mg", "Vitamin D3 2000IU", "Omega-3 1000mg"]'::jsonb, '["Heat therapy", "Gentle stretching"]'::jsonb, '["Walking 10min"]'::jsonb, '["Heating pad", "Oura Ring"]'::jsonb);

  RAISE NOTICE 'Successfully inserted 9 days of data for September 1-9';
  
END $$;

-- Verify the insert
SELECT 
  local_date,
  mood,
  sleep_quality,
  pain,
  LEFT(journal, 40) as journal_preview
FROM daily_entries 
WHERE user_id = (SELECT user_id FROM profiles WHERE slug = 'emma-chronic-pain-journey')
AND local_date BETWEEN '2025-09-01' AND '2025-09-09'
ORDER BY local_date;

