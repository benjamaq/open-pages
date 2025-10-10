-- Verify September 30th exists for Emma

SELECT 
    user_id,
    local_date,
    mood,
    pain,
    journal
FROM daily_entries
WHERE user_id = (SELECT user_id FROM profiles WHERE slug = 'emma-chronic-pain-journey')
AND local_date >= '2025-09-28'
AND local_date <= '2025-10-02'
ORDER BY local_date;
