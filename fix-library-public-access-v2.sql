-- Fix library bucket public access for anonymous users (Permission-safe version)
-- Run this in your Supabase SQL Editor

-- First, check if we can modify the bucket settings
-- If this fails, you may need to contact Supabase support or use the dashboard

-- Try to update the library bucket to be public
-- This might fail if you don't have permission, but worth trying
UPDATE storage.buckets 
SET public = true 
WHERE id = 'library';

-- Alternative approach: Create a more permissive policy
-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Public access to public library files" ON storage.objects;

-- Create a policy that allows public access to library files
-- This is more permissive and should work for anonymous users
CREATE POLICY "Allow public library access" ON storage.objects
  FOR SELECT 
  USING (bucket_id = 'library');

-- If the above is too permissive, try this more specific version:
-- (Comment out the above policy and uncomment this one if needed)
/*
DROP POLICY IF EXISTS "Allow public library access" ON storage.objects;

CREATE POLICY "Allow public library access" ON storage.objects
  FOR SELECT 
  USING (
    bucket_id = 'library' AND
    -- Allow access if the file path matches a public library item
    EXISTS (
      SELECT 1 FROM library_items 
      WHERE library_items.file_url = storage.objects.name
      AND library_items.is_public = true
    )
  );
*/

-- Test the configuration
SELECT 
  id, 
  name, 
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE id = 'library';

-- Show current policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE '%library%';
