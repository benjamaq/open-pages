-- Give all existing free users a 14-day Pro trial
-- Run this in your Supabase SQL Editor after running trial-system.sql

-- 1. Update all existing free users to have a trial
UPDATE user_usage 
SET 
    trial_started_at = NOW(),
    is_in_trial = true,
    trial_used = false
WHERE user_id IN (
    SELECT p.user_id 
    FROM profiles p 
    WHERE p.tier = 'free' OR p.tier IS NULL
);

-- 2. Verify the update
SELECT 
    p.display_name,
    p.tier,
    u.trial_started_at,
    u.is_in_trial,
    u.trial_used,
    EXTRACT(days FROM NOW() - u.trial_started_at) as days_into_trial,
    14 - EXTRACT(days FROM NOW() - u.trial_started_at) as days_remaining
FROM profiles p
JOIN user_usage u ON p.user_id = u.user_id
WHERE p.tier = 'free' OR p.tier IS NULL
ORDER BY u.trial_started_at DESC;

-- 3. Check trial status function
SELECT 
    p.user_id,
    p.display_name,
    is_user_in_trial(p.user_id) as currently_in_trial,
    get_trial_status(p.user_id)
FROM profiles p
WHERE p.tier = 'free' OR p.tier IS NULL
LIMIT 5;
