-- Library Storage Bucket Setup
-- Run this in your Supabase SQL Editor AFTER running library-schema.sql

-- Create the library storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'library',
  'library',
  false, -- Private by default, access controlled by RLS
  20971520, -- 20MB limit
  ARRAY[
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/webp',
    'text/csv',
    'text/plain',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
);

-- RLS Policies for library bucket
-- Users can upload to their own folder
CREATE POLICY "Users can upload to their own library folder" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'library' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can view their own files
CREATE POLICY "Users can view their own library files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'library' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can update their own files
CREATE POLICY "Users can update their own library files" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'library' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can delete their own files
CREATE POLICY "Users can delete their own library files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'library' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Public access for public library items (handled by application logic)
CREATE POLICY "Public access to public library files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'library' AND
    EXISTS (
      SELECT 1 FROM library_items 
      WHERE library_items.file_url = storage.objects.name
      AND library_items.is_public = true
    )
  );

-- Test the bucket
SELECT 'Library storage bucket created successfully!' as status;

-- Show bucket configuration
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE id = 'library';
