-- Debug Nutrition Signature Setup
-- Run this to check if everything is working

-- 1. Check if nutrition_signature column exists
SELECT 
  column_name,
  data_type,
  column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND column_name = 'nutrition_signature';

-- 2. Check current user's nutrition signature
SELECT 
  id,
  display_name,
  nutrition_signature
FROM profiles 
WHERE user_id = auth.uid();

-- 3. Test setting a simple nutrition signature for current user
UPDATE profiles 
SET nutrition_signature = '{
  "style": {"key": "mediterranean", "label": "Mediterranean"},
  "fasting": {"window": "16:8", "days_per_week": 5},
  "header_badges": ["style", "fasting"],
  "enabled": true
}'::jsonb
WHERE user_id = auth.uid();

-- 4. Verify the update worked
SELECT 
  'Updated nutrition signature:' as status,
  nutrition_signature
FROM profiles 
WHERE user_id = auth.uid();
