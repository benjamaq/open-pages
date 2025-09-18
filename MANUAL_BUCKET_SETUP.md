# 🛠️ **MANUAL BUCKET SETUP - Required**

The automatic bucket creation isn't working, so we need to set up storage buckets manually in Supabase.

## **🎯 Step 1: Go to Supabase Dashboard**

1. **Open your Supabase project** at https://supabase.com/dashboard
2. **Select your Open Pages project**
3. **Go to Storage** in the left sidebar

## **🪣 Step 2: Create Storage Buckets**

### **Create "avatars" Bucket:**
1. **Click "New bucket"**
2. **Name**: `avatars`
3. **Public bucket**: ✅ **Check this box**
4. **File size limit**: `10 MB`
5. **Allowed MIME types**: 
   ```
   image/jpeg
   image/png  
   image/gif
   image/webp
   ```
6. **Click "Create bucket"**

### **Create "uploads" Bucket:**
1. **Click "New bucket"** again
2. **Name**: `uploads`
3. **Public bucket**: ✅ **Check this box**
4. **File size limit**: `10 MB`
5. **Allowed MIME types**:
   ```
   image/jpeg
   image/png
   image/gif
   image/webp
   application/pdf
   ```
6. **Click "Create bucket"**

## **🔒 Step 3: Set Up RLS Policies**

### **For "avatars" bucket:**
1. **Click on "avatars" bucket**
2. **Go to "Policies" tab**
3. **Click "New policy"**
4. **Choose "Custom policy"**
5. **Policy name**: `Allow authenticated uploads to avatars`
6. **Policy definition**:
   ```sql
   FOR INSERT TO authenticated
   WITH CHECK (bucket_id = 'avatars')
   ```
7. **Click "Save policy"**

8. **Create another policy**:
   - **Policy name**: `Allow public access to avatars`
   - **Policy definition**:
     ```sql
     FOR SELECT
     USING (bucket_id = 'avatars')
     ```

### **For "uploads" bucket:**
1. **Click on "uploads" bucket**
2. **Go to "Policies" tab**
3. **Create policies** (same as above but replace `'avatars'` with `'uploads'`)

## **⚡ Step 4: Alternative - Use SQL Editor**

**If the UI is confusing, use this SQL instead:**

1. **Go to SQL Editor** in Supabase
2. **Create new query**
3. **Paste and run this**:

```sql
-- Create avatars bucket
INSERT INTO storage.buckets (id, name, public, allowed_mime_types, file_size_limit)
VALUES (
  'avatars', 
  'avatars', 
  true, 
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  10485760
) ON CONFLICT (id) DO NOTHING;

-- Create uploads bucket  
INSERT INTO storage.buckets (id, name, public, allowed_mime_types, file_size_limit)
VALUES (
  'uploads', 
  'uploads', 
  true, 
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'],
  10485760
) ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create policies for avatars
CREATE POLICY IF NOT EXISTS "Allow authenticated uploads to avatars" 
ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'avatars');

CREATE POLICY IF NOT EXISTS "Allow public access to avatars" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'avatars');

-- Create policies for uploads
CREATE POLICY IF NOT EXISTS "Allow authenticated uploads to uploads" 
ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'uploads');

CREATE POLICY IF NOT EXISTS "Allow public access to uploads" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'uploads');

-- Allow updates and deletes for authenticated users
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
```

## **✅ Step 5: Verify Setup**

1. **Go back to Storage** in Supabase
2. **You should see**:
   - ✅ `avatars` bucket (public)
   - ✅ `uploads` bucket (public)
3. **Check policies**: Each bucket should have 2-4 policies

## **🧪 Step 6: Test Uploads**

1. **Go to your Open Pages dashboard**
2. **Try uploading**:
   - Profile photo (uses `avatars` bucket)
   - Background image (uses `uploads` bucket)
3. **Should work without "bucket not found" error**

## **🚨 Common Issues:**

### **If SQL fails:**
- **Check permissions**: Make sure you're the project owner
- **Storage enabled**: Verify Storage is enabled in project settings
- **Run one by one**: Try running each SQL statement separately

### **If uploads still fail:**
- **Check browser console** for specific error messages
- **Verify bucket names**: Should be exactly `avatars` and `uploads`
- **Check RLS policies**: Make sure they're created and enabled

## **📞 Next Steps:**

**After running the manual setup:**
1. **Refresh your dashboard page**
2. **Try uploading again**
3. **Check browser console** for success messages
4. **Report back** if it's working or what error you see

**This manual setup should resolve the "bucket not found" issue! 🪣✨**