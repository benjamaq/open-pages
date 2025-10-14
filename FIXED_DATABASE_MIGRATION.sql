-- ============================================================
-- FIXED DATABASE MIGRATION FOR EXPANDED CATEGORIES
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

-- Add expanded condition tracking columns to PROFILES table (not users)
-- Your database uses 'profiles' table, not 'users'
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS condition_category TEXT,
ADD COLUMN IF NOT EXISTS condition_specific TEXT;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_condition_category ON profiles(condition_category);
CREATE INDEX IF NOT EXISTS idx_profiles_condition_specific ON profiles(condition_specific);

-- ============================================================
-- VERIFICATION QUERY (Run this separately to verify)
-- ============================================================

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND column_name LIKE 'condition%'
ORDER BY column_name;

-- Expected result: 5 rows showing:
-- condition_category (text)
-- condition_details (text) - already exists
-- condition_primary (text) - already exists
-- condition_provided_at (timestamp with time zone) - already exists
-- condition_specific (text) - newly added

-- ============================================================
-- DONE! Your expanded categories system is now ready to use!
-- ============================================================
