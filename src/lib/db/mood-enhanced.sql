-- Enhanced mood tracking schema with context tags and better structure
-- This replaces the previous mood_entries table with a more comprehensive daily_entries table

-- Drop the old table if it exists
DROP TABLE IF EXISTS mood_entries CASCADE;

-- Create the new daily_entries table
CREATE TABLE IF NOT EXISTS daily_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  local_date date NOT NULL,                        -- user's day in their timezone
  mood smallint CHECK (mood BETWEEN 1 AND 5),
  energy smallint CHECK (energy BETWEEN 1 AND 5),
  sleep_quality smallint CHECK (sleep_quality BETWEEN 1 AND 5),
  pain smallint CHECK (pain BETWEEN 0 AND 10),
  sleep_hours numeric(3,1),                        -- optional self-report
  night_wakes smallint,                            -- optional
  tags text[],                                     -- array of context tags
  journal text,                                    -- free text notes
  
  -- frozen point-in-time context (snapshot of what was active that day)
  meds jsonb NOT NULL DEFAULT '[]'::jsonb,         -- [{id,name,type,dose,unit,schedule}]
  protocols jsonb NOT NULL DEFAULT '[]'::jsonb,    -- [{id,name,phase,notes}]
  activity jsonb NOT NULL DEFAULT '[]'::jsonb,     -- [{id,type,duration_min,notes}]
  devices jsonb NOT NULL DEFAULT '[]'::jsonb,      -- [{id,device,dose,unit,duration_min,notes}]
  wearables jsonb NOT NULL DEFAULT '{}'::jsonb,    -- {steps,sleep_min,hrv_rmssd,rhr,...}
  
  snapshot_version int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, local_date)
);

-- Enable full text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Add FTS column
ALTER TABLE daily_entries
ADD COLUMN IF NOT EXISTS journal_fts tsvector;

-- Create function to maintain FTS column
CREATE OR REPLACE FUNCTION daily_entries_fts_refresh() 
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.journal_fts := to_tsvector('english', unaccent(COALESCE(NEW.journal, '')));
  RETURN NEW;
END $$;

-- Create trigger for FTS
DROP TRIGGER IF EXISTS trg_daily_entries_fts ON daily_entries;
CREATE TRIGGER trg_daily_entries_fts
  BEFORE INSERT OR UPDATE OF journal
  ON daily_entries
  FOR EACH ROW EXECUTE FUNCTION daily_entries_fts_refresh();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_daily_entries_user_date 
  ON daily_entries(user_id, local_date DESC);

CREATE INDEX IF NOT EXISTS idx_daily_entries_journal_fts 
  ON daily_entries USING gin (journal_fts);

CREATE INDEX IF NOT EXISTS idx_daily_entries_tags_gin 
  ON daily_entries USING gin (tags);

CREATE INDEX IF NOT EXISTS idx_daily_entries_meds_gin 
  ON daily_entries USING gin (meds jsonb_path_ops);

CREATE INDEX IF NOT EXISTS idx_daily_entries_protocols_gin 
  ON daily_entries USING gin (protocols jsonb_path_ops);

-- Enable RLS
ALTER TABLE daily_entries ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own daily entries" ON daily_entries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily entries" ON daily_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily entries" ON daily_entries
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own daily entries" ON daily_entries
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to upsert daily entry with snapshot
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
    'dose', s.dose, 'unit', s.unit, 'schedule', s.timing
  ) ORDER BY s.name), '[]'::jsonb)
  INTO v_meds
  FROM stack_items s
  JOIN profiles p ON p.id = s.profile_id
  WHERE p.user_id = p_user_id 
    AND s.item_type = 'supplements'
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
END;
$$;

-- Create search function
CREATE OR REPLACE FUNCTION search_daily_entries(
  p_user_id uuid,
  p_query text DEFAULT NULL,
  p_tag text DEFAULT NULL,
  p_med_name text DEFAULT NULL,
  p_protocol_name text DEFAULT NULL,
  p_date_from date DEFAULT NULL,
  p_date_to date DEFAULT NULL,
  p_offset int DEFAULT 0,
  p_limit int DEFAULT 50
) RETURNS SETOF daily_entries
LANGUAGE sql
STABLE
AS $$
  WITH base AS (
    SELECT *
    FROM daily_entries de
    WHERE de.user_id = p_user_id
      AND (p_date_from IS NULL OR de.local_date >= p_date_from)
      AND (p_date_to IS NULL OR de.local_date <= p_date_to)
      AND (
        p_query IS NULL
        OR de.journal_fts @@ plainto_tsquery('english', unaccent(p_query))
      )
      AND (
        p_tag IS NULL
        OR de.tags @> ARRAY[p_tag]
      )
      AND (
        p_med_name IS NULL
        OR EXISTS (
          SELECT 1
          FROM jsonb_array_elements(de.meds) x
          WHERE (x->>'name') ILIKE p_med_name
        )
      )
      AND (
        p_protocol_name IS NULL
        OR EXISTS (
          SELECT 1
          FROM jsonb_array_elements(de.protocols) x
          WHERE (x->>'name') ILIKE p_protocol_name
        )
      )
  )
  SELECT *
  FROM base
  ORDER BY local_date DESC
  OFFSET GREATEST(p_offset, 0)
  LIMIT LEAST(p_limit, 200);
$$;
