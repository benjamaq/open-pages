-- Pre-check: both cohort studies exist and are active (run in Supabase SQL Editor before isolation seed).
--
-- Expect: 2 rows with status = 'active' and slugs donotage-suresleep + seeking-health-optimal-focus.
-- If a row is missing or status is not active, fix data (INSERT cohort or UPDATE … SET status = 'active')
-- before running seed_cohort_isolation_6users.sql — especially if DoNotAge was historically inserted as draft.

SELECT id, slug, status, max_participants, display_capacity, checkin_fields
FROM public.cohorts
WHERE slug IN ('donotage-suresleep', 'seeking-health-optimal-focus')
ORDER BY slug;
