-- Check what data exists for Emma

SELECT 'Profile' as type, COUNT(*) as count 
FROM profiles 
WHERE slug = 'emma-chronic-pain-journey'

UNION ALL

SELECT 'Stack Items' as type, COUNT(*) as count
FROM stack_items
WHERE profile_id IN (SELECT id FROM profiles WHERE slug = 'emma-chronic-pain-journey')

UNION ALL

SELECT 'Stack Items (devices)' as type, COUNT(*) as count
FROM stack_items
WHERE profile_id IN (SELECT id FROM profiles WHERE slug = 'emma-chronic-pain-journey')
AND item_type = 'devices'

UNION ALL

SELECT 'Daily Entries' as type, COUNT(*) as count
FROM daily_entries
WHERE user_id IN (SELECT user_id FROM profiles WHERE slug = 'emma-chronic-pain-journey')

UNION ALL

SELECT 'Journal Entries' as type, COUNT(*) as count
FROM journal_entries
WHERE profile_id IN (SELECT id FROM profiles WHERE slug = 'emma-chronic-pain-journey')

UNION ALL

SELECT 'Followers' as type, COUNT(*) as count
FROM stack_followers
WHERE owner_user_id IN (SELECT user_id FROM profiles WHERE slug = 'emma-chronic-pain-journey');

-- Show stack items by type
SELECT item_type, COUNT(*) as count
FROM stack_items
WHERE profile_id IN (SELECT id FROM profiles WHERE slug = 'emma-chronic-pain-journey')
GROUP BY item_type
ORDER BY item_type;
