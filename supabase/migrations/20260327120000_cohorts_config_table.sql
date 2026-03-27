-- Config-driven cohort studies: profiles.cohort_id (TEXT) matches cohorts.slug (no FK).

CREATE TABLE IF NOT EXISTS public.cohorts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  brand_name TEXT NOT NULL,
  product_name TEXT NOT NULL,
  supplement_id UUID,
  study_days INTEGER NOT NULL DEFAULT 21,
  checkin_fields TEXT[] NOT NULL DEFAULT ARRAY['sleep_quality','energy','sleep_onset_bucket','night_wakes']::text[],
  start_date DATE,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','active','complete')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Authenticated users can read cohort definitions (needed for /api/me with user JWT).
ALTER TABLE public.cohorts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cohorts_select_authenticated" ON public.cohorts;
CREATE POLICY "cohorts_select_authenticated"
  ON public.cohorts FOR SELECT
  TO authenticated
  USING (true);

INSERT INTO public.cohorts (slug, brand_name, product_name, study_days, checkin_fields, status)
VALUES (
  'donotage-suresleep',
  'DoNotAge',
  'SureSleep',
  21,
  ARRAY['sleep_quality','energy','sleep_onset_bucket','night_wakes']::text[],
  'draft'
)
ON CONFLICT (slug) DO NOTHING;
