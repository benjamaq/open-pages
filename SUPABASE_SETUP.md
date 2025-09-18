# Supabase Setup for Open Pages

## Required Setup Steps

### 1. Database Schema
Run the SQL from `database/schema.sql` in your Supabase SQL editor to create all necessary tables and policies.

### 2. Storage Bucket for Avatars
Create a storage bucket for user avatars:

1. Go to Storage in your Supabase dashboard
2. Create a new bucket named `avatars`
3. Set it to public
4. Configure the following RLS policy:

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

### 3. Environment Variables
Make sure your `.env.local` file contains:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Profile Creation Flow

1. User signs up and confirms email
2. User visits `/dash` - if no profile exists, redirected to `/dash/create-profile`
3. User fills out profile form with display name, bio, and optional avatar
4. System generates unique slug from display name + random numbers
5. Profile is created and user is redirected back to `/dash`
6. User can view their public profile at `/u/[slug]`

## Features Implemented

- ✅ Profile creation form with real-time slug preview
- ✅ Unique slug generation with conflict checking
- ✅ Avatar upload to Supabase Storage
- ✅ Dashboard integration with profile check
- ✅ Public profile pages with real data
- ✅ Proper error handling and loading states
- ✅ Responsive design following Digital Granite style
