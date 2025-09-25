-- Waitlist signups table
-- Run this in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS waitlist_signups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  source TEXT DEFAULT 'website',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'notified', 'converted'))
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_waitlist_signups_email ON waitlist_signups(email);
CREATE INDEX IF NOT EXISTS idx_waitlist_signups_created_at ON waitlist_signups(created_at);

-- Enable RLS
ALTER TABLE waitlist_signups ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can insert waitlist signups" ON waitlist_signups
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view waitlist signups" ON waitlist_signups
  FOR SELECT USING (true);

-- Function to get waitlist stats
CREATE OR REPLACE FUNCTION get_waitlist_stats()
RETURNS TABLE (
  total_signups BIGINT,
  pending_signups BIGINT,
  notified_signups BIGINT,
  converted_signups BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_signups,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_signups,
    COUNT(*) FILTER (WHERE status = 'notified') as notified_signups,
    COUNT(*) FILTER (WHERE status = 'converted') as converted_signups
  FROM waitlist_signups;
END;
$$ LANGUAGE plpgsql;
