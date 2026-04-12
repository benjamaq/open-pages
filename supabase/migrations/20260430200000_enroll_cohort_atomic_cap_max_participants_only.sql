-- enroll_cohort_applied_participant_atomic must cap pipeline (applied+confirmed) against
-- cohorts.max_participants only. display_capacity is UI-only and must not gate enrollment.
-- (Earlier migrations 20260430170000 / 20260430180000 incorrectly used display_capacity again.)

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

  -- Operational cap: max_participants only (matches trg_enforce_cohort_pipeline_capacity).
  -- display_capacity is not read here.
  IF v_cohort.max_participants IS NOT NULL AND v_cohort.max_participants >= 1 THEN
    v_cap := v_cohort.max_participants::integer;

    SELECT count(*)::integer INTO v_pipeline
    FROM public.cohort_participants cp
    WHERE cp.cohort_id = v_cohort.id
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
  'SERIALIZABLE enrollment: FOR UPDATE cohort row; pipeline (applied+confirmed) capped by cohorts.max_participants only. display_capacity is UI-only and ignored here. Trigger trg_enforce_cohort_pipeline_capacity remains backstop.';

REVOKE ALL ON FUNCTION public.enroll_cohort_applied_participant_atomic(text, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.enroll_cohort_applied_participant_atomic(text, uuid, text) TO service_role;

SELECT pg_notify('pgrst', 'reload schema');
