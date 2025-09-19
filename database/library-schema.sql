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

-- Add column comments
COMMENT ON COLUMN library_items.profile_id IS 'References profiles.id (not auth.users.id directly)';
COMMENT ON COLUMN library_items.category IS 'Document category: lab, assessment, training_plan, nutrition, wearable_report, mindfulness, recovery, other';
COMMENT ON COLUMN library_items.date IS 'Date the document applies to (test date, plan start, etc.)';
COMMENT ON COLUMN library_items.provider IS 'Lab company, coach, app name, etc.';
COMMENT ON COLUMN library_items.summary_public IS 'Short description visible on public profile (1-2 lines)';
COMMENT ON COLUMN library_items.notes_private IS 'Private notes only visible to the owner';
COMMENT ON COLUMN library_items.tags IS 'Array of tags for organization and filtering';
COMMENT ON COLUMN library_items.file_url IS 'Supabase storage path to the file';
COMMENT ON COLUMN library_items.file_type IS 'MIME type (application/pdf, image/png, etc.)';
COMMENT ON COLUMN library_items.file_size IS 'File size in bytes';
COMMENT ON COLUMN library_items.thumbnail_url IS 'Optional thumbnail/preview image path';
COMMENT ON COLUMN library_items.is_public IS 'Whether item appears on public profile (default: false)';
COMMENT ON COLUMN library_items.allow_download IS 'Whether public visitors can download the file (default: false)';
COMMENT ON COLUMN library_items.is_featured IS 'Featured "Current Plan" badge (only one per user for training_plan)';

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

-- Test the schema
SELECT 'Library schema created successfully!' as status;

-- Show the table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'library_items' 
ORDER BY ordinal_position;
