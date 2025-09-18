-- Create journal_entries table
CREATE TABLE journal_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  heading TEXT,
  body TEXT NOT NULL,
  public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see their own entries
CREATE POLICY "Users can view own journal entries" ON journal_entries
  FOR SELECT USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Policy: Users can insert their own entries
CREATE POLICY "Users can insert own journal entries" ON journal_entries
  FOR INSERT WITH CHECK (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Policy: Users can update their own entries
CREATE POLICY "Users can update own journal entries" ON journal_entries
  FOR UPDATE USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Policy: Users can delete their own entries
CREATE POLICY "Users can delete own journal entries" ON journal_entries
  FOR DELETE USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Policy: Public entries can be viewed by anyone
CREATE POLICY "Public journal entries are viewable by everyone" ON journal_entries
  FOR SELECT USING (public = true);

-- Add show_journal_public column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS show_journal_public BOOLEAN DEFAULT true;

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
