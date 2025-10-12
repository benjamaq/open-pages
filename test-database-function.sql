-- Test script to check if the database function is working correctly
-- and what data is actually stored

-- First, let's see what's currently in the daily_entries table for today
SELECT 
  user_id, 
  local_date, 
  tags,
  mood,
  sleep_quality,
  pain,
  journal,
  created_at,
  updated_at
FROM daily_entries 
WHERE local_date = '2025-10-12' 
ORDER BY created_at DESC;

-- Let's also check if there are any entries with expressive mood chips
SELECT 
  user_id, 
  local_date, 
  tags,
  array_length(tags, 1) as tag_count
FROM daily_entries 
WHERE tags IS NOT NULL 
  AND array_length(tags, 1) > 0
ORDER BY created_at DESC 
LIMIT 5;

-- Let's test the function directly with some expressive mood chips
SELECT upsert_daily_entry_and_snapshot(
  'c1b5662e-73dd-48b1-a5d8-ec0d1a648415'::uuid,
  '2025-10-12'::date,
  7, -- mood
  8, -- sleep_quality  
  3, -- pain
  NULL, -- sleep_hours
  NULL, -- night_wakes
  ARRAY['on_top_world', 'solid_baseline', 'foggy']::text[], -- expressive mood chips
  'Test with expressive mood chips',
  ARRAY[]::text[], -- symptoms
  ARRAY[]::text[], -- pain_locations
  ARRAY[]::text[], -- pain_types
  ARRAY[]::text[] -- custom_symptoms
);

-- Check if the test worked
SELECT 
  user_id, 
  local_date, 
  tags,
  mood,
  sleep_quality,
  pain,
  journal
FROM daily_entries 
WHERE user_id = 'c1b5662e-73dd-48b1-a5d8-ec0d1a648415'
  AND local_date = '2025-10-12';
