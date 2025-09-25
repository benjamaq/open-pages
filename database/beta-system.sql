-- Beta System Database Schema
-- Run this in your Supabase SQL editor

-- Create beta_codes table
CREATE TABLE IF NOT EXISTS beta_codes (
  code TEXT PRIMARY KEY,
  used_by UUID REFERENCES auth.users(id),
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '6 months')
);

-- Add beta_code_used_at to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS beta_code_used_at TIMESTAMPTZ;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_beta_codes_used_by ON beta_codes(used_by);
CREATE INDEX IF NOT EXISTS idx_beta_codes_expires_at ON beta_codes(expires_at);

-- Enable RLS
ALTER TABLE beta_codes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view beta codes" ON beta_codes
  FOR SELECT USING (true);

CREATE POLICY "Users can update beta codes when using them" ON beta_codes
  FOR UPDATE USING (true);

-- Function to check if user is beta user (with expiration)
CREATE OR REPLACE FUNCTION is_beta_user(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM beta_codes 
    WHERE used_by = user_id 
    AND used_at IS NOT NULL
    AND expires_at > NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get effective tier (beta users get pro for 6 months)
CREATE OR REPLACE FUNCTION get_effective_tier(user_id UUID)
RETURNS TEXT AS $$
BEGIN
  IF is_beta_user(user_id) THEN
    RETURN 'pro';
  ELSE
    RETURN COALESCE(
      (SELECT tier FROM user_usage WHERE user_usage.user_id = user_id LIMIT 1),
      'free'
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
