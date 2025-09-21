-- Fix missing database tables
-- Run this in your Supabase SQL editor

-- Create user_subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL DEFAULT 'free' CHECK (plan_type IN ('free', 'pro', 'creator')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create plan_limits table
CREATE TABLE IF NOT EXISTS plan_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('free', 'pro', 'creator')),
  feature_name TEXT NOT NULL,
  limit_value INTEGER,
  is_unlimited BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(plan_type, feature_name)
);

-- Insert plan limits
INSERT INTO plan_limits (plan_type, feature_name, limit_value, is_unlimited) VALUES
-- Free plan limits
('free', 'supplements', 10, FALSE),
('free', 'protocols', 3, FALSE),
('free', 'movement', 3, FALSE),
('free', 'mindfulness', 3, FALSE),
('free', 'library_files', 5, FALSE),
('free', 'gear_items', 5, FALSE),

-- Pro plan limits (unlimited)
('pro', 'supplements', NULL, TRUE),
('pro', 'protocols', NULL, TRUE),
('pro', 'movement', NULL, TRUE),
('pro', 'mindfulness', NULL, TRUE),
('pro', 'library_files', NULL, TRUE),
('pro', 'gear_items', NULL, TRUE),

-- Creator plan limits (unlimited)
('creator', 'supplements', NULL, TRUE),
('creator', 'protocols', NULL, TRUE),
('creator', 'movement', NULL, TRUE),
('creator', 'mindfulness', NULL, TRUE),
('creator', 'library_files', NULL, TRUE),
('creator', 'gear_items', NULL, TRUE)
ON CONFLICT (plan_type, feature_name) DO NOTHING;

-- Enable RLS
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_limits ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_subscriptions
CREATE POLICY "Users can view own subscription" ON user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription" ON user_subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert subscriptions" ON user_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for plan_limits
CREATE POLICY "Anyone can view plan limits" ON plan_limits
  FOR SELECT USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_plan_limits_plan_type ON plan_limits(plan_type);

-- Insert default subscriptions for existing users
INSERT INTO user_subscriptions (user_id, plan_type, status)
SELECT id, 'free', 'active'
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM user_subscriptions WHERE user_id IS NOT NULL)
ON CONFLICT (user_id) DO NOTHING;
