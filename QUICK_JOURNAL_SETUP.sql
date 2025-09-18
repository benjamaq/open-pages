-- Quick Journal Setup - Run this in Supabase SQL Editor
-- This creates just the journal_entries table so you can test journal functionality

-- Create journal_entries table
CREATE TABLE IF NOT EXISTS journal_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  heading TEXT,
  body TEXT NOT NULL,
  public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for journal_entries
CREATE POLICY "Users can view their own journal entries" ON journal_entries
  FOR SELECT USING (
    profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can view public journal entries" ON journal_entries
  FOR SELECT USING (public = true);

CREATE POLICY "Users can insert their own journal entries" ON journal_entries
  FOR INSERT WITH CHECK (
    profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update their own journal entries" ON journal_entries
  FOR UPDATE USING (
    profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete their own journal entries" ON journal_entries
  FOR DELETE USING (
    profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_journal_entries_updated_at
    BEFORE UPDATE ON journal_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add show_journal_public column to profiles if it doesn't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS show_journal_public BOOLEAN DEFAULT true;

-- Add public_modules column to fix module visibility persistence
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS public_modules JSONB DEFAULT '{
  "supplements": true,
  "protocols": true,
  "movement": true,
  "mindfulness": true,
  "food": true,
  "uploads": true,
  "journal": true
}'::jsonb;

-- Update existing profiles to have the default public_modules
UPDATE profiles 
SET public_modules = '{
  "supplements": true,
  "protocols": true,
  "movement": true,
  "mindfulness": true,
  "food": true,
  "uploads": true,
  "journal": true
}'::jsonb
WHERE public_modules IS NULL;
