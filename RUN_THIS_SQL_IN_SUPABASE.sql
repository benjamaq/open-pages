-- ============================================================
-- EXPANDED CATEGORIES DATABASE MIGRATION
-- ============================================================
-- 
-- WHERE TO RUN THIS:
-- 1. Go to https://supabase.com/dashboard
-- 2. Select your project
-- 3. Click "SQL Editor" in the left sidebar
-- 4. Click "New Query"
-- 5. Paste this entire file
-- 6. Click "Run" (or press Cmd+Enter / Ctrl+Enter)
--
-- ============================================================

-- Add expanded condition tracking columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS condition_category TEXT,
ADD COLUMN IF NOT EXISTS condition_specific TEXT,
ADD COLUMN IF NOT EXISTS condition_details TEXT,
ADD COLUMN IF NOT EXISTS condition_provided_at TIMESTAMPTZ;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_condition_category ON users(condition_category);
CREATE INDEX IF NOT EXISTS idx_users_condition_specific ON users(condition_specific);

-- ============================================================
-- VERIFICATION QUERY (Run this separately to verify)
-- ============================================================

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name LIKE 'condition%'
ORDER BY column_name;

-- Expected result: 4 rows showing:
-- condition_category (text)
-- condition_details (text)
-- condition_provided_at (timestamp with time zone)
-- condition_specific (text)

-- ============================================================
-- DONE! Your expanded categories system is now ready to use!
-- ============================================================
