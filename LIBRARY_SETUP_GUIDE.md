# Library Module Setup Guide

The Library module requires database tables and storage buckets to be set up in Supabase. Follow these steps to enable the Library functionality:

## Step 1: Create Database Tables

Run the following SQL script in your Supabase SQL Editor:

```sql
-- File: database/library-schema.sql
-- BioStackr Library Module Schema
-- Replaces the basic "Files & Labs" with a comprehensive Library system
-- Run this in your Supabase SQL Editor

-- Create library_items table
CREATE TABLE library_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  category text NOT NULL CHECK (
    category IN (
      'lab', 'assessment', 'training_plan', 'nutrition',
      'wearable_report', 'mindfulness', 'recovery', 'other'
    )
  ),
  date date NOT NULL DEFAULT CURRENT_DATE,
  provider text, -- Labcorp, Oura, Coach name, etc.
  summary_public text, -- 1-2 lines visible publicly
  notes_private text, -- private notes for user only
  tags text[], -- ["lipids", "5x5", "sauna"]
  file_url text NOT NULL, -- storage path
  file_type text NOT NULL, -- mime type
  file_size integer, -- bytes
  thumbnail_url text, -- first page/thumb webp (optional)
  is_public boolean NOT NULL DEFAULT false,
  allow_download boolean NOT NULL DEFAULT false,
  is_featured boolean NOT NULL DEFAULT false, -- only for training_plan
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add table comment
COMMENT ON TABLE library_items IS 'User library for labs, plans, reports, and other health documents';

-- Create indexes for performance
CREATE INDEX library_items_profile_id_idx ON library_items(profile_id);
CREATE INDEX library_items_category_idx ON library_items(category);
CREATE INDEX library_items_date_idx ON library_items(date DESC);
CREATE INDEX library_items_public_idx ON library_items(is_public);
CREATE INDEX library_items_featured_idx ON library_items(is_featured) WHERE is_featured = true;
CREATE INDEX library_items_profile_public_idx ON library_items(profile_id, is_public);
CREATE INDEX library_items_profile_category_idx ON library_items(profile_id, category);

-- Ensure only one featured training plan per user
CREATE UNIQUE INDEX one_featured_training_plan_per_user 
ON library_items (profile_id) 
WHERE (category = 'training_plan' AND is_featured = true);

-- Enable RLS
ALTER TABLE library_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view all their own library items
CREATE POLICY "Users can view their own library items" ON library_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = library_items.profile_id 
      AND profiles.user_id = auth.uid()
    )
  );

-- Public library items are viewable by everyone
CREATE POLICY "Public library items are viewable by everyone" ON library_items
  FOR SELECT USING (is_public = true);

-- Users can insert library items for their own profiles
CREATE POLICY "Users can insert library items for their own profiles" ON library_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = library_items.profile_id 
      AND profiles.user_id = auth.uid()
    )
  );

-- Users can update their own library items
CREATE POLICY "Users can update their own library items" ON library_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = library_items.profile_id 
      AND profiles.user_id = auth.uid()
    )
  );

-- Users can delete their own library items
CREATE POLICY "Users can delete their own library items" ON library_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = library_items.profile_id 
      AND profiles.user_id = auth.uid()
    )
  );

-- Add updated_at trigger
CREATE TRIGGER update_library_items_updated_at 
  BEFORE UPDATE ON library_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add show_library column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS show_library boolean NOT NULL DEFAULT true;
COMMENT ON COLUMN profiles.show_library IS 'Whether to show Library section on public profile';
```

## Step 2: Create Storage Bucket

Run this SQL script to create the library storage bucket:

```sql
-- File: database/library-storage-setup.sql
-- Library Storage Bucket Setup
-- Run this in your Supabase SQL Editor AFTER running library-schema.sql

-- Create the library storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'library',
  'library',
  false, -- Private by default, access controlled by RLS
  20971520, -- 20MB limit
  ARRAY[
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/webp',
    'text/csv',
    'text/plain',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
);

-- RLS Policies for library bucket
-- Users can upload to their own folder
CREATE POLICY "Users can upload to their own library folder" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'library' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can view their own files
CREATE POLICY "Users can view their own library files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'library' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can update their own files
CREATE POLICY "Users can update their own library files" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'library' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can delete their own files
CREATE POLICY "Users can delete their own library files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'library' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Public access for public library items (handled by application logic)
CREATE POLICY "Public access to public library files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'library' AND
    EXISTS (
      SELECT 1 FROM library_items 
      WHERE library_items.file_url = storage.objects.name
      AND library_items.is_public = true
    )
  );
```

## Step 3: Verify Setup

After running both scripts, you should see:

1. A new `library_items` table in your Supabase database
2. A new `library` storage bucket in your Supabase storage
3. The Library module should now work without errors

## Troubleshooting

### Common Issues:

1. **"relation library_items does not exist"**
   - Make sure you ran the library-schema.sql script
   - Check that the script completed without errors

2. **"bucket library does not exist"**
   - Make sure you ran the library-storage-setup.sql script
   - Check the Storage section in your Supabase dashboard

3. **Upload errors**
   - Verify the storage bucket policies are set up correctly
   - Check file size limits (20MB max)
   - Ensure file types are allowed

### File Type Support:
- PDF documents
- Images (PNG, JPEG, WebP)
- CSV files
- Text files
- Word documents (DOCX)

### Features Available:
- ✅ Private document storage
- ✅ Public sharing with permission controls
- ✅ Category organization (8 categories)
- ✅ Search and filtering
- ✅ Featured training plans
- ✅ Tag system
- ✅ File preview and download
- ✅ Public profile integration

Once set up, users can upload lab results, training plans, assessments, and other health documents to their personal library and optionally share them on their public profiles.
