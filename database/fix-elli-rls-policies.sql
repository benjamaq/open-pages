-- Fix RLS policies for elli_messages table
-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view their own Elli messages" ON elli_messages;
DROP POLICY IF EXISTS "Users can insert their own Elli messages" ON elli_messages;
DROP POLICY IF EXISTS "Users can update their own Elli messages" ON elli_messages;

-- Create new policies
CREATE POLICY "Users can view their own Elli messages"
  ON elli_messages
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own Elli messages"
  ON elli_messages
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own Elli messages"
  ON elli_messages
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Also ensure the table exists with proper structure
CREATE TABLE IF NOT EXISTS elli_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  message_type TEXT NOT NULL,
  message_text TEXT NOT NULL,
  context JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  dismissed BOOLEAN DEFAULT FALSE
);

-- Enable RLS
ALTER TABLE elli_messages ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS elli_messages_user_id_idx ON elli_messages(user_id);
CREATE INDEX IF NOT EXISTS elli_messages_created_at_idx ON elli_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS elli_messages_type_idx ON elli_messages(message_type);
CREATE INDEX IF NOT EXISTS elli_messages_dismissed_idx ON elli_messages(dismissed);
