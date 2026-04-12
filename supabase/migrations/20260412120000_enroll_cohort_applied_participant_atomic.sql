-- Atomic enrollment: lock cohort, enforce max_participants vs applied+confirmed pipeline, insert one row.
-- display_capacity is UI-only (study hero urgency) and must not be used here.
-- Later migrations may replace this function; 20260430200000_enroll_cohort_atomic_cap_max_participants_only.sql
-- reapplies this rule if superseded.
-- max_participants trigger (trg_enforce_cohort_pipeline_capacity) unchanged as backstop.

CREATE OR REPLACE FUNCTION public.enroll_cohort_applied_participant_atomic(
  p_cohort_slug text,
  p_profile_id uuid,
  p_qualification_response text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cohort public.cohorts%ROWTYPE;
  v_cap integer;
  v_pipeline integer;
  v_new_id uuid;
  v_auth_user_id uuid;
BEGIN
  IF p_profile_id IS NULL THEN
    RAISE EXCEPTION 'PROFILE_ID_REQUIRED';
  END IF;

  SELECT p.user_id
  INTO v_auth_user_id
  FROM public.profiles p
  WHERE p.id = p_profile_id;

  IF v_auth_user_id IS NULL THEN
    RAISE EXCEPTION 'PROFILE_NOT_FOUND';
  END IF;

  SELECT c.*
  INTO v_cohort
  FROM public.cohorts c
  WHERE lower(trim(c.slug)) = lower(trim(p_cohort_slug))
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'COHORT_NOT_FOUND';
  END IF;

  IF lower(trim(v_cohort.status)) IS DISTINCT FROM 'active' THEN
    RAISE EXCEPTION 'COHORT_INACTIVE';
  END IF;

  -- Operational cap: max_participants only. display_capacity is ignored.
  IF v_cohort.max_participants IS NOT NULL AND v_cohort.max_participants >= 1 THEN
    v_cap := v_cohort.max_participants::integer;

    SELECT count(*)::integer INTO v_pipeline
    FROM public.cohort_participants cp
    WHERE cp.cohort_id::text = v_cohort.id::text
      AND cp.status IN ('applied', 'confirmed');

    IF v_pipeline >= v_cap THEN
      RAISE EXCEPTION 'Study is full';
    END IF;
  END IF;

  INSERT INTO public.cohort_participants (
    cohort_id,
    user_id,
    status,
    enrolled_at,
    currently_taking_product,
    qualification_response
  )
  VALUES (
    v_cohort.id,
    v_auth_user_id,
    'applied',
    now(),
    false,
    NULLIF(trim(COALESCE(p_qualification_response, '')), '')
  )
  RETURNING id INTO v_new_id;

  RETURN v_new_id;
END;
$$;

COMMENT ON FUNCTION public.enroll_cohort_applied_participant_atomic(text, uuid, text) IS
  'SERIALIZABLE enrollment: FOR UPDATE cohort row; pipeline (applied+confirmed) capped by cohorts.max_participants only. display_capacity is UI-only.';

REVOKE ALL ON FUNCTION public.enroll_cohort_applied_participant_atomic(text, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.enroll_cohort_applied_participant_atomic(text, uuid, text) TO service_role;
