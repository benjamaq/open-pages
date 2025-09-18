-- SIMPLE BUCKET CREATION - Run this in Supabase SQL Editor

-- 1. Add missing columns to uploads table
ALTER TABLE uploads ADD COLUMN IF NOT EXISTS file_type TEXT;
ALTER TABLE uploads ADD COLUMN IF NOT EXISTS file_size INTEGER;

-- 2. Create uploads storage bucket with 10MB limit
INSERT INTO storage.buckets (id, name, public, allowed_mime_types, file_size_limit)
VALUES ('uploads', 'uploads', TRUE, '{"image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"}', 10485760);

-- 3. Create basic storage policies
CREATE POLICY "uploads_public_read" ON storage.objects 
FOR SELECT USING (bucket_id = 'uploads');

CREATE POLICY "uploads_authenticated_write" ON storage.objects 
FOR INSERT TO authenticated 
WITH CHECK (bucket_id = 'uploads');
