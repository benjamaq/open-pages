-- ============================================================================
-- TONE PROFILE SYSTEM - DATABASE MIGRATION
-- ============================================================================
-- This migration adds the tone_profile column to profiles table and sets
-- initial values based on existing condition_category data.
-- ============================================================================

-- Step 1: Add tone_profile column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS tone_profile TEXT;

-- Step 2: Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_tone_profile ON profiles(tone_profile);

-- Step 3: Set tone_profile for existing users based on their condition_category
UPDATE profiles
SET tone_profile = CASE
  -- Chronic pain categories
  WHEN condition_category = 'Chronic pain or illness' THEN 'chronic_pain'
  WHEN condition_specific IN ('Fibromyalgia', 'CFS/ME', 'Chronic pain', 'Autoimmune condition') THEN 'chronic_pain'
  
  -- Biohacking
  WHEN condition_category = 'Biohacking' THEN 'biohacking'
  
  -- Fertility
  WHEN condition_category = 'Fertility or pregnancy' THEN 'fertility'
  
  -- Sleep
  WHEN condition_category = 'Sleep issues' THEN 'sleep'
  
  -- Energy
  WHEN condition_category = 'Energy or fatigue' THEN 'energy'
  
  -- Mental health
  WHEN condition_category = 'Mental health' THEN 'mental_health'
  
  -- ADHD (can be in chronic illness or standalone)
  WHEN condition_specific = 'ADHD' THEN 'adhd'
  
  -- Perimenopause (specific subcategory)
  WHEN condition_specific = 'Perimenopause' THEN 'perimenopause'
  
  -- General wellness (default)
  WHEN condition_category = 'General wellness' THEN 'general_wellness'
  WHEN condition_category = 'Something else' THEN 'general_wellness'
  
  -- Default for users without category
  ELSE 'general_wellness'
END
WHERE tone_profile IS NULL;

-- Step 4: Add comment to column for documentation
COMMENT ON COLUMN profiles.tone_profile IS 'Elli tone profile: chronic_pain, biohacking, fertility, sleep, energy, mental_health, adhd, perimenopause, general_wellness';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify the migration worked correctly:

-- Check distribution of tone profiles
-- SELECT tone_profile, COUNT(*) as user_count
-- FROM profiles
-- GROUP BY tone_profile
-- ORDER BY user_count DESC;

-- Check users without tone profile (should be 0)
-- SELECT COUNT(*) as users_without_tone
-- FROM profiles
-- WHERE tone_profile IS NULL;

-- ============================================================================
-- ROLLBACK (if needed)
-- ============================================================================
-- To rollback this migration:
-- DROP INDEX IF EXISTS idx_profiles_tone_profile;
-- ALTER TABLE profiles DROP COLUMN IF EXISTS tone_profile;

