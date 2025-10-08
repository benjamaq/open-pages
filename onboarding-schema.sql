-- Onboarding tracking schema
-- Add columns to profiles table to track onboarding progress

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_step INT DEFAULT 1;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS first_checkin_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS first_supplement_added BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_created BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS public_page_viewed BOOLEAN DEFAULT FALSE;

-- Create index for efficient onboarding queries
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding ON profiles(onboarding_completed, onboarding_step);
