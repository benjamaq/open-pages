-- Fix the upsert_daily_entry_and_snapshot function to properly capture supplements and protocols
-- This fixes the issue where day detail view shows empty arrays for supplements and protocols

CREATE OR REPLACE FUNCTION upsert_daily_entry_and_snapshot(
  p_user_id uuid,
  p_local_date date,
  p_mood smallint DEFAULT NULL,
  p_energy smallint DEFAULT NULL,
  p_sleep_quality smallint DEFAULT NULL,
  p_pain smallint DEFAULT NULL,
  p_sleep_hours numeric DEFAULT NULL,
  p_night_wakes smallint DEFAULT NULL,
  p_tags text[] DEFAULT NULL,
  p_journal text DEFAULT NULL
) RETURNS daily_entries
LANGUAGE plpgsql
AS $$
DECLARE
  v_meds jsonb := '[]'::jsonb;
  v_protocols jsonb := '[]'::jsonb;
  v_activity jsonb := '[]'::jsonb;
  v_devices jsonb := '[]'::jsonb;
  v_wearables jsonb := '{}'::jsonb;
  v_row daily_entries;
BEGIN
  -- Get active supplements/meds for this user on this date
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', s.id, 'name', s.name, 'type', 'supplement',
    'dose', s.dose, 'schedule', s.timing
  ) ORDER BY s.name), '[]'::jsonb)
  INTO v_meds
  FROM stack_items s
  JOIN profiles p ON p.id = s.profile_id
  WHERE p.user_id = p_user_id 
    AND (s.item_type = 'supplements' OR s.item_type IS NULL)
    AND s.created_at <= (p_local_date + INTERVAL '1 day')::timestamptz;

  -- Get active protocols for this user on this date
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', pr.id, 'name', pr.name, 'phase', 'active', 'notes', pr.notes
  ) ORDER BY pr.name), '[]'::jsonb)
  INTO v_protocols
  FROM protocols pr
  JOIN profiles p ON p.id = pr.profile_id
  WHERE p.user_id = p_user_id 
    AND pr.created_at <= (p_local_date + INTERVAL '1 day')::timestamptz;

  -- Get activity for this specific date (if we had activity logs)
  -- For now, just empty array
  v_activity := '[]'::jsonb;

  -- Get devices for this specific date (if we had device logs)
  -- For now, just empty array
  v_devices := '[]'::jsonb;

  -- Get wearables for this specific date (if we had wearable data)
  -- For now, just empty object
  v_wearables := '{}'::jsonb;

  -- Upsert the daily entry
  INSERT INTO daily_entries AS de (
    user_id, local_date, mood, energy, sleep_quality, pain, 
    sleep_hours, night_wakes, tags, journal,
    meds, protocols, activity, devices, wearables, updated_at
  ) VALUES (
    p_user_id, p_local_date, p_mood, p_energy, p_sleep_quality, p_pain,
    p_sleep_hours, p_night_wakes, p_tags, p_journal,
    v_meds, v_protocols, v_activity, v_devices, v_wearables, now()
  )
  ON CONFLICT (user_id, local_date)
  DO UPDATE SET
    mood = EXCLUDED.mood,
    energy = EXCLUDED.energy,
    sleep_quality = EXCLUDED.sleep_quality,
    pain = EXCLUDED.pain,
    sleep_hours = EXCLUDED.sleep_hours,
    night_wakes = EXCLUDED.night_wakes,
    tags = EXCLUDED.tags,
    journal = EXCLUDED.journal,
    meds = EXCLUDED.meds,
    protocols = EXCLUDED.protocols,
    activity = EXCLUDED.activity,
    devices = EXCLUDED.devices,
    wearables = EXCLUDED.wearables,
    updated_at = now()
  RETURNING * INTO v_row;

  RETURN v_row;
END $$;
