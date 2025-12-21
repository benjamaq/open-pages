-- Seed: Common supplements and demo data
-- HOW TO USE:
-- 1) Set your test user id below (from Supabase Auth → Users)
-- 2) Run this entire script in Supabase SQL Editor
-- 3) Re-run safely; inserts are idempotent where possible

do $$
declare
  p_user_id uuid := '5bc552cd-615a-46c0-bb82-342e9659d730'::uuid; -- REPLACE with your test user id
  v_now date := current_date;
  s_mag uuid;
  s_cr  uuid;
  s_ash uuid;
  s_gly uuid;
  s_d3  uuid;
  us_id uuid;
begin
  if p_user_id = '00000000-0000-0000-0000-000000000000'::uuid then
    raise notice 'Set p_user_id in this script to your test user id before running.';
    return;
  end if;

  -- Ensure app_user exists (trigger would normally create on signup)
  insert into app_user (id, tz)
  values (p_user_id, 'UTC')
  on conflict (id) do nothing;

  -- Common supplements (upsert by canonical_name)
  insert into supplement (canonical_name, synonyms) values
    ('magnesium glycinate', array['magnesium','magnesium glycinate','mg glycinate']),
    ('creatine monohydrate', array['creatine','creatine mono']),
    ('ashwagandha', array['withania somnifera','ashwagandha root']),
    ('glycine', array['glycine']),
    ('vitamin d3', array['vitamin d','cholecalciferol'])
  on conflict (canonical_name) do nothing;

  select id into s_mag from supplement where canonical_name = 'magnesium glycinate';
  select id into s_cr  from supplement where canonical_name = 'creatine monohydrate';
  select id into s_ash from supplement where canonical_name = 'ashwagandha';
  select id into s_gly from supplement where canonical_name = 'glycine';
  select id into s_d3  from supplement where canonical_name = 'vitamin d3';

  -- Create user_supplement rows (idempotent: unique(user_id, supplement_id))
  insert into user_supplement (user_id, supplement_id, label, start_window, monthly_cost_usd)
  values
    (p_user_id, s_mag, 'Magnesium Glycinate', 'recent', 14),
    (p_user_id, s_cr,  'Creatine Monohydrate', '3_6m', 12),
    (p_user_id, s_ash, 'Ashwagandha', 'recent', 18),
    (p_user_id, s_gly, 'Glycine', 'recent', 9),
    (p_user_id, s_d3,  'Vitamin D3', '1y_plus', 8)
  on conflict (user_id, supplement_id) do nothing;

  -- 7 days of simple check-ins (mood/energy/focus: 1..5 scale)
  -- Adjusts values slightly per day to create variance
  insert into checkin (user_id, day, mood, energy, focus)
  select
    p_user_id,
    (v_now - gs)::date,
    3 + ((random()*2)::int - 1),  -- ~2..4
    3 + ((random()*2)::int - 1),
    3 + ((random()*2)::int - 1)
  from generate_series(0,6) as gs
  on conflict (user_id, day) do nothing;

  raise notice 'Seed complete for user %', p_user_id;
end $$;


