-- Comprehensive diagnosis of Emma's data

-- 1. Check if Emma's profile exists
SELECT 'Emma Profile Check' as check_type, 
  COUNT(*) as count,
  slug,
  user_id
FROM profiles 
WHERE slug = 'emma-chronic-pain-journey'
GROUP BY slug, user_id;

-- 2. Count total daily_entries for Emma
SELECT 'Total Daily Entries' as check_type,
  COUNT(*) as total_entries
FROM daily_entries 
WHERE user_id = (SELECT user_id FROM profiles WHERE slug = 'emma-chronic-pain-journey');

-- 3. Show date range of existing entries
SELECT 'Date Range' as check_type,
  MIN(local_date) as earliest_date,
  MAX(local_date) as latest_date,
  COUNT(*) as total_days
FROM daily_entries 
WHERE user_id = (SELECT user_id FROM profiles WHERE slug = 'emma-chronic-pain-journey');

-- 4. Count entries by month
SELECT 
  TO_CHAR(local_date, 'YYYY-MM') as month,
  COUNT(*) as entries,
  COUNT(CASE WHEN mood IS NOT NULL THEN 1 END) as with_mood,
  COUNT(CASE WHEN pain IS NOT NULL THEN 1 END) as with_pain
FROM daily_entries 
WHERE user_id = (SELECT user_id FROM profiles WHERE slug = 'emma-chronic-pain-journey')
GROUP BY TO_CHAR(local_date, 'YYYY-MM')
ORDER BY month;

-- 5. Show September entries specifically with their values
SELECT 
  local_date,
  mood,
  sleep_quality,
  pain,
  sleep_hours,
  LEFT(journal, 30) as journal_preview
FROM daily_entries 
WHERE user_id = (SELECT user_id FROM profiles WHERE slug = 'emma-chronic-pain-journey')
AND local_date BETWEEN '2025-09-01' AND '2025-09-30'
ORDER BY local_date;

-- 6. Check if there are ANY non-null pain values
SELECT 
  'Non-null Pain Values' as check_type,
  COUNT(*) as count,
  MIN(pain) as min_pain,
  MAX(pain) as max_pain
FROM daily_entries 
WHERE user_id = (SELECT user_id FROM profiles WHERE slug = 'emma-chronic-pain-journey')
AND pain IS NOT NULL;

