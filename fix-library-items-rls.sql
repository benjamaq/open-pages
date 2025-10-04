-- Fix RLS policies on library_items table to allow anonymous access to public items
-- Run this in your Supabase SQL Editor

-- First, check current policies
SELECT 
  policyname,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'library_items';

-- Create a policy to allow anonymous users to read public library items
-- This is needed so the preview API can check if an item is public
CREATE POLICY "Allow anonymous access to public library items" 
ON library_items
FOR SELECT 
TO public
USING (is_public = true);

-- Test the policy by trying to access public items as anonymous user
-- (This should work now)
SELECT 
  id,
  title,
  is_public,
  file_url
FROM library_items 
WHERE is_public = true
LIMIT 3;

-- Verify the policy was created
SELECT 
  policyname,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'library_items'
AND policyname = 'Allow anonymous access to public library items';

SELECT 'Library items RLS policy updated successfully!' as status;
