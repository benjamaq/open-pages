-- Simple SQL to add supplement data to Emma's daily entries
-- Run this in Supabase SQL Editor

-- Update early days (Sept 10-30) - basic supplements
UPDATE daily_entries 
SET 
  meds = '["Magnesium 400mg", "Vitamin D3 2000IU", "Omega-3 1000mg"]'::jsonb,
  protocols = '["Heat therapy", "Gentle stretching"]'::jsonb,
  activity = '["Walking 10min", "Yoga 15min"]'::jsonb,
  devices = '["Heating pad", "Oura Ring"]'::jsonb
WHERE user_id = (
  SELECT user_id FROM profiles WHERE slug = 'emma-chronic-pain-journey'
)
AND local_date BETWEEN '2025-09-10' AND '2025-09-30';

-- Update middle period (Oct 1-10) - added LDN
UPDATE daily_entries 
SET 
  meds = '["LDN 4.5mg", "Magnesium 400mg", "Vitamin D3 2000IU", "Omega-3 1000mg", "B12 1000mcg"]'::jsonb,
  protocols = '["LDN protocol", "Heat therapy", "Gentle stretching", "Meditation 10min"]'::jsonb,
  activity = '["Walking 15min", "Yoga 20min", "Swimming 30min"]'::jsonb,
  devices = '["Heating pad", "Oura Ring", "Massage gun"]'::jsonb
WHERE user_id = (
  SELECT user_id FROM profiles WHERE slug = 'emma-chronic-pain-journey'
)
AND local_date BETWEEN '2025-10-01' AND '2025-10-10';

-- Update recent days (Oct 11-19) - full stack
UPDATE daily_entries 
SET 
  meds = '["LDN 4.5mg", "Magnesium 400mg", "Vitamin D3 2000IU", "Omega-3 1000mg", "B12 1000mcg", "Curcumin 500mg", "CoQ10 200mg"]'::jsonb,
  protocols = '["LDN protocol", "Heat therapy", "Gentle stretching", "Meditation 15min", "Breathing exercises"]'::jsonb,
  activity = '["Walking 20min", "Yoga 25min", "Swimming 45min", "Physical therapy"]'::jsonb,
  devices = '["Heating pad", "Oura Ring", "Massage gun", "TENS unit"]'::jsonb
WHERE user_id = (
  SELECT user_id FROM profiles WHERE slug = 'emma-chronic-pain-journey'
)
AND local_date BETWEEN '2025-10-11' AND '2025-10-19';

-- Verify the updates
SELECT 
  local_date,
  jsonb_array_length(meds) as med_count,
  jsonb_array_length(protocols) as protocol_count,
  jsonb_array_length(activity) as activity_count,
  jsonb_array_length(devices) as device_count,
  meds,
  protocols
FROM daily_entries 
WHERE user_id = (
  SELECT user_id FROM profiles WHERE slug = 'emma-chronic-pain-journey'
)
ORDER BY local_date
LIMIT 10;
