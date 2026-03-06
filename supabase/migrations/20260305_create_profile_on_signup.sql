-- Auth trigger: create profiles row on signup.
-- Fixes regression where new users in auth.users had no corresponding profiles row,
-- which broke daily email reminders.
--
-- CRITICAL: Does NOT drop/recreate profiles table. Does NOT alter existing rows.
-- Only ensures NEW signups get a profile row with reminder_enabled=true.
--
-- Prereq: profiles must have UNIQUE(user_id). If missing and you have no duplicates:
--   ALTER TABLE profiles ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);

create or replace function public.handle_new_user_profiles()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_slug text;
  v_display_name text;
  v_email text;
begin
  -- Generate unique slug from user id (no dashes, prefixed)
  v_slug := 'user-' || replace(new.id::text, '-', '');
  -- Display name from metadata or email prefix
  v_email := coalesce(new.email, '');
  v_display_name := coalesce(
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'full_name',
    nullif(split_part(v_email, '@', 1), ''),
    'User'
  );

  -- Core columns: user_id, slug, display_name required. reminder_* for daily emails. timezone from 2025-10-28 migration.
  insert into public.profiles (
    user_id,
    slug,
    display_name,
    public,
    reminder_enabled,
    reminder_time,
    timezone
  )
  values (
    new.id,
    v_slug,
    v_display_name,
    true,
    true,
    '09:00',
    'UTC'
  )
  on conflict (user_id) do nothing;

  return new;
exception
  when unique_violation then
    -- Profile already exists (e.g. from API bootstrap); ignore
    return new;
  when others then
    -- Re-raise to surface real errors
    raise;
end;
$$;

-- Create trigger (idempotent: drop first if exists from prior setup)
drop trigger if exists on_auth_user_created_profiles on auth.users;

create trigger on_auth_user_created_profiles
  after insert on auth.users
  for each row
  execute function public.handle_new_user_profiles();
