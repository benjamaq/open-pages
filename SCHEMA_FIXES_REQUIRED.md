# 🚨 Database Schema Fixes Required

The errors you're seeing are due to database schema mismatches. Please run these SQL scripts in your Supabase SQL editor to fix the issues.

## 🔧 Fix 1: Protocol Schema Fix

**Error**: `Could not find the 'description' column of 'protocols' in the schema cache`

**Solution**: Run this SQL in Supabase SQL editor:

```sql
-- Fix protocols table: rename 'details' to 'description'
ALTER TABLE protocols RENAME COLUMN details TO description;
```

## 🔧 Fix 2: Uploads Schema Fix

**Error**: `Failed to load upload bucket`

**Solution**: Run these SQL scripts in Supabase SQL editor:

### Step 1: Fix uploads table structure
```sql
-- Fix uploads table: add missing columns and rename 'title' to 'name'
ALTER TABLE uploads RENAME COLUMN title TO name;
ALTER TABLE uploads ADD COLUMN IF NOT EXISTS file_type TEXT;
ALTER TABLE uploads ADD COLUMN IF NOT EXISTS file_size INTEGER;
```

### Step 2: Create uploads storage bucket
```sql
-- Create uploads storage bucket
INSERT INTO storage.buckets (id, name, public, allowed_mime_types, file_size_limit)
VALUES ('uploads', 'uploads', TRUE, '{"image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"}', 2097152)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  public = EXCLUDED.public,
  allowed_mime_types = EXCLUDED.allowed_mime_types,
  file_size_limit = EXCLUDED.file_size_limit;

-- RLS Policies for uploads bucket
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
```

## 🚀 Quick Setup

I've created individual SQL files for you:

1. **Run**: `database/schema-fixes.sql` - Fixes the column naming issues
2. **Run**: `database/uploads-storage-setup.sql` - Creates the uploads bucket and policies

## ✅ After Running These Scripts

1. **Protocols** will work with the "Create Protocol" button
2. **File Uploads** will work with the "Upload File" button
3. Both features will be fully functional on your dashboard

## 🔍 How to Run SQL in Supabase

1. Go to your Supabase dashboard
2. Click on "SQL Editor" in the left sidebar
3. Click "New Query"
4. Copy and paste the SQL from the files above
5. Click "Run" to execute

After running these scripts, refresh your application and try creating a protocol and uploading a file again!
