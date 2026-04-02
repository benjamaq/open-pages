-- Optional given name for UI; code falls back to full_name / display_name / auth metadata when null.
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS first_name TEXT;

COMMENT ON COLUMN public.profiles.first_name IS 'Optional given name; welcome UI may also derive from full_name or display_name.';
