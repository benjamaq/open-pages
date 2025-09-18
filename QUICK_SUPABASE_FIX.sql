-- QUICK FIX: Run this in your Supabase SQL Editor
-- This will fix both the protocol description column and create the uploads bucket

-- 1. Fix protocols table (rename 'details' to 'description')
ALTER TABLE protocols RENAME COLUMN details TO description;

-- 2. Fix uploads table structure
ALTER TABLE uploads RENAME COLUMN title TO name;
ALTER TABLE uploads ADD COLUMN IF NOT EXISTS file_type TEXT;
ALTER TABLE uploads ADD COLUMN IF NOT EXISTS file_size INTEGER;

-- 3. Create uploads storage bucket
INSERT INTO storage.buckets (id, name, public, allowed_mime_types, file_size_limit)
VALUES ('uploads', 'uploads', TRUE, '{"image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"}', 2097152)
ON CONFLICT (id) DO NOTHING;

-- 4. Add storage policies for uploads bucket (drop existing first to avoid conflicts)
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access" ON storage.objects;

CREATE POLICY "Allow authenticated uploads" ON storage.objects 
FOR INSERT TO authenticated 
WITH CHECK (bucket_id = 'uploads');

CREATE POLICY "Allow authenticated updates" ON storage.objects 
FOR UPDATE TO authenticated 
USING (bucket_id = 'uploads');

CREATE POLICY "Allow authenticated deletes" ON storage.objects 
FOR DELETE TO authenticated 
USING (bucket_id = 'uploads');

CREATE POLICY "Allow public access" ON storage.objects 
FOR SELECT USING (bucket_id = 'uploads');
