ALTER TABLE public.cohort_participants
  ADD COLUMN IF NOT EXISTS gate_checkin2_reminder_sent_at timestamptz DEFAULT NULL;
