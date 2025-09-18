-- SIMPLE FIX - Run this in Supabase SQL Editor
-- This only adds what's missing, doesn't try to rename existing columns

-- 1. Fix uploads table structure (add missing columns only)
ALTER TABLE uploads ADD COLUMN IF NOT EXISTS file_type TEXT;
ALTER TABLE uploads ADD COLUMN IF NOT EXISTS file_size INTEGER;

-- 2. Check if uploads table has 'title' or 'name' column and rename if needed
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'uploads' AND column_name = 'title') THEN
        ALTER TABLE uploads RENAME COLUMN title TO name;
    END IF;
END $$;

-- 3. Create uploads storage bucket
INSERT INTO storage.buckets (id, name, public, allowed_mime_types, file_size_limit)
VALUES ('uploads', 'uploads', TRUE, '{"image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"}', 10485760)
ON CONFLICT (id) DO NOTHING;

-- 4. Create storage policies for uploads bucket
DO $$
BEGIN
    -- Drop existing policies if they exist (ignore errors)
    BEGIN
        DROP POLICY IF EXISTS "uploads_select_policy" ON storage.objects;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    BEGIN
        DROP POLICY IF EXISTS "uploads_insert_policy" ON storage.objects;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    -- Create new policies
    CREATE POLICY "uploads_select_policy" ON storage.objects 
    FOR SELECT USING (bucket_id = 'uploads');
    
    CREATE POLICY "uploads_insert_policy" ON storage.objects 
    FOR INSERT TO authenticated 
    WITH CHECK (bucket_id = 'uploads');
END $$;
