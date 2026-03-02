-- Default daily check-in email reminders ON for new signups.
-- Future-only: does NOT modify existing rows.

alter table public.profiles
  alter column reminder_enabled set default true;

-- Ensure a sensible default time exists for new rows.
-- (Only affects inserts that omit reminder_time.)
alter table public.profiles
  alter column reminder_time set default '09:00';

