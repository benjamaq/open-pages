-- Add retest tracking columns to user_supplement
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user_supplement'
      AND column_name = 'retest_started'
  ) THEN
    ALTER TABLE public.user_supplement ADD COLUMN IF NOT EXISTS retest_started_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user_supplement'
      AND column_name = 'trial_number'
  ) THEN
    ALTER TABLE public.user_supplement ADD COLUMN IF NOT EXISTS trial_number INTEGER DEFAULT 1;
  END IF;
END $$;


