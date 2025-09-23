-- Complete follower setup - handles existing tables gracefully
-- Run this in your Supabase SQL editor

-- First, let's check what tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('stack_followers', 'email_prefs');

-- Create stack_followers table if it doesn't exist
CREATE TABLE IF NOT EXISTS stack_followers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  follower_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  follower_email TEXT,
  "verify_token" TEXT,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add constraints only if they don't exist
DO $$ 
BEGIN
    -- Add unique constraint for user-based follows
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'unique_user_follower_per_owner'
    ) THEN
        ALTER TABLE stack_followers 
        ADD CONSTRAINT unique_user_follower_per_owner 
        UNIQUE (owner_user_id, follower_user_id);
    END IF;
    
    -- Add unique constraint for email-based follows
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'unique_email_follower_per_owner'
    ) THEN
        ALTER TABLE stack_followers 
        ADD CONSTRAINT unique_email_follower_per_owner 
        UNIQUE (owner_user_id, follower_email);
    END IF;
END $$;

-- Create email_prefs table if it doesn't exist
CREATE TABLE IF NOT EXISTS email_prefs (
  follower_id UUID PRIMARY KEY REFERENCES stack_followers(id) ON DELETE CASCADE,
  cadence TEXT NOT NULL CHECK (cadence IN ('off','daily','weekly')) DEFAULT 'weekly',
  last_digest_sent_at TIMESTAMPTZ
);

-- Create indexes for performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_stack_followers_owner ON stack_followers(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_stack_followers_follower_user ON stack_followers(follower_user_id) WHERE follower_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_stack_followers_email ON stack_followers(follower_email) WHERE follower_email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_stack_followers_verify_token ON stack_followers("verify_token") WHERE "verify_token" IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_email_prefs_cadence ON email_prefs(cadence) WHERE cadence != 'off';
CREATE INDEX IF NOT EXISTS idx_email_prefs_last_sent ON email_prefs(last_digest_sent_at);

-- Enable Row Level Security (RLS)
ALTER TABLE stack_followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_prefs ENABLE ROW LEVEL SECURITY;

-- Create policies (drop and recreate to avoid conflicts)
DROP POLICY IF EXISTS "Users can view followers of their own stacks" ON stack_followers;
DROP POLICY IF EXISTS "Users can view their own follows" ON stack_followers;
DROP POLICY IF EXISTS "Anyone can create follows (with verification)" ON stack_followers;
DROP POLICY IF EXISTS "Users can delete their own follows" ON stack_followers;
DROP POLICY IF EXISTS "Followers can manage their own email preferences" ON email_prefs;

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

-- Verify the tables were created successfully
SELECT 
  'stack_followers' as table_name,
  COUNT(*) as row_count
FROM stack_followers
UNION ALL
SELECT 
  'email_prefs' as table_name,
  COUNT(*) as row_count
FROM email_prefs;
