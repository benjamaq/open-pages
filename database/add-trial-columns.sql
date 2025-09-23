-- Add trial columns to user_usage table
-- Run this in your Supabase SQL editor

-- Add trial-related columns to user_usage table
ALTER TABLE user_usage 
ADD COLUMN IF NOT EXISTS is_in_trial BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS trial_ended_at TIMESTAMP WITH TIME ZONE;

-- Update existing users to have trial status based on their tier
-- If they're on 'pro' tier, they should be marked as not in trial (they're paying customers)
-- If they're on 'free' tier, they could be in trial or not
UPDATE user_usage 
SET is_in_trial = false 
WHERE tier = 'pro';

-- Add a comment to document the trial logic
COMMENT ON COLUMN user_usage.is_in_trial IS 'Whether the user is currently in a free trial period';
COMMENT ON COLUMN user_usage.trial_started_at IS 'When the trial period started';
COMMENT ON COLUMN user_usage.trial_ended_at IS 'When the trial period ends or ended';

