-- Add public module visibility controls to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS public_modules JSONB DEFAULT '{
  "supplements": true,
  "protocols": true,
  "movement": true,
  "mindfulness": true,
  "food": true,
  "uploads": true,
  "journal": true
}'::jsonb;

-- Optional: Add section ordering for future use
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS public_section_order TEXT[] DEFAULT ARRAY['journal','supplements','protocols','movement','mindfulness','food','uploads'];

-- Helper function to safely read module visibility (optional)
CREATE OR REPLACE FUNCTION get_module_visibility(modules JSONB, module_name TEXT, default_value BOOLEAN DEFAULT false)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN COALESCE((modules ->> module_name)::boolean, default_value);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update existing profiles to have the default public_modules
UPDATE profiles 
SET public_modules = '{
  "supplements": true,
  "protocols": true,
  "movement": true,
  "mindfulness": true,
  "food": true,
  "uploads": true,
  "journal": true
}'::jsonb
WHERE public_modules IS NULL;
