-- RESET USER ONBOARDING STATE
-- Run this in Supabase SQL Editor to test the new onboarding flow

-- Replace 'YOUR_EMAIL_HERE' with your test account email
-- This will reset the onboarding state so you can test the flow again

UPDATE profiles
SET 
  first_checkin_completed = false,
  first_supplement_added = false,
  onboarding_completed = false,
  onboarding_step = 0,
  tone_profile = NULL,
  condition_category = NULL,
  condition_specific = NULL,
  condition_provided_at = NULL
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'YOUR_EMAIL_HERE'
);

-- To verify the reset:
SELECT 
  p.display_name,
  p.first_checkin_completed,
  p.first_supplement_added,
  p.tone_profile,
  p.condition_category,
  au.email
FROM profiles p
JOIN auth.users au ON au.id = p.user_id
WHERE au.email = 'YOUR_EMAIL_HERE';

-- Expected result after reset:
-- first_checkin_completed: false
-- first_supplement_added: false
-- tone_profile: NULL
-- condition_category: NULL










