-- Create stack_followers table and related tables
-- Run this in your Supabase SQL editor

-- Create stack_followers table
CREATE TABLE IF NOT EXISTS stack_followers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  follower_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  follower_email TEXT,                           -- for email-only follows
  "verify_token" TEXT,                           -- hashed token for double opt-in
  verified_at TIMESTAMPTZ,                       -- set after click
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add unique constraints after table creation
-- For user-based follows (follower_user_id is not null)
ALTER TABLE stack_followers 
ADD CONSTRAINT unique_user_follower_per_owner 
UNIQUE (owner_user_id, follower_user_id);

-- For email-based follows (follower_email is not null)
ALTER TABLE stack_followers 
ADD CONSTRAINT unique_email_follower_per_owner 
UNIQUE (owner_user_id, follower_email);

-- Create email_prefs table
CREATE TABLE IF NOT EXISTS email_prefs (
  follower_id UUID PRIMARY KEY REFERENCES stack_followers(id) ON DELETE CASCADE,
  cadence TEXT NOT NULL CHECK (cadence IN ('off','daily','weekly')) DEFAULT 'weekly',
  last_digest_sent_at TIMESTAMPTZ           -- for guardrails/rate-limits
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_stack_followers_owner ON stack_followers(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_stack_followers_follower_user ON stack_followers(follower_user_id) WHERE follower_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_stack_followers_email ON stack_followers(follower_email) WHERE follower_email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_stack_followers_verify_token ON stack_followers("verify_token") WHERE "verify_token" IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_email_prefs_cadence ON email_prefs(cadence) WHERE cadence != 'off';
CREATE INDEX IF NOT EXISTS idx_email_prefs_last_sent ON email_prefs(last_digest_sent_at);

-- Enable Row Level Security (RLS)
ALTER TABLE stack_followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_prefs ENABLE ROW LEVEL SECURITY;

-- Stack followers policies
CREATE POLICY "Users can view followers of their own stacks" ON stack_followers
  FOR SELECT USING (
    owner_user_id = auth.uid()
  );

CREATE POLICY "Users can view their own follows" ON stack_followers
  FOR SELECT USING (
    follower_user_id = auth.uid() OR 
    follower_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

CREATE POLICY "Anyone can create follows (with verification)" ON stack_followers
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can delete their own follows" ON stack_followers
  FOR DELETE USING (
    follower_user_id = auth.uid() OR 
    owner_user_id = auth.uid()
  );

-- Email preferences policies
CREATE POLICY "Followers can manage their own email preferences" ON email_prefs
  FOR ALL USING (
    follower_id IN (
      SELECT id FROM stack_followers 
      WHERE follower_user_id = auth.uid()
    )
  );

-- Verify the tables were created
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('stack_followers', 'email_prefs')
ORDER BY table_name, ordinal_position;
