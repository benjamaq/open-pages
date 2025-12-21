-- Verification checklist for BioStackr schema
-- HOW TO USE:
-- 1) Set your test user id below (same one used in the seed script)
-- 2) Run top-to-bottom in Supabase SQL Editor

-- Set your test user id
do $$
declare
  p_user_id uuid := '5bc552cd-615a-46c0-bb82-342e9659d730'::uuid; -- REPLACE with your test user id
  v_today date := current_date;
begin
  if p_user_id = '00000000-0000-0000-0000-000000000000'::uuid then
    raise notice 'Set p_user_id in this script to your test user id before running.';
    return;
  end if;
end $$;

-- 1) Enums exist
select typname as enum_type
from pg_type
where typname in ('truth_stage','test_kind','test_state','rec_type')
order by typname;

-- 2) Core tables exist
select table_name
from information_schema.tables
where table_schema='public'
  and table_name in (
    'app_user','checkin','wearable_sync','supplement','user_supplement',
    'effect_summary','validation_test','insight','recommendation'
  )
order by table_name;

-- 3) Public read policy on supplement works (should return rows)
select id, canonical_name from supplement order by canonical_name limit 10;

-- 4) Own-row RLS quick checks (these should run without error under service role; under anon they should scope automatically)
-- Checkins seeded
select count(*) as seeded_checkins
from checkin
where user_id = (select coalesce((select id from app_user limit 1), '00000000-0000-0000-0000-000000000000')::uuid);

-- User supplements seeded
select count(*) as seeded_user_supps
from user_supplement
where user_id = (select coalesce((select id from app_user limit 1), '00000000-0000-0000-0000-000000000000')::uuid);

-- 5) Sanity check the function (may return 0 rows if conditions don't match)
select * from get_next_best_step(
  (select id from app_user limit 1),
  current_date
);

-- If all above return expected rows and no errors: installation OK ✅


