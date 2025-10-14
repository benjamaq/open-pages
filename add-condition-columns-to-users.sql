-- Add expanded condition tracking columns to users table
-- Run this in your Supabase SQL Editor

-- Add columns if they don't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS condition_category TEXT,
ADD COLUMN IF NOT EXISTS condition_specific TEXT,
ADD COLUMN IF NOT EXISTS condition_details TEXT,
ADD COLUMN IF NOT EXISTS condition_provided_at TIMESTAMPTZ;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_condition_category ON users(condition_category);
CREATE INDEX IF NOT EXISTS idx_users_condition_specific ON users(condition_specific);

-- Verify the columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name LIKE 'condition%'
ORDER BY column_name;
