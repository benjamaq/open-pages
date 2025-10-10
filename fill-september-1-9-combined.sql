-- Fill in September 1-9 with early struggling period (yellows and reds)
-- This completes Emma's pain journey from the very beginning
-- Single comprehensive UPDATE statement

UPDATE daily_entries 
SET 
  mood = CASE 
    WHEN local_date = '2025-09-01' THEN 2
    WHEN local_date = '2025-09-02' THEN 1
    WHEN local_date = '2025-09-03' THEN 2
    WHEN local_date = '2025-09-04' THEN 3
    WHEN local_date = '2025-09-05' THEN 2
    WHEN local_date = '2025-09-06' THEN 3
    WHEN local_date = '2025-09-07' THEN 3
    WHEN local_date = '2025-09-08' THEN 4
    WHEN local_date = '2025-09-09' THEN 3
  END,
  sleep_quality = CASE 
    WHEN local_date = '2025-09-01' THEN 2
    WHEN local_date = '2025-09-02' THEN 1
    WHEN local_date = '2025-09-03' THEN 2
    WHEN local_date = '2025-09-04' THEN 3
    WHEN local_date = '2025-09-05' THEN 2
    WHEN local_date = '2025-09-06' THEN 3
    WHEN local_date = '2025-09-07' THEN 3
    WHEN local_date = '2025-09-08' THEN 4
    WHEN local_date = '2025-09-09' THEN 3
  END,
  pain = CASE 
    WHEN local_date = '2025-09-01' THEN 9
    WHEN local_date = '2025-09-02' THEN 10
    WHEN local_date = '2025-09-03' THEN 9
    WHEN local_date = '2025-09-04' THEN 8
    WHEN local_date = '2025-09-05' THEN 9
    WHEN local_date = '2025-09-06' THEN 8
    WHEN local_date = '2025-09-07' THEN 8
    WHEN local_date = '2025-09-08' THEN 7
    WHEN local_date = '2025-09-09' THEN 8
  END,
  sleep_hours = CASE 
    WHEN local_date = '2025-09-01' THEN 4
    WHEN local_date = '2025-09-02' THEN 3
    WHEN local_date = '2025-09-03' THEN 4
    WHEN local_date = '2025-09-04' THEN 5
    WHEN local_date = '2025-09-05' THEN 4
    WHEN local_date = '2025-09-06' THEN 5
    WHEN local_date = '2025-09-07' THEN 5
    WHEN local_date = '2025-09-08' THEN 6
    WHEN local_date = '2025-09-09' THEN 5
  END,
  night_wakes = CASE 
    WHEN local_date = '2025-09-01' THEN 4
    WHEN local_date = '2025-09-02' THEN 5
    WHEN local_date = '2025-09-03' THEN 4
    WHEN local_date = '2025-09-04' THEN 3
    WHEN local_date = '2025-09-05' THEN 4
    WHEN local_date = '2025-09-06' THEN 3
    WHEN local_date = '2025-09-07' THEN 3
    WHEN local_date = '2025-09-08' THEN 2
    WHEN local_date = '2025-09-09' THEN 3
  END,
  tags = CASE 
    WHEN local_date = '2025-09-01' THEN ARRAY['desperate', 'exhausted', 'hopeless']
    WHEN local_date = '2025-09-02' THEN ARRAY['terrible', 'cant sleep', 'crying']
    WHEN local_date = '2025-09-03' THEN ARRAY['awful', 'no relief', 'desperate']
    WHEN local_date = '2025-09-04' THEN ARRAY['struggling', 'exhausted', 'frustrated']
    WHEN local_date = '2025-09-05' THEN ARRAY['terrible', 'cant move', 'hopeless']
    WHEN local_date = '2025-09-06' THEN ARRAY['awful', 'no energy', 'desperate']
    WHEN local_date = '2025-09-07' THEN ARRAY['struggling', 'exhausted', 'frustrated']
    WHEN local_date = '2025-09-08' THEN ARRAY['slightly better', 'cautious hope', 'still bad']
    WHEN local_date = '2025-09-09' THEN ARRAY['back to bad', 'disappointed', 'struggling']
  END,
  journal = CASE 
    WHEN local_date = '2025-09-01' THEN 'Day 1 of tracking. Pain is unbearable. 9/10. Can barely function.'
    WHEN local_date = '2025-09-02' THEN 'Worst day ever. Pain 10/10. I don''t know how much longer I can take this.'
    WHEN local_date = '2025-09-03' THEN 'Still terrible. Pain 9/10. Need help desperately. Nothing is working.'
    WHEN local_date = '2025-09-04' THEN 'Still awful. Pain 8/10. Maybe slightly better than yesterday but still terrible.'
    WHEN local_date = '2025-09-05' THEN 'Bad day again. Pain 9/10. Can barely move. This is my life now.'
    WHEN local_date = '2025-09-06' THEN 'Horrible pain. 8/10. When will this end? Need something to work.'
    WHEN local_date = '2025-09-07' THEN 'Still struggling badly. Pain 8/10. This is exhausting.'
    WHEN local_date = '2025-09-08' THEN 'Maybe slightly better today? Pain 7/10. Dare I hope?'
    WHEN local_date = '2025-09-09' THEN 'Bad day again. Pain 8/10. The hope was short-lived.'
  END
WHERE user_id = (SELECT user_id FROM profiles WHERE slug = 'emma-chronic-pain-journey')
AND local_date BETWEEN '2025-09-01' AND '2025-09-09';

-- Verify the updates
SELECT 
  local_date,
  mood,
  sleep_quality,
  pain,
  LEFT(journal, 50) as journal_preview
FROM daily_entries 
WHERE user_id = (SELECT user_id FROM profiles WHERE slug = 'emma-chronic-pain-journey')
AND local_date BETWEEN '2025-09-01' AND '2025-09-09'
ORDER BY local_date;

