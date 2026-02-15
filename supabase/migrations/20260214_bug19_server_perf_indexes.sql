-- Bug 19: server-side performance indexes
-- Safe to re-run (IF NOT EXISTS). Tailored to actual column names used in codebase.

-- daily_entries: filtered by user_id and ordered/ranged by local_date constantly
CREATE INDEX IF NOT EXISTS idx_daily_entries_user_local_date
ON public.daily_entries (user_id, local_date DESC);

-- Speed up "wearables present" scans (wearable-status and truth-engine implicit path)
CREATE INDEX IF NOT EXISTS idx_daily_entries_user_wearables_local_date
ON public.daily_entries (user_id, local_date DESC)
WHERE wearables IS NOT NULL;

-- user_supplement: filtered by user_id and active status often
CREATE INDEX IF NOT EXISTS idx_user_supplement_user_active
ON public.user_supplement (user_id, is_active);

-- supplement_truth_reports: looked up by user + supplement, and by status/source in reanalysis
CREATE INDEX IF NOT EXISTS idx_truth_reports_user_supplement_created
ON public.supplement_truth_reports (user_id, user_supplement_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_truth_reports_user_status_source
ON public.supplement_truth_reports (user_id, status, analysis_source);

-- stack_items: most queries filter by profile_id and/or user_supplement_id (there is no user_id column)
CREATE INDEX IF NOT EXISTS idx_stack_items_profile_id
ON public.stack_items (profile_id);

CREATE INDEX IF NOT EXISTS idx_stack_items_user_supplement_id
ON public.stack_items (user_supplement_id);

CREATE INDEX IF NOT EXISTS idx_stack_items_profile_user_supplement
ON public.stack_items (profile_id, user_supplement_id);

-- dashboard_cache: queried by user_id
CREATE INDEX IF NOT EXISTS idx_dashboard_cache_user_id
ON public.dashboard_cache (user_id);


