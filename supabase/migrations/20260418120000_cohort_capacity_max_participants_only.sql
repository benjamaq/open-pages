-- Hard enrollment cap must use max_participants only. display_capacity is for landing-page / marketing math only.
CREATE OR REPLACE FUNCTION public.trg_enforce_cohort_pipeline_capacity()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  cap integer;
  pipeline integer;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status IS NULL OR NEW.status NOT IN ('applied', 'confirmed') THEN
      RETURN NEW;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status IN ('applied', 'confirmed') AND OLD.status IN ('applied', 'confirmed') THEN
      RETURN NEW;
    END IF;
    IF NEW.status IS NULL OR NEW.status NOT IN ('applied', 'confirmed') THEN
      RETURN NEW;
    END IF;
  ELSE
    RETURN NEW;
  END IF;

  SELECT c.max_participants::integer INTO cap
  FROM public.cohorts c
  WHERE c.id::text = NEW.cohort_id::text
  FOR UPDATE;

  IF cap IS NULL OR cap < 1 THEN
    RETURN NEW;
  END IF;

  SELECT count(*)::integer INTO pipeline
  FROM public.cohort_participants cp
  WHERE cp.cohort_id::text = NEW.cohort_id::text
    AND cp.status IN ('applied', 'confirmed')
    AND (TG_OP = 'INSERT' OR cp.id IS DISTINCT FROM NEW.id);

  IF TG_OP = 'INSERT' AND pipeline >= cap THEN
    RAISE EXCEPTION 'COHORT_FULL'
      USING ERRCODE = '23514',
            MESSAGE = 'This study has reached enrollment capacity.';
  END IF;

  IF TG_OP = 'UPDATE'
     AND (OLD.status IS DISTINCT FROM 'applied' AND OLD.status IS DISTINCT FROM 'confirmed')
     AND NEW.status IN ('applied', 'confirmed')
     AND pipeline >= cap THEN
    RAISE EXCEPTION 'COHORT_FULL'
      USING ERRCODE = '23514',
            MESSAGE = 'This study has reached enrollment capacity.';
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.trg_enforce_cohort_pipeline_capacity() IS
  'Serializes enrollment per cohort (FOR UPDATE); caps applied+confirmed vs cohorts.max_participants only. display_capacity is not used for enforcement.';
