-- Stripe Integration Database Updates
-- Run this in your Supabase SQL Editor

-- 1. Add Stripe-related columns to user_usage table
ALTER TABLE user_usage ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE user_usage ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE user_usage ADD COLUMN IF NOT EXISTS subscription_status TEXT;
ALTER TABLE user_usage ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMP WITH TIME ZONE;

-- 2. Add tier column to profiles table (for easier access)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'creator'));

-- 3. Update user_usage tier constraint to include 'creator'
ALTER TABLE user_usage DROP CONSTRAINT IF EXISTS user_usage_tier_check;
ALTER TABLE user_usage ADD CONSTRAINT user_usage_tier_check CHECK (tier IN ('free', 'pro', 'creator'));

-- 4. Add current_tier column to user_usage (for trial system compatibility)
ALTER TABLE user_usage ADD COLUMN IF NOT EXISTS current_tier TEXT DEFAULT 'free' CHECK (current_tier IN ('free', 'pro', 'creator'));

-- 5. Update the handle_new_user function to set tier in profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert into user_usage
    INSERT INTO public.user_usage (
        user_id, 
        tier, 
        current_tier,
        stack_items_limit, 
        protocols_limit, 
        uploads_limit, 
        trial_started_at,
        is_in_trial,
        trial_used
    )
    VALUES (
        NEW.id, 
        'free',
        'free', 
        10, 
        5, 
        3, 
        NOW(),
        true,
        false
    );
    
    -- Also set tier in profiles if a profile exists
    UPDATE profiles 
    SET tier = 'free'
    WHERE user_id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create indexes for Stripe fields
CREATE INDEX IF NOT EXISTS idx_user_usage_stripe_customer_id ON user_usage(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_user_usage_stripe_subscription_id ON user_usage(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_profiles_tier ON profiles(tier);

-- 7. Create function to get user subscription status
CREATE OR REPLACE FUNCTION public.get_user_subscription_status(user_id_param UUID)
RETURNS TABLE(
    tier TEXT,
    subscription_status TEXT,
    is_in_trial BOOLEAN,
    days_remaining INTEGER,
    current_period_end TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(u.current_tier, u.tier, 'free') as tier,
        u.subscription_status,
        u.is_in_trial AND u.trial_started_at > NOW() - INTERVAL '14 days' as is_in_trial,
        GREATEST(0, 14 - EXTRACT(days FROM NOW() - u.trial_started_at))::INTEGER as days_remaining,
        u.current_period_end
    FROM user_usage u
    WHERE u.user_id = user_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Grant permissions
GRANT EXECUTE ON FUNCTION get_user_subscription_status TO authenticated;

-- 9. Update existing profiles to have tier field
UPDATE profiles 
SET tier = COALESCE(
    (SELECT tier FROM user_usage WHERE user_usage.user_id = profiles.user_id),
    'free'
)
WHERE tier IS NULL;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Stripe integration database updates completed!';
    RAISE NOTICE 'Added columns: stripe_customer_id, stripe_subscription_id, subscription_status, current_period_end';
    RAISE NOTICE 'Updated tier constraints to include creator tier';
    RAISE NOTICE 'Functions created: get_user_subscription_status';
END $$;
