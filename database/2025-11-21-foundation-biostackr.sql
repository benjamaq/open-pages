-- BioStackr Foundation Schema (new system)
-- Run in Supabase SQL Editor
-- Notes:
-- - Creates enums, tables, indexes
-- - Enables RLS with basic own-row policies
-- - Adds trigger to auto-create app_user from auth.users
-- - Adds monthly_cost_usd to user_supplement

-- Prereqs
create extension if not exists pgcrypto;

-- Enums
do $$
begin
  if not exists (select 1 from pg_type where typname = 'truth_stage') then
    create type truth_stage as enum (
      'HYPOTHESIS','EARLY_SIGNAL','VALIDATING_POSITIVE','VALIDATING_NEGATIVE',
      'PROVEN_BENEFICIAL','PROVEN_NEUTRAL','PROVEN_HARMFUL'
    );
  end if;
end$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'test_kind') then
    create type test_kind as enum ('timing','removal','dose','synergy');
  end if;
end$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'test_state') then
    create type test_state as enum ('planned','active','paused','completed','cancelled');
  end if;
end$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'rec_type') then
    create type rec_type as enum ('checkin','finish_active_test','start_removal','start_timing','start_dose','start_synergy');
  end if;
end$$;

-- USERS & TIME
create table if not exists app_user (
  id uuid primary key default gen_random_uuid(),
  tz text not null default 'UTC'
);

create table if not exists checkin (
  id bigserial primary key,
  user_id uuid not null references app_user(id),
  day date not null,
  mood int check (mood between 1 and 5),
  energy int check (energy between 1 and 5),
  focus int check (focus between 1 and 5),
  created_at timestamptz not null default now(),
  unique (user_id, day)
);
create index if not exists checkin_user_day_idx on checkin(user_id, day);

create table if not exists wearable_sync (
  id bigserial primary key,
  user_id uuid not null references app_user(id),
  synced_at timestamptz not null default now(),
  source text not null,
  ok boolean not null default true
);
create index if not exists wearable_sync_user_syncedat_idx on wearable_sync(user_id, synced_at desc);

-- SUPPLEMENTS & EFFECTS
create table if not exists supplement (
  id uuid primary key default gen_random_uuid(),
  canonical_name text not null,
  synonyms text[] default '{}'
);
-- Ensure unique canonical name to support idempotent seed upserts
do $$
begin
  if not exists (
    select 1
    from pg_indexes
    where schemaname = 'public' and indexname = 'supplement_canonical_name_key'
  ) then
    alter table supplement add constraint supplement_canonical_name_key unique (canonical_name);
  end if;
end$$;

create table if not exists user_supplement (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_user(id),
  supplement_id uuid not null references supplement(id),
  label text,
  start_window text,
  inferred_start_at date,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  monthly_cost_usd numeric default 0,
  unique(user_id, supplement_id)
);
create index if not exists user_supplement_user_idx on user_supplement(user_id);

-- Per-user effect summary (latest compute)
create table if not exists effect_summary (
  id bigserial primary key,
  user_id uuid not null references app_user(id),
  user_supplement_id uuid not null references user_supplement(id) on delete cascade,
  stage truth_stage not null,
  effect_size numeric,
  confidence numeric,
  trend text,
  metrics jsonb,
  is_stack boolean not null default false,
  stack_members uuid[] default null,
  computed_at timestamptz not null default now(),
  unique (user_id, user_supplement_id)
);
create index if not exists effect_summary_user_idx on effect_summary(user_id);
create index if not exists effect_summary_stage_idx on effect_summary(user_id, stage);

-- VALIDATION TESTS (experiments)
create table if not exists validation_test (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_user(id),
  kind test_kind not null,
  state test_state not null default 'planned',
  user_supplement_ids uuid[] not null,
  days_planned int not null check (days_planned in (7,14,21,28)),
  started_at date,
  completed_days int not null default 0,
  adherence numeric default 0,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists validation_test_user_state_idx on validation_test(user_id, state);

-- INSIGHTS + RECOMMENDATION QUEUE
create table if not exists insight (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_user(id),
  text text not null,
  confidence numeric not null,
  confidence_source text,
  related_user_supplement_ids uuid[],
  created_at timestamptz not null default now()
);
create index if not exists insight_user_created_idx on insight(user_id, created_at desc);

create table if not exists recommendation (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_user(id),
  rec rec_type not null,
  priority_score numeric not null,
  reason text not null,
  action_payload jsonb,
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  acknowledged_at timestamptz
);
create index if not exists recommendation_user_created_idx on recommendation(user_id, created_at desc);

-- RLS: Enable
alter table app_user enable row level security;
alter table checkin enable row level security;
alter table user_supplement enable row level security;
alter table effect_summary enable row level security;
alter table validation_test enable row level security;
alter table insight enable row level security;
alter table recommendation enable row level security;
alter table supplement enable row level security;

-- RLS: Basic policies
-- app_user: users can read their own row
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='app_user' and policyname='Users can view own data') then
    create policy "Users can view own data" on app_user
      for select using (auth.uid() = id);
  end if;
end$$;

-- checkin: own-row access for all operations
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='checkin' and policyname='Users can view own checkins') then
    create policy "Users can view own checkins" on checkin
      for all using (auth.uid() = user_id);
  end if;
end$$;

-- user_supplement: own-row access for all operations
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='user_supplement' and policyname='Users can view own supplements') then
    create policy "Users can view own supplements" on user_supplement
      for all using (auth.uid() = user_id);
  end if;
end$$;

-- effect_summary: read-only own rows
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='effect_summary' and policyname='Users can view own effects') then
    create policy "Users can view own effects" on effect_summary
      for select using (auth.uid() = user_id);
  end if;
end$$;

-- validation_test: own-row access for all operations
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='validation_test' and policyname='Users can view own tests') then
    create policy "Users can view own tests" on validation_test
      for all using (auth.uid() = user_id);
  end if;
end$$;

-- insight: read-only own rows
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='insight' and policyname='Users can view own insights') then
    create policy "Users can view own insights" on insight
      for select using (auth.uid() = user_id);
  end if;
end$$;

-- recommendation: own-row access for all operations
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='recommendation' and policyname='Users can view own recommendations') then
    create policy "Users can view own recommendations" on recommendation
      for all using (auth.uid() = user_id);
  end if;
end$$;

-- supplement: public read
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='supplement' and policyname='Anyone can view supplements') then
    create policy "Anyone can view supplements" on supplement
      for select using (true);
  end if;
end$$;

-- Trigger to auto-create app_user row on auth.users signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.app_user (id, tz)
  values (new.id, 'UTC')
  on conflict (id) do nothing;
  return new;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'on_auth_user_created'
  ) then
    create trigger on_auth_user_created
      after insert on auth.users
      for each row execute function public.handle_new_user();
  end if;
end$$;






