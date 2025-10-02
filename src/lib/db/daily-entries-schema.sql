-- Enhanced Daily Entries Schema for BioStackr
-- Run this in your Supabase SQL editor

-- Daily entries (single source of truth)
create table if not exists daily_entries (
  user_id uuid not null references auth.users(id) on delete cascade,
  local_date date not null,                        -- user's day in Europe/Copenhagen
  mood smallint check (mood between 0 and 10),
  sleep_quality smallint check (sleep_quality between 0 and 10),
  pain smallint check (pain between 0 and 10),
  sleep_hours numeric(3,1),                        -- optional self-report
  night_wakes smallint,                            -- optional
  tags text[],                                     -- array of chip slugs
  journal text,

  -- frozen point-in-time context
  meds jsonb not null default '[]'::jsonb,         -- [{id,name,type,dose,unit,schedule}]
  protocols jsonb not null default '[]'::jsonb,    -- [{id,name,phase,notes}]
  activity jsonb not null default '[]'::jsonb,     -- [{id,type,duration_min,notes}]
  devices jsonb not null default '[]'::jsonb,      -- [{id,device,dose,unit,duration_min,notes}]
  wearables jsonb not null default '{}'::jsonb,    -- {steps,sleep_min,hrv_rmssd,rhr,...}

  snapshot_version int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, local_date)
);

-- Enable RLS
alter table daily_entries enable row level security;
create policy "Users can view and update own daily_entries" on daily_entries
  for all using (auth.uid() = user_id);

-- Full text search over journal
create extension if not exists pg_trgm;         -- optional (fuzzy search)
create extension if not exists unaccent;

alter table daily_entries
add column if not exists journal_fts tsvector;

-- Maintain FTS column
create or replace function daily_entries_fts_refresh() returns trigger language plpgsql as $$
begin
  new.journal_fts :=
    to_tsvector('english', unaccent(coalesce(new.journal, '')));
  return new;
end $$;

drop trigger if exists trg_daily_entries_fts on daily_entries;
create trigger trg_daily_entries_fts
before insert or update of journal
on daily_entries
for each row execute function daily_entries_fts_refresh();

-- Indexes
create index if not exists idx_daily_entries_user_date
  on daily_entries(user_id, local_date desc);

create index if not exists idx_daily_entries_journal_fts
  on daily_entries using gin (journal_fts);

create index if not exists idx_daily_entries_meds_gin
  on daily_entries using gin (meds jsonb_path_ops);

create index if not exists idx_daily_entries_protocols_gin
  on daily_entries using gin (protocols jsonb_path_ops);

-- Snapshot upsert RPC
create or replace function upsert_daily_entry_and_snapshot(
  p_user_id uuid,
  p_local_date date,
  p_mood smallint default null,
  p_sleep_quality smallint default null,
  p_pain smallint default null,
  p_sleep_hours numeric(3,1) default null,
  p_night_wakes smallint default null,
  p_tags text[] default '{}'::text[],
  p_journal text default null
) returns daily_entries
language plpgsql
as $$
declare
  v_meds jsonb := '[]'::jsonb;
  v_protocols jsonb := '[]'::jsonb;
  v_activity jsonb := '[]'::jsonb;
  v_devices jsonb := '[]'::jsonb;
  v_wearables jsonb := '{}'::jsonb;
  v_row daily_entries;
begin
  -- Fetch active meds/supplements (replace with your actual table/logic)
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', m.id, 'name', m.name, 'type', m.item_type,
    'dose', m.dose, 'timing', m.timing, 'brand', m.brand
  ) order by m.name), '[]'::jsonb)
  into v_meds
  from stack_items m
  where m.profile_id = (select id from profiles where user_id = p_user_id)
    and m.item_type = 'supplements'
    and m.public = true; -- Use public flag instead of is_active

  -- Fetch active protocols (replace with your actual table/logic)
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', pr.id, 'name', pr.name, 'frequency', pr.frequency, 'details', pr.details
  ) order by pr.name), '[]'::jsonb)
  into v_protocols
  from protocols pr
  where pr.profile_id = (select id from profiles where user_id = p_user_id)
    and pr.public = true; -- Use public flag instead of is_active

  -- Fetch activity for the day (replace with your actual table/logic)
  -- For now, we'll use a simplified approach since stack_items doesn't have duration_min or local_date
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', a.id, 'name', a.name, 'timing', a.timing, 'notes', a.notes
  ) order by a.name), '[]'::jsonb)
  into v_activity
  from stack_items a
  where a.profile_id = (select id from profiles where user_id = p_user_id)
    and a.item_type = 'movement'
    and a.public = true; -- Use public flag instead of local_date filtering

  -- Devices (placeholder - replace with your actual table/logic)
  -- select coalesce(jsonb_agg(jsonb_build_object(
  --   'id', d.id, 'device', d.device, 'dose', d.dose, 'unit', d.unit,
  --   'duration_min', d.duration_min, 'notes', d.notes
  -- ) order by d.occurred_at), '[]'::jsonb)
  -- into v_devices
  -- from device_logs d
  -- where d.user_id = p_user_id and d.local_date = p_local_date;

  -- Wearables (placeholder - replace with your actual table/logic)
  -- select coalesce(jsonb_build_object(
  --   'steps', w.steps, 'sleep_min', w.sleep_min,
  --   'hrv_rmssd', w.hrv_rmssd, 'rhr', w.rhr
  -- ), '{}'::jsonb)
  -- into v_wearables
  -- from wearable_daily w
  -- where w.user_id = p_user_id and w.local_date = p_local_date;

  -- upsert (also refresh FTS via trigger)
  insert into daily_entries as de (
    user_id, local_date, mood, sleep_quality, pain, sleep_hours, night_wakes, tags, journal,
    meds, protocols, activity, devices, wearables, updated_at
  ) values (
    p_user_id, p_local_date, p_mood, p_sleep_quality, p_pain, p_sleep_hours, p_night_wakes, p_tags, p_journal,
    v_meds, v_protocols, v_activity, v_devices, v_wearables, now()
  )
  on conflict (user_id, local_date)
  do update set
    mood = coalesce(excluded.mood, de.mood),
    sleep_quality = coalesce(excluded.sleep_quality, de.sleep_quality),
    pain = coalesce(excluded.pain, de.pain),
    sleep_hours = coalesce(excluded.sleep_hours, de.sleep_hours),
    night_wakes = coalesce(excluded.night_wakes, de.night_wakes),
    tags = coalesce(excluded.tags, de.tags),
    journal = coalesce(excluded.journal, de.journal),
    meds = excluded.meds,
    protocols = excluded.protocols,
    activity = excluded.activity,
    devices = excluded.devices,
    wearables = excluded.wearables,
    updated_at = now()
  returning * into v_row;

  return v_row;
end;
$$;
