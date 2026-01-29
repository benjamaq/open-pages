-- 1) Add explicit linkage from stack_items -> user_supplement
ALTER TABLE IF EXISTS stack_items
ADD COLUMN IF NOT EXISTS user_supplement_id uuid REFERENCES user_supplement(id);

-- 2) Optional backfill (best-effort by fuzzy name on the same user)
-- NOTE: Review before running in production; test on staging first.
WITH stack AS (
  SELECT si.id AS stack_id, si.name AS stack_name, p.user_id
  FROM stack_items si
  JOIN profiles p ON p.id = si.profile_id
),
cand AS (
  SELECT us.id AS us_id, us.name AS us_name, us.user_id
  FROM user_supplement us
)
UPDATE stack_items si
SET user_supplement_id = c.us_id
FROM (
  SELECT s.stack_id, c.us_id,
         similarity(lower(s.stack_name), lower(c.us_name)) AS sim
  FROM stack s
  JOIN cand c ON c.user_id = s.user_id
  WHERE lower(c.us_name) <> ''
) c
WHERE si.id = c.stack_id
  AND c.sim >= 0.30
  AND si.user_supplement_id IS NULL;

-- 3) (Optional) Create index for fast joins
CREATE INDEX IF NOT EXISTS idx_stack_items_user_supplement_id ON stack_items(user_supplement_id);



