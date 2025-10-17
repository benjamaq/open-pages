-- Keep only the most recent insight of each type per day
DELETE FROM elli_messages
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id, DATE(created_at), context->>'insight_key') id
  FROM elli_messages
  WHERE message_type = 'insight'
  ORDER BY user_id, DATE(created_at), context->>'insight_key', created_at DESC
)
AND message_type = 'insight';


