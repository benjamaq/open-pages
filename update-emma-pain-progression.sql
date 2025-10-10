-- Update Emma's pain progression to show improvement over time
-- Sept 1-24: Orange/Red (struggling), Sept 25-30: Green progression (recovery), Oct: Green with some yellow

-- September 1-8: High pain (red/orange) - struggling period
UPDATE daily_entries 
SET 
  mood = CASE 
    WHEN local_date = '2025-09-01' THEN 2
    WHEN local_date = '2025-09-02' THEN 3
    WHEN local_date = '2025-09-03' THEN 2
    WHEN local_date = '2025-09-04' THEN 4
    WHEN local_date = '2025-09-05' THEN 3
    WHEN local_date = '2025-09-06' THEN 2
    WHEN local_date = '2025-09-07' THEN 4
    WHEN local_date = '2025-09-08' THEN 3
  END,
  sleep_quality = CASE 
    WHEN local_date = '2025-09-01' THEN 2
    WHEN local_date = '2025-09-02' THEN 3
    WHEN local_date = '2025-09-03' THEN 2
    WHEN local_date = '2025-09-04' THEN 4
    WHEN local_date = '2025-09-05' THEN 3
    WHEN local_date = '2025-09-06' THEN 2
    WHEN local_date = '2025-09-07' THEN 4
    WHEN local_date = '2025-09-08' THEN 3
  END,
  pain = CASE 
    WHEN local_date = '2025-09-01' THEN 9
    WHEN local_date = '2025-09-02' THEN 8
    WHEN local_date = '2025-09-03' THEN 9
    WHEN local_date = '2025-09-04' THEN 7
    WHEN local_date = '2025-09-05' THEN 8
    WHEN local_date = '2025-09-06' THEN 9
    WHEN local_date = '2025-09-07' THEN 7
    WHEN local_date = '2025-09-08' THEN 8
  END,
  journal = CASE 
    WHEN local_date = '2025-09-01' THEN 'Terrible day. Pain at 9/10. Can barely move.'
    WHEN local_date = '2025-09-02' THEN 'Still struggling. Pain 8/10. Need relief.'
    WHEN local_date = '2025-09-03' THEN 'Worst day yet. Pain 9/10. Desperate for help.'
    WHEN local_date = '2025-09-04' THEN 'Slightly better but still awful. Pain 7/10.'
    WHEN local_date = '2025-09-05' THEN 'Bad day again. Pain 8/10. This is unbearable.'
    WHEN local_date = '2025-09-06' THEN 'Another terrible day. Pain 9/10. Need something to work.'
    WHEN local_date = '2025-09-07' THEN 'Still in agony. Pain 7/10. When will this end?'
    WHEN local_date = '2025-09-08' THEN 'Horrible day. Pain 8/10. Completely exhausted.'
  END
WHERE user_id = (SELECT user_id FROM profiles WHERE slug = 'emma-chronic-pain-journey')
AND local_date BETWEEN '2025-09-01' AND '2025-09-08';

-- September 9-16: Continued high pain (orange/red)
UPDATE daily_entries 
SET 
  mood = CASE 
    WHEN local_date = '2025-09-09' THEN 3
    WHEN local_date = '2025-09-10' THEN 2
    WHEN local_date = '2025-09-11' THEN 4
    WHEN local_date = '2025-09-12' THEN 3
    WHEN local_date = '2025-09-13' THEN 2
    WHEN local_date = '2025-09-14' THEN 4
    WHEN local_date = '2025-09-15' THEN 3
    WHEN local_date = '2025-09-16' THEN 2
  END,
  sleep_quality = CASE 
    WHEN local_date = '2025-09-09' THEN 3
    WHEN local_date = '2025-09-10' THEN 2
    WHEN local_date = '2025-09-11' THEN 4
    WHEN local_date = '2025-09-12' THEN 3
    WHEN local_date = '2025-09-13' THEN 2
    WHEN local_date = '2025-09-14' THEN 4
    WHEN local_date = '2025-09-15' THEN 3
    WHEN local_date = '2025-09-16' THEN 2
  END,
  pain = CASE 
    WHEN local_date = '2025-09-09' THEN 8
    WHEN local_date = '2025-09-10' THEN 9
    WHEN local_date = '2025-09-11' THEN 7
    WHEN local_date = '2025-09-12' THEN 8
    WHEN local_date = '2025-09-13' THEN 9
    WHEN local_date = '2025-09-14' THEN 7
    WHEN local_date = '2025-09-15' THEN 8
    WHEN local_date = '2025-09-16' THEN 9
  END,
  journal = CASE 
    WHEN local_date = '2025-09-09' THEN 'Another awful day. Pain 8/10. This is my life now.'
    WHEN local_date = '2025-09-10' THEN 'Worst pain yet. 9/10. I can''t take this anymore.'
    WHEN local_date = '2025-09-11' THEN 'Slightly better but still terrible. Pain 7/10.'
    WHEN local_date = '2025-09-12' THEN 'Bad day again. Pain 8/10. When will this improve?'
    WHEN local_date = '2025-09-13' THEN 'Terrible pain again. 9/10. Need a breakthrough.'
    WHEN local_date = '2025-09-14' THEN 'Still struggling. Pain 7/10. Exhausted.'
    WHEN local_date = '2025-09-15' THEN 'Another bad day. Pain 8/10. Feeling hopeless.'
    WHEN local_date = '2025-09-16' THEN 'Worst day in weeks. Pain 9/10. Desperate.'
  END
WHERE user_id = (SELECT user_id FROM profiles WHERE slug = 'emma-chronic-pain-journey')
AND local_date BETWEEN '2025-09-09' AND '2025-09-16';

-- September 17-24: Still high pain but starting to see glimpses of hope
UPDATE daily_entries 
SET 
  mood = CASE 
    WHEN local_date = '2025-09-17' THEN 4
    WHEN local_date = '2025-09-18' THEN 3
    WHEN local_date = '2025-09-19' THEN 4
    WHEN local_date = '2025-09-20' THEN 3
    WHEN local_date = '2025-09-21' THEN 4
    WHEN local_date = '2025-09-22' THEN 3
    WHEN local_date = '2025-09-23' THEN 4
    WHEN local_date = '2025-09-24' THEN 3
  END,
  sleep_quality = CASE 
    WHEN local_date = '2025-09-17' THEN 4
    WHEN local_date = '2025-09-18' THEN 3
    WHEN local_date = '2025-09-19' THEN 4
    WHEN local_date = '2025-09-20' THEN 3
    WHEN local_date = '2025-09-21' THEN 4
    WHEN local_date = '2025-09-22' THEN 3
    WHEN local_date = '2025-09-23' THEN 4
    WHEN local_date = '2025-09-24' THEN 3
  END,
  pain = CASE 
    WHEN local_date = '2025-09-17' THEN 7
    WHEN local_date = '2025-09-18' THEN 8
    WHEN local_date = '2025-09-19' THEN 7
    WHEN local_date = '2025-09-20' THEN 8
    WHEN local_date = '2025-09-21' THEN 7
    WHEN local_date = '2025-09-22' THEN 8
    WHEN local_date = '2025-09-23' THEN 7
    WHEN local_date = '2025-09-24' THEN 8
  END,
  journal = CASE 
    WHEN local_date = '2025-09-17' THEN 'Still bad but maybe slightly better. Pain 7/10.'
    WHEN local_date = '2025-09-18' THEN 'Bad day again. Pain 8/10. Frustrated.'
    WHEN local_date = '2025-09-19' THEN 'Slightly better. Pain 7/10. Hope this continues.'
    WHEN local_date = '2025-09-20' THEN 'Another tough day. Pain 8/10. Need relief.'
    WHEN local_date = '2025-09-21' THEN 'Maybe seeing some improvement? Pain 7/10.'
    WHEN local_date = '2025-09-22' THEN 'Bad day. Pain 8/10. Two steps forward, one back.'
    WHEN local_date = '2025-09-23' THEN 'Slightly better again. Pain 7/10. Cautiously hopeful.'
    WHEN local_date = '2025-09-24' THEN 'Tough day. Pain 8/10. But maybe I''m seeing patterns?'
  END
WHERE user_id = (SELECT user_id FROM profiles WHERE slug = 'emma-chronic-pain-journey')
AND local_date BETWEEN '2025-09-17' AND '2025-09-24';

-- September 25-30: The turning point - green progression (recovery begins)
UPDATE daily_entries 
SET 
  mood = CASE 
    WHEN local_date = '2025-09-25' THEN 5
    WHEN local_date = '2025-09-26' THEN 6
    WHEN local_date = '2025-09-27' THEN 6
    WHEN local_date = '2025-09-28' THEN 7
    WHEN local_date = '2025-09-29' THEN 7
    WHEN local_date = '2025-09-30' THEN 8
  END,
  sleep_quality = CASE 
    WHEN local_date = '2025-09-25' THEN 5
    WHEN local_date = '2025-09-26' THEN 6
    WHEN local_date = '2025-09-27' THEN 6
    WHEN local_date = '2025-09-28' THEN 7
    WHEN local_date = '2025-09-29' THEN 7
    WHEN local_date = '2025-09-30' THEN 8
  END,
  pain = CASE 
    WHEN local_date = '2025-09-25' THEN 6
    WHEN local_date = '2025-09-26' THEN 5
    WHEN local_date = '2025-09-27' THEN 5
    WHEN local_date = '2025-09-28' THEN 4
    WHEN local_date = '2025-09-29' THEN 4
    WHEN local_date = '2025-09-30' THEN 3
  END,
  journal = CASE 
    WHEN local_date = '2025-09-25' THEN 'Something is different today. Pain 6/10. Is this working?'
    WHEN local_date = '2025-09-26' THEN 'Better day! Pain 5/10. Could this be the breakthrough?'
    WHEN local_date = '2025-09-27' THEN 'Another good day. Pain 5/10. I feel more like myself.'
    WHEN local_date = '2025-09-28' THEN 'Great day! Pain 4/10. This is amazing!'
    WHEN local_date = '2025-09-29' THEN 'Excellent day. Pain 4/10. I''m getting my life back!'
    WHEN local_date = '2025-09-30' THEN 'Best day in months! Pain 3/10. This is working!'
  END
WHERE user_id = (SELECT user_id FROM profiles WHERE slug = 'emma-chronic-pain-journey')
AND local_date BETWEEN '2025-09-25' AND '2025-09-30';

-- October 1-10: Continued green progression with some variation
UPDATE daily_entries 
SET 
  mood = CASE 
    WHEN local_date = '2025-10-01' THEN 7
    WHEN local_date = '2025-10-02' THEN 8
    WHEN local_date = '2025-10-03' THEN 8
    WHEN local_date = '2025-10-04' THEN 7
    WHEN local_date = '2025-10-05' THEN 8
    WHEN local_date = '2025-10-06' THEN 9
    WHEN local_date = '2025-10-07' THEN 8
    WHEN local_date = '2025-10-08' THEN 9
    WHEN local_date = '2025-10-09' THEN 8
    WHEN local_date = '2025-10-10' THEN 9
  END,
  sleep_quality = CASE 
    WHEN local_date = '2025-10-01' THEN 7
    WHEN local_date = '2025-10-02' THEN 8
    WHEN local_date = '2025-10-03' THEN 8
    WHEN local_date = '2025-10-04' THEN 7
    WHEN local_date = '2025-10-05' THEN 8
    WHEN local_date = '2025-10-06' THEN 9
    WHEN local_date = '2025-10-07' THEN 8
    WHEN local_date = '2025-10-08' THEN 9
    WHEN local_date = '2025-10-09' THEN 8
    WHEN local_date = '2025-10-10' THEN 9
  END,
  pain = CASE 
    WHEN local_date = '2025-10-01' THEN 4
    WHEN local_date = '2025-10-02' THEN 3
    WHEN local_date = '2025-10-03' THEN 3
    WHEN local_date = '2025-10-04' THEN 4
    WHEN local_date = '2025-10-05' THEN 3
    WHEN local_date = '2025-10-06' THEN 2
    WHEN local_date = '2025-10-07' THEN 3
    WHEN local_date = '2025-10-08' THEN 2
    WHEN local_date = '2025-10-09' THEN 3
    WHEN local_date = '2025-10-10' THEN 2
  END,
  journal = CASE 
    WHEN local_date = '2025-10-01' THEN 'Good day. Pain 4/10. The improvement continues!'
    WHEN local_date = '2025-10-02' THEN 'Excellent day! Pain 3/10. Feeling hopeful.'
    WHEN local_date = '2025-10-03' THEN 'Another great day. Pain 3/10. This is life-changing.'
    WHEN local_date = '2025-10-04' THEN 'Good day with some discomfort. Pain 4/10.'
    WHEN local_date = '2025-10-05' THEN 'Fantastic day! Pain 3/10. I feel like a new person.'
    WHEN local_date = '2025-10-06' THEN 'Amazing day! Pain 2/10. Best I''ve felt in years!'
    WHEN local_date = '2025-10-07' THEN 'Great day. Pain 3/10. So grateful for this improvement.'
    WHEN local_date = '2025-10-08' THEN 'Outstanding day! Pain 2/10. This is incredible!'
    WHEN local_date = '2025-10-09' THEN 'Good day. Pain 3/10. Life is so much better now.'
    WHEN local_date = '2025-10-10' THEN 'Excellent day! Pain 2/10. I''m getting my life back!'
  END
WHERE user_id = (SELECT user_id FROM profiles WHERE slug = 'emma-chronic-pain-journey')
AND local_date BETWEEN '2025-10-01' AND '2025-10-10';

-- Verify the updates
SELECT 
  local_date,
  mood,
  sleep_quality,
  pain,
  journal
FROM daily_entries 
WHERE user_id = (SELECT user_id FROM profiles WHERE slug = 'emma-chronic-pain-journey')
ORDER BY local_date;
