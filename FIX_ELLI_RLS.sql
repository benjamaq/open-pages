-- Fix Elli Messages RLS Policy
-- Run this in Supabase SQL Editor

-- First, check if elli_messages table exists
SELECT table_name FROM information_schema.tables WHERE table_name = 'elli_messages';

-- If the table doesn't exist, create it:
CREATE TABLE IF NOT EXISTS elli_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_type TEXT NOT NULL,
  message TEXT NOT NULL,
  context JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE elli_messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policy to allow users to insert their own messages
CREATE POLICY "Users can insert their own elli messages" ON elli_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policy to allow users to read their own messages
CREATE POLICY "Users can read their own elli messages" ON elli_messages
  FOR SELECT USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_elli_messages_user_id ON elli_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_elli_messages_created_at ON elli_messages(created_at DESC);
