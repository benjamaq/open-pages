-- Create uploads storage bucket and RLS policies
-- Run this in your Supabase SQL editor

-- Create uploads storage bucket
INSERT INTO storage.buckets (id, name, public, allowed_mime_types, file_size_limit)
VALUES ('uploads', 'uploads', TRUE, '{"image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"}', 2097152) -- 2MB limit
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  public = EXCLUDED.public,
  allowed_mime_types = EXCLUDED.allowed_mime_types,
  file_size_limit = EXCLUDED.file_size_limit;

-- RLS Policies for uploads bucket
-- Allow authenticated users to insert (upload) files
CREATE POLICY "Allow authenticated uploads" ON storage.objects 
FOR INSERT TO authenticated 
WITH CHECK (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow authenticated users to update (overwrite) their own files
CREATE POLICY "Allow authenticated updates" ON storage.objects 
FOR UPDATE TO authenticated 
USING (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow authenticated users to delete their own files
CREATE POLICY "Allow authenticated deletes" ON storage.objects 
FOR DELETE TO authenticated 
USING (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow everyone to view files (public access)
CREATE POLICY "Allow public access" ON storage.objects 
FOR SELECT USING (bucket_id = 'uploads');
