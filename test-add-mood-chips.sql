-- Test script to add expressive mood chips to today's entry for testing
-- This will help us see if the heatmap popup displays them correctly

-- First, let's see what's currently in today's entry
SELECT user_id, local_date, tags 
FROM daily_entries 
WHERE local_date = '2025-10-12' 
ORDER BY created_at DESC 
LIMIT 1;

-- Add some expressive mood chips to today's entry
-- We'll add a mix of high, low, and neutral expressive chips
UPDATE daily_entries 
SET tags = array_cat(tags, ARRAY['on_top_world', 'solid_baseline', 'foggy'])
WHERE local_date = '2025-10-12' 
AND user_id = 'c1b5662e-73dd-48b1-a5d8-ec0d1a648415';

-- Check the updated entry
SELECT user_id, local_date, tags 
FROM daily_entries 
WHERE local_date = '2025-10-12' 
AND user_id = 'c1b5662e-73dd-48b1-a5d8-ec0d1a648415';
