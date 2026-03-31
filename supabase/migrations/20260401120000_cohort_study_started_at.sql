-- When participant confirms shipping: daily study clock + reminders start only after they tap "start my study".
ALTER TABLE public.cohort_participants
  ADD COLUMN IF NOT EXISTS study_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS product_arrived_at DATE;

COMMENT ON COLUMN public.cohort_participants.study_started_at IS
  'First day of the 21-day study window begins when participant confirms product arrival on dashboard.';
COMMENT ON COLUMN public.cohort_participants.product_arrived_at IS
  'Optional: arrival date from "When did your product arrive?" on study start flow.';

-- Existing confirmed participants: keep current behaviour (study already anchored at confirmation in prod).
UPDATE public.cohort_participants
SET study_started_at = confirmed_at
WHERE status = 'confirmed'
  AND confirmed_at IS NOT NULL
  AND study_started_at IS NULL;
