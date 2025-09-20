-- Simple Library Verification Script
-- Run each section separately if needed

-- 1. Check if library_items table exists
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'library_items'
    ) THEN 'library_items table: ✅ EXISTS'
    ELSE 'library_items table: ❌ MISSING'
  END as table_status;

-- 2. Check if library bucket exists
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM storage.buckets 
      WHERE id = 'library'
    ) THEN 'library bucket: ✅ EXISTS'
    ELSE 'library bucket: ❌ MISSING'
  END as bucket_status;

-- 3. Show bucket details (only if bucket exists)
SELECT 
  id,
  name,
  public,
  file_size_limit,
  created_at
FROM storage.buckets 
WHERE id = 'library';

-- 4. Count any existing library items
SELECT count(*) as existing_library_items
FROM library_items;
