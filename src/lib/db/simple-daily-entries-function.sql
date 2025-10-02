-- Simple version of the daily entries function
-- This creates the function without complex snapshot logic

-- Drop any existing functions first
DROP FUNCTION IF EXISTS public.upsert_daily_entry_and_snapshot(uuid, date, smallint, smallint, smallint, smallint, text[], text, text[]);
DROP FUNCTION IF EXISTS public.upsert_daily_entry_and_snapshot(uuid, date, smallint, smallint, smallint, numeric, smallint, text[], text, text[]);

-- Create the simple function
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
begin
  -- Insert or update the daily entry
  insert into daily_entries as de (
    user_id, local_date, mood, sleep_quality, pain, night_wakes, tags, journal,
    meds, protocols, activity, devices, wearables, updated_at
  ) values (
    p_user_id, p_local_date, p_mood, p_sleep_quality, p_pain, p_night_wakes, p_tags, p_journal,
    '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, now()
  )
  on conflict (user_id, local_date)
  do update set
    mood = coalesce(excluded.mood, de.mood),
    sleep_quality = coalesce(excluded.sleep_quality, de.sleep_quality),
    pain = coalesce(excluded.pain, de.pain),
    night_wakes = coalesce(excluded.night_wakes, de.night_wakes),
    tags = coalesce(excluded.tags, de.tags),
    journal = coalesce(excluded.journal, de.journal),
    updated_at = now()
  returning * into v_row;

  return v_row;
end;
$$;
