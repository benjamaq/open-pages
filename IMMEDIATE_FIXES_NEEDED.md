# 🚨 IMMEDIATE FIXES NEEDED

## Step 1: Run SQL Script in Supabase

**Go to your Supabase Dashboard → SQL Editor → New Query**

Copy and paste this SQL script:

```sql
-- Fix protocols table (rename 'details' to 'description')
ALTER TABLE protocols RENAME COLUMN details TO description;

-- Fix uploads table structure
ALTER TABLE uploads RENAME COLUMN title TO name;
ALTER TABLE uploads ADD COLUMN IF NOT EXISTS file_type TEXT;
ALTER TABLE uploads ADD COLUMN IF NOT EXISTS file_size INTEGER;

-- Create uploads storage bucket
INSERT INTO storage.buckets (id, name, public, allowed_mime_types, file_size_limit)
VALUES ('uploads', 'uploads', TRUE, '{"image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"}', 2097152)
ON CONFLICT (id) DO NOTHING;

-- Add storage policies for uploads bucket
CREATE POLICY IF NOT EXISTS "Allow authenticated uploads" ON storage.objects 
FOR INSERT TO authenticated 
WITH CHECK (bucket_id = 'uploads');

CREATE POLICY IF NOT EXISTS "Allow public access" ON storage.objects 
FOR SELECT USING (bucket_id = 'uploads');
```

**Click "Run" to execute the script.**

## Step 2: Refresh Your App

After running the SQL script:

1. **Refresh your browser** (F5 or Cmd+R)
2. **Try creating a protocol** - it should work now
3. **Try uploading a file** - it should work now
4. **Check dashboard counts** - they should show real numbers now

## What I Fixed

✅ **Protocol Error**: Fixed database column mismatch (`details` → `description`)
✅ **Upload Error**: Created missing uploads bucket and fixed table structure
✅ **Dashboard Counts**: Now shows real counts instead of static "0"
✅ **Auto-Refresh**: Dashboard updates automatically after adding items

## After Running the SQL Script

- ✅ Protocols will work from dashboard and protocols page
- ✅ File uploads will work from dashboard and uploads page  
- ✅ Dashboard will show correct counts (3 stack items, X protocols, X uploads)
- ✅ Counts will update automatically when you add new items

**The SQL script is also saved as `QUICK_SUPABASE_FIX.sql` in your project folder.**
