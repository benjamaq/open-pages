-- Add testing_status to user_supplement with constraint and default
ALTER TABLE public.user_supplement
ADD COLUMN IF NOT EXISTS testing_status TEXT DEFAULT 'inactive'
CHECK (testing_status IN ('inactive', 'testing', 'paused'));

-- Migrate existing rows to 'testing' where null or missing
UPDATE public.user_supplement
SET testing_status = 'testing'
WHERE testing_status IS NULL;


