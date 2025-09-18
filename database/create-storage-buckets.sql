-- Create storage buckets for Open Pages uploads
-- Run this in your Supabase SQL Editor if automatic bucket creation fails

-- Create avatars bucket
INSERT INTO storage.buckets (id, name, public, allowed_mime_types, file_size_limit)
VALUES (
  'avatars', 
  'avatars', 
  true, 
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  10485760 -- 10MB
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  public = EXCLUDED.public,
  allowed_mime_types = EXCLUDED.allowed_mime_types,
  file_size_limit = EXCLUDED.file_size_limit;

-- Create uploads bucket  
INSERT INTO storage.buckets (id, name, public, allowed_mime_types, file_size_limit)
VALUES (
  'uploads', 
  'uploads', 
  true, 
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'],
  10485760 -- 10MB
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  public = EXCLUDED.public,
  allowed_mime_types = EXCLUDED.allowed_mime_types,
  file_size_limit = EXCLUDED.file_size_limit;

-- Create RLS policies for avatars bucket
CREATE POLICY IF NOT EXISTS "Allow authenticated uploads to avatars" 
ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'avatars');

CREATE POLICY IF NOT EXISTS "Allow authenticated updates to avatars" 
ON storage.objects 
FOR UPDATE 
TO authenticated 
USING (bucket_id = 'avatars');

CREATE POLICY IF NOT EXISTS "Allow authenticated deletes from avatars" 
ON storage.objects 
FOR DELETE 
TO authenticated 
USING (bucket_id = 'avatars');

CREATE POLICY IF NOT EXISTS "Allow public access to avatars" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'avatars');

-- Create RLS policies for uploads bucket
CREATE POLICY IF NOT EXISTS "Allow authenticated uploads to uploads" 
ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'uploads');

CREATE POLICY IF NOT EXISTS "Allow authenticated updates to uploads" 
ON storage.objects 
FOR UPDATE 
TO authenticated 
USING (bucket_id = 'uploads');

CREATE POLICY IF NOT EXISTS "Allow authenticated deletes from uploads" 
ON storage.objects 
FOR DELETE 
TO authenticated 
USING (bucket_id = 'uploads');

CREATE POLICY IF NOT EXISTS "Allow public access to uploads" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'uploads');
