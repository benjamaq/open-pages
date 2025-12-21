-- Track per-day supplement intake to enable ON/OFF analysis
alter table if exists daily_entries
  add column if not exists supplement_intake jsonb default '{}'::jsonb;


