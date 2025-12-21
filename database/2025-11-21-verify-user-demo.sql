-- Verification for user demo (specific UUID)
-- User: 5bc552cd-615a-46c0-bb82-342e9659d730

-- 1) Supplements linked (expect 3)
select
  us.id as user_supplement_id,
  s.canonical_name,
  us.monthly_cost_usd
from user_supplement us
join supplement s on s.id = us.supplement_id
where us.user_id = '5bc552cd-615a-46c0-bb82-342e9659d730'::uuid
order by s.canonical_name;

-- 2) Check-in count (expect ≥ 7)
select count(*) as checkins_7d
from checkin
where user_id = '5bc552cd-615a-46c0-bb82-342e9659d730'::uuid
  and day >= current_date - 6;

-- 3) One effect_summary exists (Magnesium)
select user_supplement_id, stage, effect_size, confidence, trend, metrics
from effect_summary
where user_id = '5bc552cd-615a-46c0-bb82-342e9659d730'::uuid;

-- 4) Recommendation sample (may return 'checkin' if you haven't added today's check-in)
select * from get_next_best_step('5bc552cd-615a-46c0-bb82-342e9659d730'::uuid, current_date);






