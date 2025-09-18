# 🔧 Step-by-Step Fix for Uploads

The uploads bucket already exists, so we just need to add the missing table columns and update the file size limit.

## Step 1: Fix Uploads Table (Run this SQL)

```sql
ALTER TABLE uploads ADD COLUMN IF NOT EXISTS file_type TEXT;
ALTER TABLE uploads ADD COLUMN IF NOT EXISTS file_size INTEGER;
```

## Step 2: Update Bucket File Size Limit (Run this SQL)

```sql
UPDATE storage.buckets 
SET file_size_limit = 10485760 
WHERE id = 'uploads';
```

## Step 3: Add Storage Policies (Run this SQL)

```sql
CREATE POLICY "uploads_public_read" ON storage.objects 
FOR SELECT USING (bucket_id = 'uploads');
```

If you get a "policy already exists" error, that's fine - just continue.

## Step 4: Test Upload

After running these 3 SQL commands:
1. **Refresh your browser**
2. **Try uploading a file** - it should work now with 10MB limit
3. **Check dashboard counts** - they should update after uploads

## What This Fixes:
- ✅ Adds missing `file_type` and `file_size` columns to uploads table
- ✅ Updates bucket to allow 10MB files (instead of 2MB)
- ✅ Ensures basic storage policies exist
- ✅ Doesn't try to recreate existing bucket
