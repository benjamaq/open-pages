-- Truth Engine schema (idempotent best-effort). Run in Supabase SQL editor.
-- Adapts to existing naming where possible (user_supplement is used in codebase).

-- 1) canonical_supplements
create table if not exists canonical_supplements (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  generic_name text,
  category text,
  primary_goals text[],
  mechanism_tags text[],
  pathway_summary text,
  created_at timestamp with time zone default now()
);

-- 2) Extend user_supplement (not plural) to add truth fields
do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_name = 'user_supplement' and column_name = 'canonical_id'
  ) then
    alter table user_supplement add column canonical_id uuid references canonical_supplements(id);
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_name = 'user_supplement' and column_name = 'stage'
  ) then
    alter table user_supplement add column stage text default 'hypothesis';
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_name = 'user_supplement' and column_name = 'protocol_days'
  ) then
    alter table user_supplement add column protocol_days int default 14;
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_name = 'user_supplement' and column_name = 'primary_metric'
  ) then
    alter table user_supplement add column primary_metric text default 'sleep_latency_minutes';
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_name = 'user_supplement' and column_name = 'secondary_metrics'
  ) then
    alter table user_supplement add column secondary_metrics text[];
  end if;

  -- Optional helper
  if not exists (
    select 1
    from information_schema.columns
    where table_name = 'user_supplement' and column_name = 'has_truth_report'
  ) then
    alter table user_supplement add column has_truth_report boolean default false;
  end if;
end $$;

-- 3) daily_metrics
create table if not exists daily_metrics (
  id bigserial primary key,
  user_id uuid not null,
  date date not null,
  sleep_latency_minutes numeric,
  deep_sleep_pct numeric,
  total_sleep_minutes numeric,
  hrv_evening numeric,
  resting_hr numeric,
  subjective_energy numeric,
  subjective_mood numeric,
  subjective_calm numeric,
  alcohol_flag boolean default false,
  late_caffeine_flag boolean default false,
  travel_flag boolean default false,
  illness_flag boolean default false,
  created_at timestamp with time zone default now(),
  unique (user_id, date)
);

-- 4) supplement_intake_days
create table if not exists supplement_intake_days (
  id bigserial primary key,
  user_id uuid not null,
  user_supplement_id uuid not null references user_supplement(id),
  date date not null,
  taken boolean not null default true,
  dose_fraction numeric default 1.0,
  created_at timestamp with time zone default now(),
  unique (user_id, user_supplement_id, date)
);

-- 5) supplement_truth_reports
create table if not exists supplement_truth_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  user_supplement_id uuid not null references user_supplement(id),
  canonical_id uuid references canonical_supplements(id),
  status text not null,
  primary_metric text not null,
  effect_direction text,
  effect_size numeric,
  absolute_change numeric,
  percent_change numeric,
  confidence_score numeric,
  sample_days_on int,
  sample_days_off int,
  days_excluded_confounds int,
  onset_days int,
  responder_percentile numeric,
  responder_label text,
  confounds text[],
  mechanism_inference text,
  biology_profile text,
  next_steps text,
  science_note text,
  raw_context jsonb,
  created_at timestamp with time zone default now()
);

-- 6) supplement_cohort_stats
create table if not exists supplement_cohort_stats (
  canonical_id uuid primary key references canonical_supplements(id),
  primary_metric text not null,
  effect_distribution jsonb not null,
  avg_effect numeric,
  median_effect numeric,
  responder_cutoffs jsonb,
  sample_size int not null,
  updated_at timestamp with time zone default now()
);




