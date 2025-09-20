-- Test Creator Tier Functionality
-- Run this in your Supabase SQL Editor to test Creator features

-- 1. Get your user ID first
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

-- 2. Update your tier to Creator (replace 'your-user-id-here' with actual user ID)
-- UPDATE profiles 
-- SET tier = 'creator' 
-- WHERE user_id = 'your-user-id-here';

-- 3. Verify the update
-- SELECT 
--     p.user_id,
--     p.slug,
--     p.display_name,
--     p.tier,
--     p.custom_branding_enabled,
--     p.custom_logo_url
-- FROM profiles p
-- WHERE p.user_id = 'your-user-id-here';

-- 4. Test shop gear items (optional)
-- INSERT INTO shop_gear_items (
--     profile_id,
--     name,
--     description,
--     brand,
--     category,
--     price,
--     affiliate_url,
--     commission_rate,
--     featured,
--     public
-- ) VALUES (
--     (SELECT id FROM profiles WHERE user_id = 'your-user-id-here'),
--     'Test Product',
--     'This is a test product for Creator tier',
--     'Test Brand',
--     'supplements',
--     '$29.99',
--     'https://example.com/affiliate-link',
--     '5%',
--     true,
--     true
-- );
