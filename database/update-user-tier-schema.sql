-- Update user tier schema to support creator tier and trial system
-- Run this in your Supabase SQL editor

-- 1. Update profiles table to support creator tier
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'creator'));

-- 2. Update user_usage table to support creator tier and trial fields
ALTER TABLE user_usage 
ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'creator'));

-- Add trial-related fields
ALTER TABLE user_usage 
ADD COLUMN IF NOT EXISTS is_in_trial BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS trial_ended_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS trial_used BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT,
ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMP WITH TIME ZONE;

-- Update the existing tier constraint
ALTER TABLE user_usage DROP CONSTRAINT IF EXISTS user_usage_tier_check;
ALTER TABLE user_usage ADD CONSTRAINT user_usage_tier_check CHECK (tier IN ('free', 'pro', 'creator'));

-- Update the profiles tier constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_tier_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_tier_check CHECK (tier IN ('free', 'pro', 'creator'));

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_tier ON profiles(tier);
CREATE INDEX IF NOT EXISTS idx_user_usage_tier ON user_usage(tier);
CREATE INDEX IF NOT EXISTS idx_user_usage_trial ON user_usage(is_in_trial);

-- Update existing users to have the new fields
UPDATE user_usage 
SET tier = 'free', 
    is_in_trial = false,
    trial_used = false
WHERE tier IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN profiles.tier IS 'User subscription tier: free, pro, or creator';
COMMENT ON COLUMN user_usage.tier IS 'User subscription tier: free, pro, or creator';
COMMENT ON COLUMN user_usage.is_in_trial IS 'Whether user is currently in trial period';
COMMENT ON COLUMN user_usage.trial_started_at IS 'When the trial period started';
COMMENT ON COLUMN user_usage.trial_ended_at IS 'When the trial period ended';
COMMENT ON COLUMN user_usage.trial_used IS 'Whether user has used their trial';
COMMENT ON COLUMN user_usage.stripe_customer_id IS 'Stripe customer ID for billing';
COMMENT ON COLUMN user_usage.stripe_subscription_id IS 'Stripe subscription ID';
COMMENT ON COLUMN user_usage.subscription_status IS 'Current subscription status from Stripe';
COMMENT ON COLUMN user_usage.current_period_end IS 'When current billing period ends';
