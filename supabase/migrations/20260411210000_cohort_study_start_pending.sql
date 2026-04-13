-- Defer study_started_at / product_arrived_at until the first successful cohort check-in after
-- the in-app "product arrived" flow. Payload is stored here until POST /api/checkin applies it.
ALTER TABLE public.cohort_participants
  ADD COLUMN IF NOT EXISTS study_start_pending jsonb;

COMMENT ON COLUMN public.cohort_participants.study_start_pending IS
  'Set by POST /api/cohort/start-study; cleared when POST /api/checkin applies study_started_at and optional product_arrived_at.';
