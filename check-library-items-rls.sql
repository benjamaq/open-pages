-- Check RLS policies on library_items table
-- Run this in your Supabase SQL Editor

-- Check if RLS is enabled on library_items
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'library_items';

-- Check existing policies on library_items
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'library_items';

-- Check if there are any policies that allow public access
SELECT 
  policyname,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'library_items'
AND 'public' = ANY(roles);

-- Test query to see if we can access public library items
SELECT 
  id,
  title,
  is_public,
  file_url
FROM library_items 
WHERE is_public = true
LIMIT 5;
