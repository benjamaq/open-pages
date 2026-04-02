-- Idempotent send tracking for "one more check-in" email after first compliance check-in.
ALTER TABLE public.cohort_participants
  ADD COLUMN IF NOT EXISTS post_first_checkin_email_sent_at TIMESTAMPTZ;

COMMENT ON COLUMN public.cohort_participants.post_first_checkin_email_sent_at IS
  'Set when the post-check-in-1 nudge email is sent (applied gate, exactly one distinct check-in day).';
