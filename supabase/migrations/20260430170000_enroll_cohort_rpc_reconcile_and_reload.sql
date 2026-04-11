-- Reconcile: ensure enroll_cohort_applied_participant_atomic exists on hosts where 20260412120000
-- was never applied, and refresh PostgREST schema cache so rpc() resolves the function.
-- Idempotent: CREATE OR REPLACE + GRANT + NOTIFY.

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
BEGIN
  IF p_profile_id IS NULL THEN
    RAISE EXCEPTION 'PROFILE_ID_REQUIRED';
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

  IF v_cohort.display_capacity IS NOT NULL AND v_cohort.display_capacity >= 1 THEN
    v_cap := v_cohort.display_capacity::integer;

    SELECT count(*)::integer    INTO v_pipeline
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
    p_profile_id,
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
  'SERIALIZABLE enrollment: FOR UPDATE cohort row, optional display_capacity vs pipeline (applied+confirmed), insert applied row. Trigger still enforces max_participants.';

REVOKE ALL ON FUNCTION public.enroll_cohort_applied_participant_atomic(text, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.enroll_cohort_applied_participant_atomic(text, uuid, text) TO service_role;

SELECT pg_notify('pgrst', 'reload schema');
