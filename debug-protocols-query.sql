-- Debug query to see what's in the protocols table
SELECT 
  pr.id,
  pr.name,
  pr.frequency,
  pr.details,
  pr.description,
  pr.created_at
FROM protocols pr
JOIN profiles p ON p.id = pr.profile_id
WHERE p.user_id = '5bc552cd-615a-46c0-bb82-342e9659d730'
LIMIT 5;
