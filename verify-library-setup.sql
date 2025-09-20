-- Verify Library Setup Script
-- Run this in Supabase SQL Editor to check if everything is set up correctly

-- Check if library_items table exists
SELECT 
  'library_items table' as component,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'library_items'
    ) THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status;

-- Check if library bucket exists
SELECT 
  'library bucket' as component,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM storage.buckets 
      WHERE id = 'library'
    ) THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status;

-- Show library bucket details if it exists
SELECT 
  'Bucket Details:' as info,
  id,
  name,
  public,
  file_size_limit,
  array_length(allowed_mime_types, 1) as mime_types_count
FROM storage.buckets 
WHERE id = 'library';

-- Check RLS policies on library_items
SELECT 
  'RLS Policies on library_items:' as info,
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies 
WHERE tablename = 'library_items';

-- Check storage policies for library bucket
SELECT 
  'Storage Policies:' as info,
  policyname,
  cmd
FROM storage.policies 
WHERE bucket_id = 'library';

-- Test query to see if basic select works
SELECT 
  'Test Query:' as info,
  count(*) as library_items_count
FROM library_items;

-- Show current user for debugging
SELECT 
  'Current User:' as info,
  auth.uid() as user_id,
  auth.email() as email;
