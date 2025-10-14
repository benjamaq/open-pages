-- Create table for Elli messages
-- This stores all of Elli's responses to users for history and context

CREATE TABLE IF NOT EXISTS elli_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  message_type TEXT NOT NULL, -- 'welcome', 'post_checkin', 'dashboard', 'milestone', 'post_supplement'
  message_text TEXT NOT NULL,
  context JSONB, -- Store check-in data, supplements, etc. that informed the message
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  dismissed BOOLEAN DEFAULT FALSE
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS elli_messages_user_id_idx ON elli_messages(user_id);
CREATE INDEX IF NOT EXISTS elli_messages_created_at_idx ON elli_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS elli_messages_type_idx ON elli_messages(message_type);
CREATE INDEX IF NOT EXISTS elli_messages_dismissed_idx ON elli_messages(dismissed);

-- Add RLS policies
ALTER TABLE elli_messages ENABLE ROW LEVEL SECURITY;

-- Users can only read their own Elli messages
CREATE POLICY "Users can view their own Elli messages"
  ON elli_messages
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own Elli messages (via API)
CREATE POLICY "Users can insert their own Elli messages"
  ON elli_messages
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own Elli messages (for dismissal)
CREATE POLICY "Users can update their own Elli messages"
  ON elli_messages
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Add comments for documentation
COMMENT ON TABLE elli_messages IS 'Stores all messages from Elli AI assistant to users';
COMMENT ON COLUMN elli_messages.message_type IS 'Type of message: welcome, post_checkin, dashboard, milestone, post_supplement';
COMMENT ON COLUMN elli_messages.context IS 'JSONB data about what informed this message (check-in data, supplements, patterns, etc.)';
COMMENT ON COLUMN elli_messages.dismissed IS 'Whether user has dismissed/closed this message';

