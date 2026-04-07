-- SureSleep operational enrollment / shipping pipeline cap (authoritative for DB trigger + study landing "full").
--
-- Separation of concerns (DoNotAge SureSleep):
--   cohorts.display_capacity (e.g. 25) — public hero only: "X of 25 places filled" urgency math
--     (see src/app/study/[slug]/page.tsx HeroCohortStatusCard: ratio = confirmed / max_participants * display_capacity).
--   cohorts.max_participants — hard cap used by:
--     - public.trg_enforce_cohort_pipeline_capacity (applied + confirmed pipeline)
--     - study landing "This study is now full" when confirmed >= max (src/lib/cohortRecruitment.ts)
--
-- Prior migration 20260430150000 only raised max when null/<1, so real DBs that already had e.g. 50 never moved to 60.
-- Recruitment target: 55–60 confirmed shipped; cap must not sit at ~50.

UPDATE public.cohorts
SET max_participants = 60
WHERE slug = 'donotage-suresleep';

-- Keep public-facing denominator at 25 unless intentionally changed (hero copy stays "25 participants").
UPDATE public.cohorts
SET display_capacity = 25
WHERE slug = 'donotage-suresleep'
  AND (display_capacity IS NULL OR display_capacity < 1);

COMMENT ON COLUMN public.cohorts.max_participants IS
  'Hard enrollment cap (applied+confirmed pipeline via trigger; study page full when confirmed reaches this). Operational SureSleep target 55–60.';
COMMENT ON COLUMN public.cohorts.display_capacity IS
  'Optional smaller number for hero progress/urgency only (not enrollment enforcement when trigger uses max_participants only).';
