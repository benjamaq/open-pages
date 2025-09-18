# Fix Avatar Upload Issue

## The Problem
The "Failed to upload avatar" error occurs because the Supabase Storage bucket for avatars hasn't been created yet.

## Quick Fix Steps

### 1. Create the Avatars Storage Bucket

1. **Go to your Supabase Dashboard**
   - Visit [supabase.com](https://supabase.com)
   - Sign in to your account
   - Select your Open Pages project

2. **Navigate to Storage**
   - Click on "Storage" in the left sidebar
   - Click "New bucket"

3. **Create the Bucket**
   - **Name**: `avatars`
   - **Public bucket**: ✅ Check this box
   - Click "Create bucket"

### 2. Set Up Storage Policies

1. **Go to the SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

2. **Run this SQL code**:
```sql
-- Allow users to upload their own avatars
CREATE POLICY "Users can upload their own avatars" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public access to view avatars
CREATE POLICY "Public can view avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');
```

3. **Click "Run"** to execute the SQL

### 3. Test the Fix

1. **Restart your development server**:
   ```bash
   npm run dev
   ```

2. **Try creating a profile with an avatar**:
   - Go to `http://localhost:3009/dash/create-profile`
   - Fill out the form and upload an image
   - The avatar should now upload successfully

## Alternative: Skip Avatar Upload

If you want to test the profile creation without setting up storage, the app will now:
- Show a warning message if avatar upload fails
- Still create the profile successfully without the avatar
- Allow you to add an avatar later

## What This Fixes

- ✅ Avatar uploads will work properly
- ✅ Users can see their profile pictures
- ✅ Public profiles will display avatars correctly
- ✅ No more "Failed to upload avatar" errors

## Next Steps

After setting up the storage bucket:
1. Test profile creation with an avatar
2. Check that the avatar appears in the dashboard
3. Verify the avatar shows up on the public profile page
