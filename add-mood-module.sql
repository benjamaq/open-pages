-- Add mood module to public_modules configuration
-- Run this in your Supabase SQL editor

-- Update the default public_modules to include mood
ALTER TABLE profiles 
ALTER COLUMN public_modules SET DEFAULT '{
  "supplements": true,
  "protocols": true,
  "movement": true,
  "mindfulness": true,
  "food": true,
  "uploads": true,
  "library": true,
  "journal": true,
  "mood": true
}'::jsonb;

-- Update existing profiles to include mood module
UPDATE profiles 
SET public_modules = public_modules || '{"mood": true}'::jsonb
WHERE public_modules IS NOT NULL;

-- For profiles without public_modules, set the full default
UPDATE profiles 
SET public_modules = '{
  "supplements": true,
  "protocols": true,
  "movement": true,
  "mindfulness": true,
  "food": true,
  "uploads": true,
  "library": true,
  "journal": true,
  "mood": true
}'::jsonb
WHERE public_modules IS NULL;
