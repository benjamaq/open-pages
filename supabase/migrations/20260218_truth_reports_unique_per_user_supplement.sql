-- Ensure one truth report per (user_id, user_supplement_id) to prevent duplicate rows/races.
-- This migration:
-- 1) Deduplicates existing rows (keeps the newest created_at per pair)
-- 2) Adds a unique index to enforce the invariant going forward

-- 1) Deduplicate (keep newest per user_id + user_supplement_id)
with ranked as (
  select
    ctid,
    row_number() over (
      partition by user_id, user_supplement_id
      order by created_at desc nulls last, id desc nulls last
    ) as rn
  from public.supplement_truth_reports
)
delete from public.supplement_truth_reports t
using ranked r
where t.ctid = r.ctid
  and r.rn > 1;

-- 2) Enforce uniqueness
create unique index if not exists supplement_truth_reports_user_supp_unique
  on public.supplement_truth_reports (user_id, user_supplement_id);


