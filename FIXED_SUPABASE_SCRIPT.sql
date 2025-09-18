-- CORRECTED SQL SCRIPT - Run this in Supabase SQL Editor
-- Copy and paste this entire script and run it

-- 1. Add missing columns to uploads table
ALTER TABLE uploads ADD COLUMN IF NOT EXISTS file_type TEXT;
ALTER TABLE uploads ADD COLUMN IF NOT EXISTS file_size INTEGER;

-- 2. Check if uploads table has 'title' column and rename if needed
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'uploads' AND column_name = 'title') THEN
        ALTER TABLE uploads RENAME COLUMN title TO name;
    END IF;
END $$;

-- 3. Create uploads storage bucket with 10MB limit
INSERT INTO storage.buckets (id, name, public, allowed_mime_types, file_size_limit)
VALUES ('uploads', 'uploads', TRUE, '{"image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"}', 10485760)
ON CONFLICT (id) DO NOTHING;

-- 4. Drop existing policies first (ignore errors if they don't exist)
DROP POLICY IF EXISTS "uploads_select_policy" ON storage.objects;
DROP POLICY IF EXISTS "uploads_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "uploads_update_policy" ON storage.objects;
DROP POLICY IF EXISTS "uploads_delete_policy" ON storage.objects;

-- 5. Create new storage policies for uploads bucket
CREATE POLICY "uploads_select_policy" ON storage.objects 
FOR SELECT USING (bucket_id = 'uploads');

CREATE POLICY "uploads_insert_policy" ON storage.objects 
FOR INSERT TO authenticated 
WITH CHECK (bucket_id = 'uploads');

CREATE POLICY "uploads_update_policy" ON storage.objects 
FOR UPDATE TO authenticated 
USING (bucket_id = 'uploads');

CREATE POLICY "uploads_delete_policy" ON storage.objects 
FOR DELETE TO authenticated 
USING (bucket_id = 'uploads');
