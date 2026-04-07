-- SureSleep operational cap (pipeline trigger + proportional hero). display_capacity stays 25 for public-facing math.
-- NOTE: this only filled max when missing; DBs with an existing cap (e.g. 50) need 20260430160000_suresleep_operational_cap_60_force.sql.
UPDATE public.cohorts
SET max_participants = 60
WHERE slug = 'donotage-suresleep'
  AND (max_participants IS NULL OR max_participants < 1);
