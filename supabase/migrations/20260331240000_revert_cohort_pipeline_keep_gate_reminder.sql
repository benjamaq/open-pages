-- Roll back extended cohort participant statuses and fit columns.
-- Keep gate_reminder_sent_at for the 24h check-in reminder cron.

UPDATE public.cohort_participants
SET status = 'applied'
WHERE status IN ('pending_review', 'accepted_pending_gate');

ALTER TABLE public.cohort_participants
  DROP CONSTRAINT IF EXISTS cohort_participants_status_check;

ALTER TABLE public.cohort_participants
  ADD CONSTRAINT cohort_participants_status_check CHECK (
    status IN ('applied', 'confirmed', 'dropped', 'completed')
  );

ALTER TABLE public.cohort_participants
  DROP COLUMN IF EXISTS fit_score,
  DROP COLUMN IF EXISTS fit_tier;

ALTER TABLE public.cohort_participants
  ADD COLUMN IF NOT EXISTS gate_reminder_sent_at timestamptz;

COMMENT ON COLUMN public.cohort_participants.gate_reminder_sent_at IS
  'Set when first 24h gate reminder email is sent (dedupe).';
