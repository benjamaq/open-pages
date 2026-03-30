-- Idempotent: ensures the public SureSleep study slug exists (fixes empty prod DBs or partial migrates).

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
