-- One free instant verdict per account:
-- mark the single auto-unlocked truth report row for audit and gating.
alter table if exists public.supplement_truth_reports
add column if not exists auto_unlocked boolean not null default false;

-- Speed up per-user lookups for the one-time auto-unlock check.
create index if not exists idx_supplement_truth_reports_user_auto_unlocked
on public.supplement_truth_reports (user_id, auto_unlocked);


