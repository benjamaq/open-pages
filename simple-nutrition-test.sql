-- Simple Nutrition Test
-- Run this to add test badges to your profile

-- First, let's see what's currently in your nutrition_signature
SELECT 
  display_name,
  nutrition_signature
FROM profiles 
WHERE user_id = auth.uid();

-- Now let's set a simple test signature
UPDATE profiles 
SET nutrition_signature = '{
  "style": {"key": "mediterranean", "label": "Mediterranean"},
  "fasting": {"window": "16:8"},
  "weakness": "Pizza",
  "header_badges": ["style", "fasting", "weakness"],
  "enabled": true
}'
WHERE user_id = auth.uid();

-- Verify it was saved
SELECT 
  'Test badges added!' as status,
  nutrition_signature
FROM profiles 
WHERE user_id = auth.uid();
