-- Update the upsert_daily_entry_and_snapshot function to properly handle completed items
CREATE OR REPLACE FUNCTION public.upsert_daily_entry_and_snapshot(
  p_user_id uuid,
  p_local_date date,
  p_mood smallint default null,
  p_sleep_quality smallint default null,
  p_pain smallint default null,
  p_night_wakes smallint default null,
  p_tags text[] default '{}'::text[],
  p_journal text default null,
  p_completed_items text[] default null
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
  -- Fetch completed supplements/meds for the day
  if p_completed_items is not null then
    select coalesce(jsonb_agg(jsonb_build_object(
      'id', m.id, 'name', m.name, 'type', m.item_type,
      'dose', m.dose, 'timing', m.timing, 'brand', m.brand
    ) order by m.name), '[]'::jsonb)
    into v_meds
    from stack_items m
    where m.profile_id = (select id from profiles where user_id = p_user_id)
      and m.item_type = 'supplements'
      and ('supplement-' || m.id::text) = any(p_completed_items);
  end if;

  -- Fetch completed protocols for the day
  if p_completed_items is not null then
    select coalesce(jsonb_agg(jsonb_build_object(
      'id', pr.id, 'name', pr.name, 'type', pr.protocol_type,
      'description', pr.description, 'duration', pr.duration
    ) order by pr.name), '[]'::jsonb)
    into v_protocols
    from protocols pr
    where pr.profile_id = (select id from profiles where user_id = p_user_id)
      and ('protocol-' || pr.id::text) = any(p_completed_items);
  end if;

  -- Fetch completed activity for the day
  if p_completed_items is not null then
    select coalesce(jsonb_agg(jsonb_build_object(
      'id', a.id, 'name', a.name, 'type', a.item_type,
      'duration', a.duration, 'intensity', a.intensity
    ) order by a.name), '[]'::jsonb)
    into v_activity
    from stack_items a
    where a.profile_id = (select id from profiles where user_id = p_user_id)
      and a.item_type = 'movement'
      and ('movement-' || a.id::text) = any(p_completed_items);
  end if;

  -- Upsert the daily entry
  insert into daily_entries (
    user_id, local_date, mood, sleep_quality, pain, night_wakes, 
    tags, journal, meds_snapshot, protocols_snapshot, activity_snapshot, 
    devices_snapshot, wearables_snapshot
  ) values (
    p_user_id, p_local_date, p_mood, p_sleep_quality, p_pain, p_night_wakes,
    p_tags, p_journal, v_meds, v_protocols, v_activity, v_devices, v_wearables
  )
  on conflict (user_id, local_date) 
  do update set
    mood = excluded.mood,
    sleep_quality = excluded.sleep_quality,
    pain = excluded.pain,
    night_wakes = excluded.night_wakes,
    tags = excluded.tags,
    journal = excluded.journal,
    meds_snapshot = excluded.meds_snapshot,
    protocols_snapshot = excluded.protocols_snapshot,
    activity_snapshot = excluded.activity_snapshot,
    devices_snapshot = excluded.devices_snapshot,
    wearables_snapshot = excluded.wearables_snapshot,
    updated_at = now()
  returning * into v_row;

  return v_row;
end;
$$;
