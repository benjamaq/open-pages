-- Quick setup for Follow Stack feature
-- Run this in your Supabase SQL Editor when ready

-- Add the allow_stack_follow column to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS allow_stack_follow BOOLEAN NOT NULL DEFAULT false;

-- Add the show_public_followers column to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS show_public_followers BOOLEAN DEFAULT false;

-- Update existing profiles to have the default values
UPDATE profiles 
SET allow_stack_follow = false 
WHERE allow_stack_follow IS NULL;

UPDATE profiles 
SET show_public_followers = false 
WHERE show_public_followers IS NULL;
