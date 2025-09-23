-- Manually upgrade a user to Pro tier for testing
-- Replace 'YOUR_USER_ID' with your actual user ID from Supabase

-- First, find your user ID (run this query to see all users)
-- SELECT id, email FROM auth.users;

-- Then update the user to Pro tier
-- Replace 'YOUR_USER_ID' with the actual user ID from the query above

UPDATE user_usage 
SET tier = 'pro',
    is_in_trial = false,
    trial_used = true,
    trial_ended_at = NOW(),
    updated_at = NOW()
WHERE user_id = 'YOUR_USER_ID';

UPDATE profiles 
SET tier = 'pro',
    updated_at = NOW()
WHERE user_id = 'YOUR_USER_ID';

-- Verify the update
SELECT 
    p.display_name,
    p.tier as profile_tier,
    u.tier as usage_tier,
    u.is_in_trial,
    u.trial_used
FROM profiles p
JOIN user_usage u ON p.user_id = u.user_id
WHERE p.user_id = 'YOUR_USER_ID';
