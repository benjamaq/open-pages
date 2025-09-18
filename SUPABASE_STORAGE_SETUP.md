# Supabase Storage Setup Guide

## Issues Fixed

### 1. **Row-Level Security (RLS) Policy Violation**
- ✅ **Root Cause**: Profile creation was using client-side Supabase client instead of server-side
- ✅ **Solution**: Created server action `createProfile()` that uses server-side authentication
- ✅ **Result**: RLS policies now work correctly with proper user context

### 2. **Storage Bucket Not Found**
- ✅ **Root Cause**: Avatars storage bucket doesn't exist in Supabase
- ✅ **Solution**: Created storage setup script and improved bucket creation logic
- ✅ **Result**: Bucket is automatically created if it doesn't exist

## Setup Instructions

### Step 1: Run the Storage Setup SQL

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Run the following SQL script:

```sql
-- Create avatars storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
);

-- RLS Policies for avatars bucket
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatars" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own avatars" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own avatars" ON storage.objects
FOR DELETE USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

### Step 2: Verify Setup

1. Go to **Storage** in your Supabase Dashboard
2. You should see an `avatars` bucket
3. The bucket should be public and have the correct file size limits

### Step 3: Test Profile Creation

1. Go to `http://localhost:3009/auth/signup`
2. Create a new account
3. You should be redirected to `/dash/create-profile`
4. Fill out the form and try uploading an avatar
5. The profile should be created successfully

## Technical Details

### Server Action Implementation
- **File**: `src/lib/actions/profile.ts`
- **Purpose**: Handles profile creation with proper server-side authentication
- **Benefits**: RLS policies work correctly, better security

### Storage Bucket Configuration
- **Bucket Name**: `avatars`
- **Public Access**: Yes (for displaying avatars)
- **File Size Limit**: 5MB
- **Allowed Types**: JPEG, PNG, WebP, GIF
- **RLS Policies**: Users can only upload/update/delete their own avatars

### Error Handling
- **Bucket Creation**: Automatically creates bucket if it doesn't exist
- **Upload Failures**: Profile creation continues without avatar if upload fails
- **User Feedback**: Clear error messages for different failure scenarios

## Troubleshooting

### If you still get "Bucket not found" errors:
1. Check that the SQL script ran successfully
2. Verify the bucket exists in Supabase Storage dashboard
3. Check that RLS policies are properly set

### If you get RLS policy violations:
1. Ensure you're using the server action for profile creation
2. Check that the user is properly authenticated
3. Verify the RLS policies in the database

### If avatar uploads fail:
1. Check file size (must be under 5MB)
2. Check file type (must be JPEG, PNG, WebP, or GIF)
3. Check browser console for detailed error messages

## Files Modified

1. **`src/lib/actions/profile.ts`** - New server action for profile creation
2. **`src/app/dash/create-profile/page.tsx`** - Updated to use server action
3. **`database/storage-setup.sql`** - SQL script for storage setup
4. **`src/lib/storage.ts`** - Enhanced bucket creation logic

The profile creation system should now work correctly with both RLS policies and avatar uploads!
