-- Post–first-check-in nudge email claim timestamp (see src/lib/cohortPostFirstCheckinEmail.ts).
-- Idempotent: safe if 20260404120000_cohort_post_first_checkin_email.sql already ran.
ALTER TABLE public.cohort_participants
  ADD COLUMN IF NOT EXISTS post_first_checkin_email_sent_at TIMESTAMPTZ;

COMMENT ON COLUMN public.cohort_participants.post_first_checkin_email_sent_at IS
  'Set when the post-check-in-1 nudge email is sent; null if not sent yet.';
