# Files and Labs Storage Setup Guide

## Issue
The Files and Labs module is showing "Storage not set up. Available buckets: none. Please create the 'uploads' bucket in Supabase Dashboard" error when trying to upload files.

## Solution

### Step 1: Create the Uploads Bucket in Supabase Dashboard

1. **Go to your Supabase Dashboard**
   - Navigate to your project: https://supabase.com/dashboard/project/[your-project-id]

2. **Go to Storage section**
   - Click on "Storage" in the left sidebar
   - Click on "Buckets" tab

3. **Create the uploads bucket**
   - Click "Create bucket" button
   - **Bucket name:** `uploads`
   - **Public bucket:** ✅ **ENABLE THIS** (very important!)
   - **File size limit:** 10 MB
   - **Allowed MIME types:** 
     - `image/jpeg`
     - `image/png` 
     - `image/gif`
     - `image/webp`
     - `application/pdf`
   - Click "Create bucket"

### Step 2: Set Up RLS Policies (Optional - via SQL)

If you want more granular control, you can run the SQL in `UPLOADS_BUCKET_SETUP.sql`:

1. Go to **SQL Editor** in your Supabase Dashboard
2. Copy and paste the contents of `UPLOADS_BUCKET_SETUP.sql`
3. Click "Run" to execute the policies

### Step 3: Verify Setup

1. **Check bucket exists:**
   - Go to Storage > Buckets
   - You should see both "avatars" and "uploads" buckets
   - Both should be marked as "Public"

2. **Test upload:**
   - Go to your app: http://localhost:3009/dash/uploads
   - Click "Upload File"
   - Try uploading a test image or PDF
   - Should work without errors

## Bucket Configuration Summary

You should have these buckets configured:

### avatars bucket (for profile photos)
- **Name:** `avatars`
- **Public:** ✅ Yes
- **File types:** Images only (JPEG, PNG, GIF, WebP)
- **Size limit:** 10MB

### uploads bucket (for Files and Labs)
- **Name:** `uploads`  
- **Public:** ✅ Yes
- **File types:** Images + PDFs (JPEG, PNG, GIF, WebP, PDF)
- **Size limit:** 10MB

## Troubleshooting

### If you still get bucket errors:

1. **Double-check bucket names are exact:**
   - `avatars` (lowercase, plural)
   - `uploads` (lowercase, plural)

2. **Ensure buckets are public:**
   - In Storage > Buckets, check the "Public" column shows "Yes"

3. **Check your .env.local file has correct Supabase credentials:**
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

4. **Restart your development server after creating buckets:**
   ```bash
   pkill -f "next dev" && npm run dev
   ```

### If uploads still fail in Chrome:
- Use Safari for testing (Chrome has localhost file upload restrictions)
- Or set up HTTPS for local development

## Files Modified
- `src/lib/storage.ts` - Contains upload logic for both buckets
- `src/app/api/upload/route.ts` - API endpoint that handles file uploads
- `src/components/AddUploadForm.tsx` - Upload form with browser compatibility notices
