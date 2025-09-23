-- Follow Stack Feature Database Schema

-- 1) Owners can allow following
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS allow_stack_follow BOOLEAN NOT NULL DEFAULT false;

-- 2) Owners can show follower count on public profile
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS show_public_followers BOOLEAN NOT NULL DEFAULT true;

-- 3) Followers (signed-in or email-only) with double opt-in
CREATE TABLE IF NOT EXISTS stack_followers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  follower_user_id UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
  follower_email TEXT,                           -- for email-only follows
  verify_token TEXT,                             -- hashed token for double opt-in
  verified_at TIMESTAMPTZ,                       -- set after click
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (owner_user_id, COALESCE(follower_user_id::text, follower_email))
);

-- 4) Per-follower email cadence
CREATE TABLE IF NOT EXISTS email_prefs (
  follower_id UUID PRIMARY KEY REFERENCES stack_followers(id) ON DELETE CASCADE,
  cadence TEXT NOT NULL CHECK (cadence IN ('off','daily','weekly')) DEFAULT 'weekly',
  last_digest_sent_at TIMESTAMPTZ           -- for guardrails/rate-limits
);

-- 5) Change log for digest generation
CREATE TABLE IF NOT EXISTS stack_change_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  item_type TEXT NOT NULL,           -- 'supplement' | 'protocol' | 'movement' | 'mindfulness' | 'food' | 'uploads'
  item_id UUID NOT NULL,
  change_type TEXT NOT NULL,         -- 'added' | 'removed' | 'updated'
  fields JSONB,                      -- optional shape of what changed
  is_public BOOLEAN NOT NULL,        -- snapshot of visibility at change-time
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6) Email suppression log to prevent dupes within a window
CREATE TABLE IF NOT EXISTS email_suppression (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES stack_followers(id) ON DELETE CASCADE,
  owner_user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  event_window_start TIMESTAMPTZ NOT NULL,
  event_window_end TIMESTAMPTZ NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_stack_followers_owner ON stack_followers(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_stack_followers_follower_user ON stack_followers(follower_user_id) WHERE follower_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_stack_followers_email ON stack_followers(follower_email) WHERE follower_email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_stack_followers_verify_token ON stack_followers(verify_token) WHERE verify_token IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_stack_change_log_owner ON stack_change_log(owner_user_id, changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_stack_change_log_public ON stack_change_log(owner_user_id, is_public, changed_at DESC);

CREATE INDEX IF NOT EXISTS idx_email_prefs_cadence ON email_prefs(cadence) WHERE cadence != 'off';
CREATE INDEX IF NOT EXISTS idx_email_prefs_last_sent ON email_prefs(last_digest_sent_at);

-- RLS Policies
ALTER TABLE stack_followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_prefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE stack_change_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_suppression ENABLE ROW LEVEL SECURITY;

-- Stack followers policies
CREATE POLICY "Users can view followers of their own stacks" ON stack_followers
  FOR SELECT USING (
    owner_user_id IN (SELECT user_id FROM profiles WHERE user_id = auth.uid())
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
    owner_user_id IN (SELECT user_id FROM profiles WHERE user_id = auth.uid())
  );

-- Email preferences policies
CREATE POLICY "Followers can manage their own email preferences" ON email_prefs
  FOR ALL USING (
    follower_id IN (
      SELECT id FROM stack_followers 
      WHERE follower_user_id = auth.uid()
    )
  );

-- Stack change log policies  
CREATE POLICY "Users can view change logs for their own stacks" ON stack_change_log
  FOR SELECT USING (
    owner_user_id IN (SELECT user_id FROM profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create change logs for their own stacks" ON stack_change_log
  FOR INSERT WITH CHECK (
    owner_user_id IN (SELECT user_id FROM profiles WHERE user_id = auth.uid())
  );

-- Service role can manage all tables for digest generation
CREATE POLICY "Service role can manage stack followers" ON stack_followers
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage email preferences" ON email_prefs
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage change logs" ON stack_change_log
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage email suppression" ON email_suppression
  FOR ALL USING (auth.role() = 'service_role');

-- Helper functions
CREATE OR REPLACE FUNCTION generate_verify_token()
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Function to get follower count for a user
CREATE OR REPLACE FUNCTION get_follower_count(user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER 
    FROM stack_followers 
    WHERE owner_user_id = user_id 
    AND verified_at IS NOT NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user allows followers
CREATE OR REPLACE FUNCTION allows_followers(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT COALESCE(allow_stack_follow, false)
    FROM profiles 
    WHERE user_id = allows_followers.user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mask email addresses for privacy
CREATE OR REPLACE FUNCTION mask_email(email TEXT)
RETURNS TEXT AS $$
DECLARE
  parts TEXT[];
  username TEXT;
  domain TEXT;
  masked_username TEXT;
BEGIN
  IF email IS NULL OR email = '' THEN
    RETURN '';
  END IF;
  
  parts := string_to_array(email, '@');
  IF array_length(parts, 1) != 2 THEN
    RETURN 'invalid@email.com';
  END IF;
  
  username := parts[1];
  domain := parts[2];
  
  IF length(username) <= 2 THEN
    masked_username := username;
  ELSE
    masked_username := left(username, 1) || repeat('*', length(username) - 2) || right(username, 1);
  END IF;
  
  RETURN masked_username || '@' || domain;
END;
$$ LANGUAGE plpgsql;
