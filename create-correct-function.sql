-- Create the correct upsert_daily_entry_and_snapshot function
-- This will fix the mood chips persistence issue

-- First, drop any existing versions
DROP FUNCTION IF EXISTS upsert_daily_entry_and_snapshot CASCADE;

-- Create the daily_entries table if it doesn't exist
CREATE TABLE IF NOT EXISTS daily_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  local_date date NOT NULL,
  mood smallint CHECK (mood BETWEEN 1 AND 10),
  sleep_quality smallint CHECK (sleep_quality BETWEEN 1 AND 10),
  pain smallint CHECK (pain BETWEEN 0 AND 10),
  sleep_hours numeric(3,1),
  night_wakes smallint,
  tags text[],
  journal text,
  symptoms text[] DEFAULT '{}'::text[],
  pain_locations text[] DEFAULT '{}'::text[],
  pain_types text[] DEFAULT '{}'::text[],
  custom_symptoms text[] DEFAULT '{}'::text[],
  meds jsonb NOT NULL DEFAULT '[]'::jsonb,
  protocols jsonb NOT NULL DEFAULT '[]'::jsonb,
  activity jsonb NOT NULL DEFAULT '[]'::jsonb,
  devices jsonb NOT NULL DEFAULT '[]'::jsonb,
  wearables jsonb NOT NULL DEFAULT '{}'::jsonb,
  snapshot_version int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, local_date)
);

-- Create the function with the correct signature
CREATE OR REPLACE FUNCTION upsert_daily_entry_and_snapshot(
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
  p_wearables jsonb DEFAULT '{}'::jsonb
) RETURNS daily_entries
LANGUAGE plpgsql
AS $$
DECLARE
  v_meds jsonb := '[]'::jsonb;
  v_protocols jsonb := '[]'::jsonb;
  v_activity jsonb := '[]'::jsonb;
  v_devices jsonb := '[]'::jsonb;
  v_wearables jsonb := COALESCE(p_wearables, '{}'::jsonb);
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
    'id', pr.id, 'name', pr.name, 'phase', 'active'
  ) ORDER BY pr.name), '[]'::jsonb)
  INTO v_protocols
  FROM protocols pr
  JOIN profiles p ON p.id = pr.profile_id
  WHERE p.user_id = p_user_id 
    AND pr.created_at <= (p_local_date + INTERVAL '1 day')::timestamptz;

  -- Upsert the daily entry
  INSERT INTO daily_entries AS de (
    user_id, local_date, mood, sleep_quality, pain, 
    sleep_hours, night_wakes, tags, journal, symptoms, pain_locations, pain_types, custom_symptoms,
    meds, protocols, activity, devices, wearables, updated_at
  ) VALUES (
    p_user_id, p_local_date, p_mood, p_sleep_quality, p_pain,
    p_sleep_hours, p_night_wakes, p_tags, p_journal, p_symptoms, p_pain_locations, p_pain_types, p_custom_symptoms,
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

-- Test the function
SELECT upsert_daily_entry_and_snapshot(
  'c1b5662e-73dd-48b1-a5d8-ec0d1a648415'::uuid,
  '2025-10-12'::date,
  7, -- mood
  8, -- sleep_quality  
  3, -- pain
  NULL, -- sleep_hours
  NULL, -- night_wakes
  ARRAY['on_top_world', 'solid_baseline', 'foggy']::text[], -- expressive mood chips
  'Test with expressive mood chips',
  ARRAY[]::text[], -- symptoms
  ARRAY[]::text[], -- pain_locations
  ARRAY[]::text[], -- pain_types
  ARRAY[]::text[], -- custom_symptoms
  NULL, -- completed_items
  '{}'::jsonb -- wearables
);

-- Verify the test worked
SELECT 
  user_id, 
  local_date, 
  tags,
  mood,
  sleep_quality,
  pain,
  journal
FROM daily_entries 
WHERE user_id = 'c1b5662e-73dd-48b1-a5d8-ec0d1a648415'
  AND local_date = '2025-10-12';
