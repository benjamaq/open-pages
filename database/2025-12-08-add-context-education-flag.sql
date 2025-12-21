-- Adds context education completion flag to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS context_education_completed BOOLEAN DEFAULT false;


