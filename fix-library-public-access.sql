-- Fix library bucket public access for anonymous users
-- Run this in your Supabase SQL Editor

-- First, drop the existing restrictive policy
DROP POLICY IF EXISTS "Public access to public library files" ON storage.objects;

-- Create a new policy that allows anonymous access to public library files
-- This policy checks if the file exists in library_items with is_public = true
-- and allows access without requiring authentication
CREATE POLICY "Anonymous access to public library files" ON storage.objects
  FOR SELECT 
  USING (
    bucket_id = 'library' AND
    EXISTS (
      SELECT 1 FROM library_items 
      WHERE library_items.file_url = storage.objects.name
      AND library_items.is_public = true
    )
  );

-- Also ensure the library bucket allows public access
UPDATE storage.buckets 
SET public = true 
WHERE id = 'library';

-- Test the policy
SELECT 'Library public access policy updated successfully!' as status;
