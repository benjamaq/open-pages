-- Biostackr Freemium + Pro Schema
-- Run this in Supabase SQL Editor

-- 1. User subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('free', 'pro')) DEFAULT 'free',
  status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')) DEFAULT 'active',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- 2. Plan limits configuration
CREATE TABLE IF NOT EXISTS plan_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('free', 'pro')),
  feature_name TEXT NOT NULL,
  limit_value INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(plan_type, feature_name)
);

-- 3. User usage tracking
CREATE TABLE IF NOT EXISTS user_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature_name TEXT NOT NULL,
  current_count INTEGER DEFAULT 0,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, feature_name)
);

-- 4. Insert default plan limits
INSERT INTO plan_limits (plan_type, feature_name, limit_value) VALUES
-- Free tier limits
('free', 'supplements', 10),
('free', 'protocols', 3),
('free', 'movement', 2),
('free', 'mindfulness', 2),
('free', 'files', 5),
('free', 'file_storage_mb', 10),
('free', 'followers', 0),

-- Pro tier limits (unlimited = -1)
('pro', 'supplements', -1),
('pro', 'protocols', -1),
('pro', 'movement', -1),
('pro', 'mindfulness', -1),
('pro', 'files', 100),
('pro', 'file_storage_mb', 1024),
('pro', 'followers', -1)

ON CONFLICT (plan_type, feature_name) DO NOTHING;

-- 5. Pricing configuration table
CREATE TABLE IF NOT EXISTS pricing_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_type TEXT NOT NULL,
  price_monthly_cents INTEGER NOT NULL,
  price_yearly_cents INTEGER,
  currency TEXT NOT NULL DEFAULT 'USD',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(plan_type)
);

-- Insert Pro pricing (configurable for A/B testing)
INSERT INTO pricing_config (plan_type, price_monthly_cents, price_yearly_cents) VALUES
('pro', 999, 9990) -- $9.99/month, $99.90/year
ON CONFLICT (plan_type) DO UPDATE SET
  price_monthly_cents = EXCLUDED.price_monthly_cents,
  price_yearly_cents = EXCLUDED.price_yearly_cents;

-- 6. RLS Policies
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_config ENABLE ROW LEVEL SECURITY;

-- User can view/update their own subscription
CREATE POLICY "Users can view own subscription" ON user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription" ON user_subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- User can view/update their own usage
CREATE POLICY "Users can view own usage" ON user_usage
  FOR ALL USING (auth.uid() = user_id);

-- Anyone can view plan limits and pricing (public info)
CREATE POLICY "Anyone can view plan limits" ON plan_limits
  FOR SELECT USING (true);

CREATE POLICY "Anyone can view pricing" ON pricing_config
  FOR SELECT USING (is_active = true);

-- 7. Functions to check limits
CREATE OR REPLACE FUNCTION get_user_limit(user_uuid UUID, feature TEXT)
RETURNS INTEGER AS $$
DECLARE
  user_plan TEXT;
  limit_value INTEGER;
BEGIN
  -- Get user's current plan
  SELECT COALESCE(plan_type, 'free') INTO user_plan
  FROM user_subscriptions
  WHERE user_id = user_uuid AND status = 'active';
  
  -- Default to free if no subscription found
  IF user_plan IS NULL THEN
    user_plan := 'free';
  END IF;
  
  -- Get limit for this plan and feature
  SELECT pl.limit_value INTO limit_value
  FROM plan_limits pl
  WHERE pl.plan_type = user_plan AND pl.feature_name = feature;
  
  RETURN COALESCE(limit_value, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_usage_count(user_uuid UUID, feature TEXT)
RETURNS INTEGER AS $$
DECLARE
  usage_count INTEGER;
BEGIN
  SELECT COALESCE(current_count, 0) INTO usage_count
  FROM user_usage
  WHERE user_id = user_uuid AND feature_name = feature;
  
  RETURN COALESCE(usage_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION check_user_limit(user_uuid UUID, feature TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  current_usage INTEGER;
  user_limit INTEGER;
BEGIN
  current_usage := get_user_usage_count(user_uuid, feature);
  user_limit := get_user_limit(user_uuid, feature);
  
  -- -1 means unlimited
  IF user_limit = -1 THEN
    RETURN true;
  END IF;
  
  RETURN current_usage < user_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Trigger to update usage counts
CREATE OR REPLACE FUNCTION update_usage_count()
RETURNS TRIGGER AS $$
DECLARE
  feature_name TEXT;
  user_uuid UUID;
BEGIN
  -- Determine feature name based on table
  IF TG_TABLE_NAME = 'stack_items' THEN
    feature_name := NEW.item_type || 's'; -- 'supplement' -> 'supplements'
    user_uuid := (SELECT user_id FROM profiles WHERE id = NEW.profile_id);
  ELSIF TG_TABLE_NAME = 'uploads' THEN
    feature_name := 'files';
    user_uuid := (SELECT user_id FROM profiles WHERE id = NEW.profile_id);
  END IF;
  
  IF feature_name IS NOT NULL AND user_uuid IS NOT NULL THEN
    -- Update usage count
    INSERT INTO user_usage (user_id, feature_name, current_count, last_updated)
    VALUES (user_uuid, feature_name, 1, now())
    ON CONFLICT (user_id, feature_name)
    DO UPDATE SET 
      current_count = user_usage.current_count + 1,
      last_updated = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for usage tracking
DROP TRIGGER IF EXISTS track_stack_items_usage ON stack_items;
CREATE TRIGGER track_stack_items_usage
  AFTER INSERT ON stack_items
  FOR EACH ROW EXECUTE FUNCTION update_usage_count();

-- 9. Initialize existing users as free tier
INSERT INTO user_subscriptions (user_id, plan_type, status)
SELECT DISTINCT user_id, 'free', 'active'
FROM profiles
WHERE user_id NOT IN (SELECT user_id FROM user_subscriptions)
ON CONFLICT (user_id) DO NOTHING;

-- 10. Update existing usage counts
INSERT INTO user_usage (user_id, feature_name, current_count)
SELECT 
  p.user_id,
  si.item_type || 's' as feature_name,
  COUNT(*) as current_count
FROM profiles p
JOIN stack_items si ON si.profile_id = p.id
GROUP BY p.user_id, si.item_type
ON CONFLICT (user_id, feature_name) DO UPDATE SET
  current_count = EXCLUDED.current_count,
  last_updated = now();
