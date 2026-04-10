-- Draft-only cohort for config / isolation testing (not live recruitment).
-- Slug: placeholder-cohort-v1
--
-- Metrics: energy, mood, calmness — NOT sleep-shaped, NOT cognitive-shaped
-- (no sleep_* / night_wakes / sleep_onset; no focus / mental_clarity).
--
-- NOTE: Product asked for energy + recovery + mood; `recovery` is not an allowed
-- key in app `COHORT_CHECKIN_FIELD_KEYS` yet. Using `calmness` as the third slider
-- until platform adds `recovery` (requires code + optional DB comment only).

INSERT INTO public.cohorts (
  slug,
  brand_name,
  product_name,
  study_days,
  checkin_fields,
  status,
  max_participants
)
VALUES (
  'placeholder-cohort-v1',
  'BioStackr Internal',
  'Placeholder Product (draft — not for external use)',
  21,
  ARRAY['energy', 'mood', 'calmness']::text[],
  'draft',
  999
)
ON CONFLICT (slug) DO NOTHING;
