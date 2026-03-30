-- Fix signup/profile bootstrap: code expects reminder_timezone_autodetected (boolean) on profiles.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS reminder_timezone_autodetected BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN public.profiles.reminder_timezone_autodetected IS
  'When true, server may avoid overwriting reminder_timezone if user already set it manually (see settings API).';
