-- Fix the daily entries function by dropping the old version and creating a clean one
-- This resolves the function conflict error

-- Drop the existing function to avoid conflicts
DROP FUNCTION IF EXISTS public.upsert_daily_entry_and_snapshot(uuid, date, smallint, smallint, smallint, smallint, text[], text, text[]);
DROP FUNCTION IF EXISTS public.upsert_daily_entry_and_snapshot(uuid, date, smallint, smallint, smallint, numeric, smallint, text[], text, text[]);

-- Create the clean function without sleep_hours parameter
CREATE OR REPLACE FUNCTION public.upsert_daily_entry_and_snapshot(
  p_user_id uuid,
  p_local_date date,
  p_mood smallint,
  p_sleep_quality smallint,
  p_pain smallint,
  p_night_wakes smallint,
  p_tags text[],
  p_journal text,
  p_completed_items text[]
)
RETURNS daily_entries
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
declare
  v_row daily_entries%rowtype;
  v_meds jsonb;
  v_protocols jsonb;
  v_activity jsonb;
  v_devices jsonb;
  v_wearables jsonb;
begin
  -- Get snapshot data for the given date
  select 
    coalesce(jsonb_agg(
      jsonb_build_object(
        'id', si.id,
        'name', si.name,
        'dose', si.dose,
        'unit', si.unit,
        'timing', si.timing,
        'category', si.category
      ) order by si.name
    ) filter (where si.id is not null), '[]'::jsonb) as meds,
    coalesce(jsonb_agg(
      jsonb_build_object(
        'id', pr.id,
        'name', pr.name,
        'description', pr.description,
        'duration', pr.duration,
        'category', pr.category
      ) order by pr.name
    ) filter (where pr.id is not null), '[]'::jsonb) as protocols,
    coalesce(jsonb_agg(
      jsonb_build_object(
        'id', ma.id,
        'name', ma.name,
        'duration', ma.duration,
        'intensity', ma.intensity,
        'category', ma.category
      ) order by ma.name
    ) filter (where ma.id is not null), '[]'::jsonb) as activity,
    coalesce(jsonb_agg(
      jsonb_build_object(
        'id', g.id,
        'name', g.name,
        'category', g.category,
        'status', g.status
      ) order by g.name
    ) filter (where g.id is not null), '[]'::jsonb) as devices,
    coalesce(jsonb_agg(
      jsonb_build_object(
        'id', w.id,
        'name', w.name,
        'category', w.category,
        'status', w.status
      ) order by w.name
    ) filter (where w.id is not null), '[]'::jsonb) as wearables
  into v_meds, v_protocols, v_activity, v_devices, v_wearables
  from (
    -- Get active supplements/medications for the date
    select si.id, si.name, si.dose, si.unit, si.timing, si.category
    from stack_items si
    where si.user_id = p_user_id
      and si.status = 'active'
      and (si.start_date is null or si.start_date <= p_local_date)
      and (si.end_date is null or si.end_date >= p_local_date)
      and si.category in ('supplement', 'medication')
      and exists (
        select 1 from unnest(p_completed_items) as completed_item
        where completed_item = si.id::text
      )
    
    union all
    
    -- Get active protocols for the date
    select pr.id, pr.name, pr.description, pr.duration, pr.category
    from protocols pr
    where pr.user_id = p_user_id
      and pr.status = 'active'
      and (pr.start_date is null or pr.start_date <= p_local_date)
      and (pr.end_date is null or pr.end_date >= p_local_date)
      and exists (
        select 1 from unnest(p_completed_items) as completed_item
        where completed_item = pr.id::text
      )
    
    union all
    
    -- Get completed activities for the date
    select ma.id, ma.name, ma.duration, ma.intensity, ma.category
    from movement_activities ma
    where ma.user_id = p_user_id
      and ma.status = 'active'
      and (ma.start_date is null or ma.start_date <= p_local_date)
      and (ma.end_date is null or ma.end_date >= p_local_date)
      and exists (
        select 1 from unnest(p_completed_items) as completed_item
        where completed_item = ma.id::text
      )
    
    union all
    
    -- Get active devices for the date
    select g.id, g.name, g.category, g.status
    from gear g
    where g.user_id = p_user_id
      and g.status = 'active'
      and (g.start_date is null or g.start_date <= p_local_date)
      and (g.end_date is null or g.end_date >= p_local_date)
      and exists (
        select 1 from unnest(p_completed_items) as completed_item
        where completed_item = g.id::text
      )
    
    union all
    
    -- Get active wearables for the date
    select w.id, w.name, w.category, w.status
    from wearables w
    where w.user_id = p_user_id
      and w.status = 'active'
      and (w.start_date is null or w.start_date <= p_local_date)
      and (w.end_date is null or w.end_date >= p_local_date)
      and exists (
        select 1 from unnest(p_completed_items) as completed_item
        where completed_item = w.id::text
      )
  ) as snapshot_data;

  -- Insert or update the daily entry
  insert into daily_entries as de (
    user_id, local_date, mood, sleep_quality, pain, night_wakes, tags, journal,
    meds, protocols, activity, devices, wearables, updated_at
  ) values (
    p_user_id, p_local_date, p_mood, p_sleep_quality, p_pain, p_night_wakes, p_tags, p_journal,
    v_meds, v_protocols, v_activity, v_devices, v_wearables, now()
  )
  on conflict (user_id, local_date)
  do update set
    mood = coalesce(excluded.mood, de.mood),
    sleep_quality = coalesce(excluded.sleep_quality, de.sleep_quality),
    pain = coalesce(excluded.pain, de.pain),
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
