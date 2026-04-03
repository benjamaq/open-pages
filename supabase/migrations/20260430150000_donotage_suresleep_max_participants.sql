-- SureSleep operational cap (pipeline trigger + proportional hero). display_capacity stays 25 for public-facing math.
UPDATE public.cohorts
SET max_participants = 60
WHERE slug = 'donotage-suresleep'
  AND (max_participants IS NULL OR max_participants < 1);
