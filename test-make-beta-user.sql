-- Make current user a beta user for testing
-- Run this in your Supabase SQL editor

-- First, let's see what user we're working with
SELECT user_id, display_name, beta_code_used_at 
FROM profiles 
WHERE user_id = '5b52a5eb-5aa8-4b29-860b-6b40ab8ff279';

-- Update the profile to mark beta code as used
UPDATE profiles 
SET beta_code_used_at = NOW()
WHERE user_id = '5b52a5eb-5aa8-4b29-860b-6b40ab8ff279';

-- Mark a beta code as used by this user
UPDATE beta_codes 
SET used_by = '5b52a5eb-5aa8-4b29-860b-6b40ab8ff279',
    used_at = NOW()
WHERE code = 'BETA2025-001';

-- Verify the changes
SELECT user_id, display_name, beta_code_used_at 
FROM profiles 
WHERE user_id = '5b52a5eb-5aa8-4b29-860b-6b40ab8ff279';

SELECT code, used_by, used_at, expires_at
FROM beta_codes 
WHERE code = 'BETA2025-001';
