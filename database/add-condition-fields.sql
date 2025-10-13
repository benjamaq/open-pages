-- Add condition tracking fields to profiles table
-- This allows Elli to provide personalized responses based on the user's condition

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS condition_primary TEXT,
ADD COLUMN IF NOT EXISTS condition_details TEXT,
ADD COLUMN IF NOT EXISTS condition_provided_at TIMESTAMP WITH TIME ZONE;

-- Create an index for faster lookups when filtering by condition
CREATE INDEX IF NOT EXISTS idx_profiles_condition_primary ON profiles(condition_primary);

-- Add comment for documentation
COMMENT ON COLUMN profiles.condition_primary IS 'Primary condition selected by user (e.g., Chronic pain, Fibromyalgia, CFS/ME)';
COMMENT ON COLUMN profiles.condition_details IS 'Optional free-text details about the user''s condition';
COMMENT ON COLUMN profiles.condition_provided_at IS 'Timestamp when the user provided their condition information';

