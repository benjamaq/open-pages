-- Step 10: cohort qualification free-text + study shipping fields on profiles.

ALTER TABLE public.cohort_participants
  ADD COLUMN IF NOT EXISTS qualification_response TEXT;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS shipping_address_line1 TEXT,
  ADD COLUMN IF NOT EXISTS shipping_address_line2 TEXT,
  ADD COLUMN IF NOT EXISTS shipping_city TEXT,
  ADD COLUMN IF NOT EXISTS shipping_region TEXT,
  ADD COLUMN IF NOT EXISTS shipping_postal_code TEXT,
  ADD COLUMN IF NOT EXISTS shipping_country TEXT;
