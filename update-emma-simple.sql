UPDATE daily_entries 
SET 
  meds = '["Magnesium 400mg", "Vitamin D3 2000IU", "Omega-3 1000mg"]'::jsonb,
  protocols = '["Heat therapy", "Gentle stretching"]'::jsonb,
  activity = '["Walking 10min", "Yoga 15min"]'::jsonb,
  devices = '["Heating pad", "Oura Ring"]'::jsonb
WHERE user_id = (SELECT user_id FROM profiles WHERE slug = 'emma-chronic-pain-journey')
AND local_date BETWEEN '2025-09-10' AND '2025-09-30';

UPDATE daily_entries 
SET 
  meds = '["LDN 4.5mg", "Magnesium 400mg", "Vitamin D3 2000IU", "Omega-3 1000mg", "B12 1000mcg"]'::jsonb,
  protocols = '["LDN protocol", "Heat therapy", "Gentle stretching", "Meditation 10min"]'::jsonb,
  activity = '["Walking 15min", "Yoga 20min", "Swimming 30min"]'::jsonb,
  devices = '["Heating pad", "Oura Ring", "Massage gun"]'::jsonb
WHERE user_id = (SELECT user_id FROM profiles WHERE slug = 'emma-chronic-pain-journey')
AND local_date BETWEEN '2025-10-01' AND '2025-10-10';

