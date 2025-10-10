-- Fix Emma's followers by adding verified_at timestamps
-- User ID: c1b5662e-73dd-48b1-a5d8-ec0d1a648415

UPDATE stack_followers 
SET verified_at = NOW()
WHERE owner_user_id = 'c1b5662e-73dd-48b1-a5d8-ec0d1a648415'
AND verified_at IS NULL;

-- Verify the fix
SELECT 
    COUNT(*) as total_followers,
    COUNT(verified_at) as verified_followers
FROM stack_followers
WHERE owner_user_id = 'c1b5662e-73dd-48b1-a5d8-ec0d1a648415';

-- Show a few examples
SELECT 
    sf.follower_user_id,
    u.email as follower_email,
    sf.verified_at,
    sf.created_at
FROM stack_followers sf
LEFT JOIN auth.users u ON u.id = sf.follower_user_id
WHERE sf.owner_user_id = 'c1b5662e-73dd-48b1-a5d8-ec0d1a648415'
ORDER BY sf.created_at DESC
LIMIT 5;
