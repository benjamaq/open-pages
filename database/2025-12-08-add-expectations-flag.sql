-- Adds expectations onboarding completion flag to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS expectations_onboarding_completed BOOLEAN DEFAULT false;


