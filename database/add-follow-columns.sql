-- Add follow stack columns to profiles table
-- Run this in your Supabase SQL editor

-- Add allow_stack_follow column
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS allow_stack_follow BOOLEAN NOT NULL DEFAULT true;

-- Add show_public_followers column  
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS show_public_followers BOOLEAN NOT NULL DEFAULT true;

-- Update existing profiles to have follow enabled by default
UPDATE profiles 
SET allow_stack_follow = true, show_public_followers = true 
WHERE allow_stack_follow IS NULL OR show_public_followers IS NULL;
