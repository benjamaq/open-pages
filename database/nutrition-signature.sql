-- Add Nutrition Signature to Profiles
-- Run this in your Supabase SQL Editor

-- Add nutrition_signature JSON column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS nutrition_signature jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Add column comment
COMMENT ON COLUMN profiles.nutrition_signature IS 'JSON object storing nutrition badges and preferences for public profile display';

-- Create index for querying nutrition signatures
CREATE INDEX IF NOT EXISTS profiles_nutrition_signature_idx ON profiles USING gin (nutrition_signature);

-- Verify the column was added
SELECT 
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND column_name = 'nutrition_signature';

-- Show success message
SELECT 'Nutrition signature column added successfully!' as status;
