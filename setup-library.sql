-- BioStackr Library Module Setup Script
-- Run this entire script in your Supabase SQL Editor to enable the Library module
-- This combines both the database schema and storage setup

-- =====================================================
-- PART 1: Create library_items table
-- =====================================================

-- Create library_items table
CREATE TABLE IF NOT EXISTS library_items (
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

-- Create indexes for performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS library_items_profile_id_idx ON library_items(profile_id);
CREATE INDEX IF NOT EXISTS library_items_category_idx ON library_items(category);
CREATE INDEX IF NOT EXISTS library_items_date_idx ON library_items(date DESC);
CREATE INDEX IF NOT EXISTS library_items_public_idx ON library_items(is_public);
CREATE INDEX IF NOT EXISTS library_items_featured_idx ON library_items(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS library_items_profile_public_idx ON library_items(profile_id, is_public);
CREATE INDEX IF NOT EXISTS library_items_profile_category_idx ON library_items(profile_id, category);

-- Ensure only one featured training plan per user
DROP INDEX IF EXISTS one_featured_training_plan_per_user;
CREATE UNIQUE INDEX one_featured_training_plan_per_user 
ON library_items (profile_id) 
WHERE (category = 'training_plan' AND is_featured = true);

-- Enable RLS
ALTER TABLE library_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own library items" ON library_items;
DROP POLICY IF EXISTS "Public library items are viewable by everyone" ON library_items;
DROP POLICY IF EXISTS "Users can insert library items for their own profiles" ON library_items;
DROP POLICY IF EXISTS "Users can update their own library items" ON library_items;
DROP POLICY IF EXISTS "Users can delete their own library items" ON library_items;

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

-- Add updated_at trigger (only if function exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
    DROP TRIGGER IF EXISTS update_library_items_updated_at ON library_items;
    CREATE TRIGGER update_library_items_updated_at 
      BEFORE UPDATE ON library_items
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Add show_library column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS show_library boolean NOT NULL DEFAULT true;
COMMENT ON COLUMN profiles.show_library IS 'Whether to show Library section on public profile';

-- =====================================================
-- PART 2: Create storage bucket and policies
-- =====================================================

-- Create the library storage bucket (only if it doesn't exist)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM storage.buckets WHERE id = 'library'
);

-- Drop existing storage policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can upload to their own library folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own library files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own library files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own library files" ON storage.objects;
DROP POLICY IF EXISTS "Public access to public library files" ON storage.objects;

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

-- =====================================================
-- VERIFICATION: Check setup
-- =====================================================

-- Verify table exists
SELECT 'library_items table created successfully!' as status
WHERE EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_name = 'library_items'
);

-- Verify bucket exists
SELECT 'library bucket created successfully!' as status
WHERE EXISTS (
  SELECT 1 FROM storage.buckets 
  WHERE id = 'library'
);

-- Show final configuration
SELECT 
  'Setup Complete!' as status,
  (SELECT count(*) FROM information_schema.tables WHERE table_name = 'library_items') as table_exists,
  (SELECT count(*) FROM storage.buckets WHERE id = 'library') as bucket_exists;

-- Show bucket configuration
SELECT 
  id as bucket_id,
  name,
  public,
  file_size_limit,
  array_length(allowed_mime_types, 1) as allowed_file_types
FROM storage.buckets 
WHERE id = 'library';
