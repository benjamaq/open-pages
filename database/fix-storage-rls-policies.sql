-- Fix RLS policies for storage buckets
-- Run this in Supabase SQL Editor to fix "new row violates row-level security policy" error

-- First, ensure RLS is enabled on storage.objects (it should be by default)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop any existing conflicting policies
DROP POLICY IF EXISTS "Allow authenticated uploads to avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access to avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads to uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access to uploads" ON storage.objects;
DROP POLICY IF EXISTS "Auth avatar uploads" ON storage.objects;
DROP POLICY IF EXISTS "Public avatars" ON storage.objects;
DROP POLICY IF EXISTS "Auth file uploads" ON storage.objects;
DROP POLICY IF EXISTS "Public uploads" ON storage.objects;

-- Create proper RLS policies for avatars bucket
CREATE POLICY "Allow authenticated users to upload avatars"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Allow authenticated users to update avatars"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars');

CREATE POLICY "Allow authenticated users to delete avatars"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'avatars');

CREATE POLICY "Allow public to view avatars"
ON storage.objects
FOR SELECT
USING (bucket_id = 'avatars');

-- Create proper RLS policies for uploads bucket
CREATE POLICY "Allow authenticated users to upload files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'uploads');

CREATE POLICY "Allow authenticated users to update files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'uploads');

CREATE POLICY "Allow authenticated users to delete files"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'uploads');

CREATE POLICY "Allow public to view uploads"
ON storage.objects
FOR SELECT
USING (bucket_id = 'uploads');
