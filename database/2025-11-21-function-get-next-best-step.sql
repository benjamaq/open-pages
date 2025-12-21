-- BioStackr: get_next_best_step() function
-- Run after foundation schema is created
-- Returns a single highest-priority recommendation for a user/day

create or replace function get_next_best_step(
  p_user_id uuid,
  p_today date
)
returns table (
  rec text,
  priority_score numeric,
  reason text,
  payload jsonb
)
language sql
as $$
with
-- A) TODAY CHECK-IN?
today_checkin as (
  select 1 as has_checkin
  from checkin
  where user_id = p_user_id
    and day = p_today
  limit 1
),

-- B) ACTIVE TEST (if any)
active_test as (
  select *
  from validation_test
  where user_id = p_user_id
    and state = 'active'
  order by started_at desc nulls last
  limit 1
),

-- C) EFFECT SNAPSHOT for this user (joined with user_supplement for cost + label)
es as (
  select
    es.user_supplement_id,
    es.stage,
    coalesce(es.confidence, 0) as confidence,
    coalesce(es.trend, 'flat') as trend,
    coalesce(us.monthly_cost_usd, 0) as cost_per_month,
    coalesce(us.label, s.canonical_name) as label
  from effect_summary es
  join user_supplement us on us.id = es.user_supplement_id
  join supplement s on s.id = us.supplement_id
  where es.user_id = p_user_id
),

-- D) CANDIDATES

-- D1: Check-in gate (highest priority if missing)
candidate_checkin as (
  select
    'checkin'::text as rec,
    100::numeric as priority_score,
    'No check-in today; freshness needed for updated insights'::text as reason,
    '{}'::jsonb as payload
  where not exists (select 1 from today_checkin)
),

-- D2: Finish active test (if running and incomplete)
candidate_finish_test as (
  select
    'finish_active_test' as rec,
    90::numeric as priority_score,
    'Finish active test to reach a verdict' as reason,
    jsonb_build_object('test_id', at.id) as payload
  from active_test at
  where (at.completed_days < at.days_planned)
),

-- D3: Removal test: neutral/negative with decent confidence (money saver first)
candidate_removal as (
  select
    'start_removal' as rec,
    -- score by confidence + cost saving
    (80 + least(10, (confidence*10)) + least(10, cost_per_month/10))::numeric as priority_score,
    concat(label, ' likely not helping; remove for 7 days to confirm') as reason,
    jsonb_build_object('user_supplement_id', user_supplement_id, 'days_planned', 7) as payload
  from es
  where
    (
      stage in ('EARLY_SIGNAL','PROVEN_NEUTRAL','PROVEN_HARMFUL')
      and (trend = 'down' or stage in ('PROVEN_NEUTRAL','PROVEN_HARMFUL'))
    )
),

-- D4: Timing/Dose test for promising positives not yet proven
candidate_timing as (
  select
    'start_timing' as rec,
    (70 + least(15, (confidence*10)))::numeric as priority_score,
    concat(label, ' shows early benefit; test evening timing for 7 days') as reason,
    jsonb_build_object('user_supplement_id', user_supplement_id, 'days_planned', 7, 'timing','evening') as payload
  from es
  where stage in ('EARLY_SIGNAL','VALIDATING_POSITIVE')
),

candidate_dose as (
  select
    'start_dose' as rec,
    (68 + least(15, (confidence*10)))::numeric as priority_score,
    concat(label, ' shows early benefit; test dose adjustment for 7 days') as reason,
    jsonb_build_object('user_supplement_id', user_supplement_id, 'days_planned', 7, 'dose_delta','increase_25pct') as payload
  from es
  where stage in ('EARLY_SIGNAL','VALIDATING_POSITIVE')
),

-- D5: Synergy test when there are at least two early positives not under active test
positive_candidates as (
  select user_supplement_id, label, confidence
  from es
  where stage in ('EARLY_SIGNAL','VALIDATING_POSITIVE','PROVEN_BENEFICIAL')
),
pair as (
  select
    p1.user_supplement_id as a_id, p1.label as a_label, p1.confidence as a_conf,
    p2.user_supplement_id as b_id, p2.label as b_label, p2.confidence as b_conf
  from positive_candidates p1
  join positive_candidates p2 on p2.user_supplement_id > p1.user_supplement_id
  limit 1
),
candidate_synergy as (
  select
    'start_synergy' as rec,
    60::numeric + coalesce((a_conf+b_conf)*5, 0) as priority_score,
    concat('Test synergy: ', a_label, ' + ', b_label, ' for 7 days') as reason,
    jsonb_build_object('user_supplement_ids', jsonb_build_array(a_id, b_id), 'days_planned', 7, 'timing', 'evening') as payload
  from (
    select p.a_id, p.a_label, p.a_conf, p.b_id, p.b_label, p.b_conf from pair p
  ) x
),

-- E) UNION ALL CANDIDATES
all_candidates as (
  select * from candidate_checkin
  union all
  select * from candidate_finish_test
  union all
  select * from candidate_removal
  union all
  select * from candidate_timing
  union all
  select * from candidate_dose
  union all
  select * from candidate_synergy
)

-- F) PICK THE TOP ACTION
select rec, priority_score, reason, payload
from all_candidates
order by priority_score desc, rec asc
limit 1;
$$;






