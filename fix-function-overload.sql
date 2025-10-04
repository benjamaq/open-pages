-- Fix function overloading conflict for upsert_daily_entry_and_snapshot
-- This resolves the "Could not choose the best candidate function" error

-- Drop all existing versions of the function
DROP FUNCTION IF EXISTS public.upsert_daily_entry_and_snapshot(uuid, date, smallint, smallint, smallint, smallint, text[], text, text[]);
DROP FUNCTION IF EXISTS public.upsert_daily_entry_and_snapshot(uuid, date, smallint, smallint, smallint, numeric, smallint, text[], text, text[]);
DROP FUNCTION IF EXISTS public.upsert_daily_entry_and_snapshot(text[], text, date, smallint, smallint, smallint, text[], uuid);

-- Create a single, definitive version with all parameters
CREATE OR REPLACE FUNCTION public.upsert_daily_entry_and_snapshot(
  p_user_id uuid,
  p_local_date date,
  p_mood smallint DEFAULT NULL,
  p_sleep_quality smallint DEFAULT NULL,
  p_pain smallint DEFAULT NULL,
  p_sleep_hours numeric(3,1) DEFAULT NULL,
  p_night_wakes smallint DEFAULT NULL,
  p_tags text[] DEFAULT '{}'::text[],
  p_journal text DEFAULT NULL,
  p_completed_items text[] DEFAULT '{}'::text[]
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_snapshot jsonb := '{}'::jsonb;
  v_item record;
  v_supplements jsonb := '[]'::jsonb;
  v_protocols jsonb := '[]'::jsonb;
  v_movement jsonb := '[]'::jsonb;
  v_mindfulness jsonb := '[]'::jsonb;
  v_gear jsonb := '[]'::jsonb;
BEGIN
  -- Upsert the daily entry
  INSERT INTO daily_entries (
    user_id, local_date, mood, sleep_quality, pain, 
    sleep_hours, night_wakes, tags, journal
  ) VALUES (
    p_user_id, p_local_date, p_mood, p_sleep_quality, p_pain,
    p_sleep_hours, p_night_wakes, p_tags, p_journal
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
    updated_at = NOW();

  -- Build snapshot from completed items if provided
  -- Handle null or empty arrays gracefully
  IF p_completed_items IS NOT NULL AND array_length(p_completed_items, 1) > 0 THEN
    -- Get supplements from completed items
    FOR v_item IN
      SELECT si.*, p.display_name as profile_name
      FROM stack_items si
      JOIN profiles p ON p.id = si.profile_id
      WHERE p.user_id = p_user_id 
        AND si.item_type = 'supplement'
        AND si.id::text = ANY(p_completed_items)
    LOOP
      v_supplements := v_supplements || jsonb_build_object(
        'id', v_item.id,
        'name', v_item.name,
        'dosage', v_item.dosage,
        'profile_name', v_item.profile_name
      );
    END LOOP;

    -- Get protocols from completed items
    FOR v_item IN
      SELECT pr.*, p.display_name as profile_name
      FROM protocols pr
      JOIN profiles p ON p.id = pr.profile_id
      WHERE p.user_id = p_user_id 
        AND pr.id::text = ANY(p_completed_items)
    LOOP
      v_protocols := v_protocols || jsonb_build_object(
        'id', v_item.id,
        'name', v_item.name,
        'description', v_item.description,
        'profile_name', v_item.profile_name
      );
    END LOOP;

    -- Get movement from completed items
    FOR v_item IN
      SELECT si.*, p.display_name as profile_name
      FROM stack_items si
      JOIN profiles p ON p.id = si.profile_id
      WHERE p.user_id = p_user_id 
        AND si.item_type = 'movement'
        AND si.id::text = ANY(p_completed_items)
    LOOP
      v_movement := v_movement || jsonb_build_object(
        'id', v_item.id,
        'name', v_item.name,
        'description', v_item.description,
        'profile_name', v_item.profile_name
      );
    END LOOP;

    -- Get mindfulness from completed items
    FOR v_item IN
      SELECT si.*, p.display_name as profile_name
      FROM stack_items si
      JOIN profiles p ON p.id = si.profile_id
      WHERE p.user_id = p_user_id 
        AND si.item_type = 'mindfulness'
        AND si.id::text = ANY(p_completed_items)
    LOOP
      v_mindfulness := v_mindfulness || jsonb_build_object(
        'id', v_item.id,
        'name', v_item.name,
        'description', v_item.description,
        'profile_name', v_item.profile_name
      );
    END LOOP;

    -- Get gear from completed items
    FOR v_item IN
      SELECT si.*, p.display_name as profile_name
      FROM stack_items si
      JOIN profiles p ON p.id = si.profile_id
      WHERE p.user_id = p_user_id 
        AND si.item_type = 'gear'
        AND si.id::text = ANY(p_completed_items)
    LOOP
      v_gear := v_gear || jsonb_build_object(
        'id', v_item.id,
        'name', v_item.name,
        'description', v_item.description,
        'profile_name', v_item.profile_name
      );
    END LOOP;

    -- Build the complete snapshot
    v_snapshot := jsonb_build_object(
      'supplements', v_supplements,
      'protocols', v_protocols,
      'movement', v_movement,
      'mindfulness', v_mindfulness,
      'gear', v_gear,
      'completed_items', p_completed_items,
      'snapshot_date', p_local_date
    );
  END IF;

  -- Update the entry with the snapshot (always update, even if empty)
  UPDATE daily_entries 
  SET meds = COALESCE(v_supplements, '[]'::jsonb),
      protocols = COALESCE(v_protocols, '[]'::jsonb),
      activity = COALESCE(v_movement, '[]'::jsonb),
      devices = COALESCE(v_gear, '[]'::jsonb)
  WHERE user_id = p_user_id AND local_date = p_local_date;

  -- Return the entry data
  RETURN jsonb_build_object(
    'user_id', p_user_id,
    'local_date', p_local_date,
    'mood', p_mood,
    'sleep_quality', p_sleep_quality,
    'pain', p_pain,
    'sleep_hours', p_sleep_hours,
    'night_wakes', p_night_wakes,
    'tags', p_tags,
    'journal', p_journal,
    'actions_snapshot', v_snapshot
  );
END;
$$;
