-- Persist cohort study completion + individual participant results (auth-scoped reads).

ALTER TABLE public.cohort_participants
  ADD COLUMN IF NOT EXISTS study_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completion_email_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS result_ready_email_sent_at TIMESTAMPTZ;

COMMENT ON COLUMN public.cohort_participants.study_completed_at IS 'Set once when the study window ends (cron); status becomes completed.';
COMMENT ON COLUMN public.cohort_participants.completion_email_sent_at IS 'Idempotent flag for post-completion thank-you email.';
COMMENT ON COLUMN public.cohort_participants.result_ready_email_sent_at IS 'Idempotent flag for personal result ready email.';

CREATE INDEX IF NOT EXISTS idx_cohort_participants_completion_pending
  ON public.cohort_participants (cohort_id, status)
  WHERE study_completed_at IS NULL AND study_started_at IS NOT NULL AND status = 'confirmed';

CREATE TABLE IF NOT EXISTS public.cohort_participant_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  cohort_id UUID NOT NULL REFERENCES public.cohorts (id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'ready', 'published')),
  result_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  result_version INTEGER NOT NULL DEFAULT 1,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, cohort_id)
);

COMMENT ON TABLE public.cohort_participant_results IS 'Per-participant cohort outcome payload; user_id = profiles.user_id (auth).';
COMMENT ON COLUMN public.cohort_participant_results.result_json IS 'Structured summary for on-screen + PDF; no cohort-wide data.';

CREATE INDEX IF NOT EXISTS idx_cohort_participant_results_cohort ON public.cohort_participant_results (cohort_id);
CREATE INDEX IF NOT EXISTS idx_cohort_participant_results_publish_email
  ON public.cohort_participant_results (cohort_id, published_at)
  WHERE published_at IS NOT NULL AND status = 'published';

CREATE OR REPLACE FUNCTION public.touch_cohort_participant_results_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cohort_participant_results_updated ON public.cohort_participant_results;
CREATE TRIGGER trg_cohort_participant_results_updated
  BEFORE UPDATE ON public.cohort_participant_results
  FOR EACH ROW
  EXECUTE PROCEDURE public.touch_cohort_participant_results_updated_at();

ALTER TABLE public.cohort_participant_results ENABLE ROW LEVEL SECURITY;

-- Participants read only their own row (auth = profiles.user_id).
CREATE POLICY cohort_participant_results_select_own
  ON public.cohort_participant_results
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- No insert/update/delete for authenticated clients; service role bypasses RLS.
