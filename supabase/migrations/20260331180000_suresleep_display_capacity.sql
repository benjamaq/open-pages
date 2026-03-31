-- Public scarcity denominator for DoNotAge SureSleep study landing (25 shown slots).
UPDATE public.cohorts
SET display_capacity = 25
WHERE slug = 'donotage-suresleep';
