-- Get your user ID and profile info
-- Run this in your Supabase SQL Editor

SELECT 
    p.user_id,
    p.id as profile_id,
    p.slug,
    p.display_name,
    p.tier,
    u.is_in_trial,
    u.trial_started_at,
    u.trial_ended_at
FROM profiles p
LEFT JOIN user_usage u ON p.user_id = u.user_id
ORDER BY p.created_at DESC
LIMIT 5;