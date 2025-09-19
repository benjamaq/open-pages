-- Quick fix for gear table creation
-- Run this in your Supabase SQL Editor if the gear table doesn't exist

-- Check if table exists first
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public'
   AND table_name = 'gear'
);

-- If the above returns false, run this:
CREATE TABLE IF NOT EXISTS gear (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  brand text,
  model text,
  category text NOT NULL DEFAULT 'Other',
  description text,
  buy_link text,
  public boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE gear ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies
CREATE POLICY "Users can view own gear" ON gear
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own gear" ON gear
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own gear" ON gear
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own gear" ON gear
  FOR DELETE USING (auth.uid() = user_id);

-- Allow public access to public gear
CREATE POLICY "Public gear is viewable by everyone" ON gear
  FOR SELECT USING (public = true);

-- Test the table
SELECT 'Gear table created successfully!' as status;
