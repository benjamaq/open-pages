-- Enforce: confirmed_at may only be set when participant has cleared the gate (confirmed or completed).
-- applied / dropped must have confirmed_at NULL — prevents dashboard and analytics bugs from inconsistent rows.

UPDATE public.cohort_participants
SET confirmed_at = NULL
WHERE status IN ('applied', 'dropped')
  AND confirmed_at IS NOT NULL;

ALTER TABLE public.cohort_participants
  DROP CONSTRAINT IF EXISTS cohort_participants_confirmed_at_status_chk;

ALTER TABLE public.cohort_participants
  ADD CONSTRAINT cohort_participants_confirmed_at_status_chk
  CHECK (
    confirmed_at IS NULL
    OR status IN ('confirmed', 'completed')
  );

COMMENT ON CONSTRAINT cohort_participants_confirmed_at_status_chk ON public.cohort_participants IS
  'confirmed_at is only allowed once status is confirmed or completed; applied/dropped must stay NULL.';

CREATE OR REPLACE FUNCTION public.cohort_participants_clear_confirmed_at_when_not_confirmed()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status IN ('applied', 'dropped') THEN
    NEW.confirmed_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cohort_participants_confirmed_at_guard ON public.cohort_participants;

CREATE TRIGGER trg_cohort_participants_confirmed_at_guard
  BEFORE INSERT OR UPDATE OF status, confirmed_at
  ON public.cohort_participants
  FOR EACH ROW
  EXECUTE PROCEDURE public.cohort_participants_clear_confirmed_at_when_not_confirmed();

COMMENT ON FUNCTION public.cohort_participants_clear_confirmed_at_when_not_confirmed() IS
  'Force confirmed_at to NULL when status is applied or dropped so CHECK + app updates stay aligned.';
