-- Add referral code functionality to profiles table
-- Run this in your Supabase SQL editor

-- Add referral_code column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS referral_code TEXT;

-- Add index for referral code lookups
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON profiles(referral_code);

-- Add referral_source column to track where the referral came from
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS referral_source TEXT;

-- Add index for referral source lookups
CREATE INDEX IF NOT EXISTS idx_profiles_referral_source ON profiles(referral_source);

-- Add referred_by column to track who referred this user
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES profiles(id);

-- Add index for referred_by lookups
CREATE INDEX IF NOT EXISTS idx_profiles_referred_by ON profiles(referred_by);

-- Add comments to document the referral system
COMMENT ON COLUMN profiles.referral_code IS 'The referral code used during signup (e.g., "redditgo")';
COMMENT ON COLUMN profiles.referral_source IS 'The source of the referral (e.g., "reddit", "twitter", "youtube")';
COMMENT ON COLUMN profiles.referred_by IS 'The profile ID of the user who referred this user';

