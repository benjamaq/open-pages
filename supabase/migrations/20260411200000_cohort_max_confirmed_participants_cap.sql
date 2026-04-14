-- Cap confirmed+completed admissions per cohort (nullable = unlimited).
-- Used for donotage-suresleep: max 60 seats after compliance gate.

ALTER TABLE public.cohorts
  ADD COLUMN IF NOT EXISTS max_confirmed_participants integer NULL;

COMMENT ON COLUMN public.cohorts.max_confirmed_participants IS
  'When set (>=1), applied→confirmed UPDATE is rejected if COUNT(confirmed+completed) for this cohort already >= this value. NULL = no cap.';

UPDATE public.cohorts
SET max_confirmed_participants = 60
WHERE lower(trim(slug)) = 'donotage-suresleep';

CREATE OR REPLACE FUNCTION public.trg_enforce_cohort_max_confirmed_admission_cap()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  cap integer;
  admitted integer;
BEGIN
  IF TG_OP <> 'UPDATE' THEN
    RETURN NEW;
  END IF;

  IF OLD.status IS DISTINCT FROM 'applied' OR NEW.status IS DISTINCT FROM 'confirmed' THEN
    RETURN NEW;
  END IF;

  SELECT c.max_confirmed_participants::integer INTO cap
  FROM public.cohorts c
  WHERE c.id::text = NEW.cohort_id::text
  FOR UPDATE;

  IF cap IS NULL OR cap < 1 THEN
    RETURN NEW;
  END IF;

  SELECT count(*)::integer INTO admitted
  FROM public.cohort_participants cp
  WHERE cp.cohort_id::text = NEW.cohort_id::text
    AND cp.status IN ('confirmed', 'completed');

  IF admitted >= cap THEN
    RAISE EXCEPTION USING
      ERRCODE = '23514',
      MESSAGE = 'COHORT_CONFIRMED_CAP_REACHED';
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.trg_enforce_cohort_max_confirmed_admission_cap() IS
  'Before applied→confirmed: lock cohort row; if max_confirmed_participants set and count(confirmed+completed) >= cap, reject.';

DROP TRIGGER IF EXISTS trg_cohort_participants_max_confirmed_cap ON public.cohort_participants;

CREATE TRIGGER trg_cohort_participants_max_confirmed_cap
  BEFORE UPDATE OF status ON public.cohort_participants
  FOR EACH ROW
  EXECUTE PROCEDURE public.trg_enforce_cohort_max_confirmed_admission_cap();
