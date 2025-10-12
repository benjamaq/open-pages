-- ABSOLUTE FIX: Query and drop each function version individually
-- This will handle the duplicate function issue properly

DO $$ 
DECLARE
    func_oid oid;
BEGIN
    -- Find and drop each version of the function
    FOR func_oid IN 
        SELECT oid 
        FROM pg_proc 
        WHERE proname = 'upsert_daily_entry_and_snapshot'
          AND pg_function_is_visible(oid)
    LOOP
        EXECUTE format('DROP FUNCTION %s CASCADE', func_oid::regprocedure);
    END LOOP;
END $$;

-- Add missing columns to daily_entries table
ALTER TABLE daily_entries ADD COLUMN IF NOT EXISTS symptoms TEXT[] DEFAULT '{}'::TEXT[];
ALTER TABLE daily_entries ADD COLUMN IF NOT EXISTS pain_locations TEXT[] DEFAULT '{}'::TEXT[];
ALTER TABLE daily_entries ADD COLUMN IF NOT EXISTS pain_types TEXT[] DEFAULT '{}'::TEXT[];
ALTER TABLE daily_entries ADD COLUMN IF NOT EXISTS custom_symptoms TEXT[] DEFAULT '{}'::TEXT[];

-- Create the ONE correct function
CREATE FUNCTION upsert_daily_entry_and_snapshot(
  p_user_id uuid,
  p_local_date date,
  p_mood smallint DEFAULT NULL,
  p_sleep_quality smallint DEFAULT NULL,
  p_pain smallint DEFAULT NULL,
  p_sleep_hours numeric DEFAULT NULL,
  p_night_wakes smallint DEFAULT NULL,
  p_tags text[] DEFAULT NULL,
  p_journal text DEFAULT NULL,
  p_symptoms text[] DEFAULT '{}'::text[],
  p_pain_locations text[] DEFAULT '{}'::text[],
  p_pain_types text[] DEFAULT '{}'::text[],
  p_custom_symptoms text[] DEFAULT '{}'::text[],
  p_completed_items text[] DEFAULT NULL,
  p_wearables jsonb DEFAULT NULL
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
  -- Get active supplements/meds
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', s.id, 
    'name', s.name, 
    'type', 'supplement',
    'dose', s.dose, 
    'schedule', s.timing
  ) ORDER BY s.name), '[]'::jsonb)
  INTO v_meds
  FROM stack_items s
  JOIN profiles p ON p.id = s.profile_id
  WHERE p.user_id = p_user_id 
    AND (s.item_type = 'supplements' OR s.item_type IS NULL)
    AND s.created_at <= (p_local_date + INTERVAL '1 day')::timestamptz;

  -- Get active protocols
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', pr.id, 
    'name', pr.name
  ) ORDER BY pr.name), '[]'::jsonb)
  INTO v_protocols
  FROM protocols pr
  JOIN profiles p ON p.id = pr.profile_id
  WHERE p.user_id = p_user_id 
    AND pr.created_at <= (p_local_date + INTERVAL '1 day')::timestamptz;

  -- Empty snapshots
  v_activity := '[]'::jsonb;
  v_devices := '[]'::jsonb;

  -- Handle wearables
  IF p_wearables IS NOT NULL THEN
    v_wearables := p_wearables;
  ELSE
    v_wearables := '{}'::jsonb;
  END IF;

  -- Upsert the entry
  INSERT INTO daily_entries AS de (
    user_id, local_date, mood, sleep_quality, pain, 
    sleep_hours, night_wakes, tags, journal, 
    symptoms, pain_locations, pain_types, custom_symptoms,
    meds, protocols, activity, devices, wearables, updated_at
  ) VALUES (
    p_user_id, p_local_date, p_mood, p_sleep_quality, p_pain,
    p_sleep_hours, p_night_wakes, p_tags, p_journal, 
    p_symptoms, p_pain_locations, p_pain_types, p_custom_symptoms,
    v_meds, v_protocols, v_activity, v_devices, v_wearables, now()
  )
  ON CONFLICT (user_id, local_date)
  DO UPDATE SET
    mood = EXCLUDED.mood,
    sleep_quality = EXCLUDED.sleep_quality,
    pain = EXCLUDED.pain,
    sleep_hours = EXCLUDED.sleep_hours,
    night_wakes = EXCLUDED.night_wakes,
    tags = EXCLUDED.tags,
    journal = EXCLUDED.journal,
    symptoms = EXCLUDED.symptoms,
    pain_locations = EXCLUDED.pain_locations,
    pain_types = EXCLUDED.pain_types,
    custom_symptoms = EXCLUDED.custom_symptoms,
    meds = EXCLUDED.meds,
    protocols = EXCLUDED.protocols,
    activity = EXCLUDED.activity,
    devices = EXCLUDED.devices,
    wearables = EXCLUDED.wearables,
    updated_at = now()
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

