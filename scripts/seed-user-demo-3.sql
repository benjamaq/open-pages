-- Seed (User Demo): 3 supplements, 7 check-ins, 1 effect_summary
-- User: 5bc552cd-615a-46c0-bb82-342e9659d730
-- Run in Supabase SQL Editor

do $$
declare
  p_user_id uuid := '5bc552cd-615a-46c0-bb82-342e9659d730'::uuid;
  v_today date := current_date;
  sid_mag uuid;
  sid_cr  uuid;
  sid_ash uuid;
  us_mag uuid;
  us_cr  uuid;
  us_ash uuid;
begin
  -- Ensure app_user row
  insert into app_user (id, tz)
  values (p_user_id, 'UTC')
  on conflict (id) do nothing;

  -- Ensure 3 canonical supplements (idempotent)
  insert into supplement (canonical_name, synonyms) values
    ('magnesium glycinate', array['magnesium','magnesium glycinate']),
    ('creatine monohydrate', array['creatine','creatine mono']),
    ('ashwagandha', array['withania somnifera','ashwagandha root'])
  on conflict (canonical_name) do nothing;

  select id into sid_mag from supplement where canonical_name = 'magnesium glycinate';
  select id into sid_cr  from supplement where canonical_name = 'creatine monohydrate';
  select id into sid_ash from supplement where canonical_name = 'ashwagandha';

  -- Link to user (idempotent)
  insert into user_supplement (id, user_id, supplement_id, label, start_window, monthly_cost_usd)
  values
    (gen_random_uuid(), p_user_id, sid_mag, 'Magnesium Glycinate', 'recent', 14),
    (gen_random_uuid(), p_user_id, sid_cr,  'Creatine Monohydrate', '3_6m', 12),
    (gen_random_uuid(), p_user_id, sid_ash, 'Ashwagandha', 'recent', 18)
  on conflict (user_id, supplement_id) do nothing;

  select id into us_mag from user_supplement where user_id = p_user_id and supplement_id = sid_mag;
  select id into us_cr  from user_supplement where user_id = p_user_id and supplement_id = sid_cr;
  select id into us_ash from user_supplement where user_id = p_user_id and supplement_id = sid_ash;

  -- 7 days check-ins (idempotent)
  insert into checkin (user_id, day, mood, energy, focus)
  select
    p_user_id,
    (v_today - gs)::date,
    3 + ((random()*2)::int - 1),
    3 + ((random()*2)::int - 1),
    3 + ((random()*2)::int - 1)
  from generate_series(0,6) as gs
  on conflict (user_id, day) do update set
    mood = excluded.mood,
    energy = excluded.energy,
    focus = excluded.focus;

  -- One test effect_summary entry (positive early signal for Magnesium) with sleep + hrv
  insert into effect_summary (user_id, user_supplement_id, stage, effect_size, confidence, trend, metrics)
  values (
    p_user_id,
    us_mag,
    'EARLY_SIGNAL',
    0.35,
    0.72,
    'up',
    jsonb_build_object(
      'sleep', jsonb_build_object('pct', 6.0,  'conf', 0.65),
      'hrv',   jsonb_build_object('pct', 4.1,  'conf', 0.58)
    )
  )
  on conflict (user_id, user_supplement_id) do update set
    stage = excluded.stage,
    effect_size = excluded.effect_size,
    confidence = excluded.confidence,
    trend = excluded.trend,
    metrics = excluded.metrics,
    computed_at = now();

  raise notice 'Seed complete for user % (US: %, %, %)', p_user_id, us_mag, us_cr, us_ash;
end $$;


