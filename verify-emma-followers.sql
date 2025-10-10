-- Verify Emma's followers were created

SELECT 
    COUNT(*) as follower_count,
    owner_user_id
FROM stack_followers
WHERE owner_user_id = 'c1b5662e-73dd-48b1-a5d8-ec0d1a648415'
GROUP BY owner_user_id;

-- Also show all followers
SELECT 
    sf.owner_user_id,
    sf.follower_user_id,
    u.email as follower_email,
    sf.created_at
FROM stack_followers sf
LEFT JOIN auth.users u ON u.id = sf.follower_user_id
WHERE sf.owner_user_id = 'c1b5662e-73dd-48b1-a5d8-ec0d1a648415'
ORDER BY sf.created_at DESC
LIMIT 10;
