-- Atomically enforce cohort enrollment cap (applied + confirmed) vs COALESCE(display_capacity, max_participants).
-- Prevents oversubscription when many signups hit /api/profiles concurrently (FOR UPDATE on cohorts during trigger).

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

  SELECT (COALESCE(c.display_capacity, c.max_participants))::integer INTO cap
  FROM public.cohorts c
  WHERE c.id = NEW.cohort_id
  FOR UPDATE;

  IF cap IS NULL OR cap < 1 THEN
    RETURN NEW;
  END IF;

  SELECT count(*)::integer INTO pipeline
  FROM public.cohort_participants cp
  WHERE cp.cohort_id = NEW.cohort_id
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

DROP TRIGGER IF EXISTS trg_cohort_participants_capacity ON public.cohort_participants;

CREATE TRIGGER trg_cohort_participants_capacity
  BEFORE INSERT OR UPDATE ON public.cohort_participants
  FOR EACH ROW
  EXECUTE PROCEDURE public.trg_enforce_cohort_pipeline_capacity();

COMMENT ON FUNCTION public.trg_enforce_cohort_pipeline_capacity() IS
  'Serializes enrollment checks per cohort via FOR UPDATE on cohorts; caps applied+confirmed rows using COALESCE(display_capacity, max_participants).';

-- One cohort study product row per profile (case-insensitive name) for supplements; prevents duplicate inserts on racing ensureCohortStudyStackItem.
CREATE UNIQUE INDEX IF NOT EXISTS idx_stack_items_profile_supplement_name_lower
ON public.stack_items (profile_id, lower(trim(name)))
WHERE item_type = 'supplement' AND name IS NOT NULL AND trim(name) <> '';
