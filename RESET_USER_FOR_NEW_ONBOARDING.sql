-- Reset user for new orchestrated onboarding flow
-- This will make them go through the new flow with category selection BEFORE check-in

-- Replace 'YOUR_USER_ID' with the actual user ID from the logs
-- From the logs, the user_id is: ced9efc0-91d5-40d6-b9e2-ac9a8a7c546d

UPDATE profiles
SET 
  first_checkin_completed = false,
  first_supplement_added = false,
  onboarding_completed = false,
  onboarding_step = 1,
  tone_profile = NULL,
  condition_category = NULL,
  condition_specific = NULL,
  condition_provided_at = NULL
WHERE user_id = 'ced9efc0-91d5-40d6-b9e2-ac9a8a7c546d';

-- Verify the update
SELECT 
  user_id,
  first_checkin_completed,
  first_supplement_added,
  onboarding_completed,
  onboarding_step,
  tone_profile,
  condition_category,
  condition_specific
FROM profiles 
WHERE user_id = 'ced9efc0-91d5-40d6-b9e2-ac9a8a7c546d';





