-- Update testing_status allowed values and migrate legacy 'paused' to 'inactive'
ALTER TABLE public.user_supplement 
DROP CONSTRAINT IF EXISTS user_supplement_testing_status_check;

ALTER TABLE public.user_supplement 
ADD CONSTRAINT user_supplement_testing_status_check 
CHECK (testing_status IN ('inactive', 'testing', 'complete', 'inconclusive'));

UPDATE public.user_supplement
SET testing_status = 'inactive'
WHERE testing_status = 'paused';


