-- Complete Creator Tier Update (Clean Version)
-- Run this in your Supabase SQL Editor to add all Creator tier functionality

-- 1. Update profiles table with tier and custom branding fields
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'creator'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS custom_logo_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS custom_branding_enabled BOOLEAN DEFAULT false;

-- 2. Update user_usage table to support creator tier
DO $$
BEGIN
    -- Drop the existing constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_usage_tier_check' 
        AND table_name = 'user_usage'
    ) THEN
        ALTER TABLE user_usage DROP CONSTRAINT user_usage_tier_check;
    END IF;
END $$;

ALTER TABLE user_usage ALTER COLUMN tier SET DEFAULT 'free';
ALTER TABLE user_usage ADD CONSTRAINT user_usage_tier_check CHECK (tier IN ('free', 'pro', 'creator'));
ALTER TABLE user_usage ADD COLUMN IF NOT EXISTS current_tier TEXT DEFAULT 'free';
ALTER TABLE user_usage ADD COLUMN IF NOT EXISTS tier_upgraded_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE user_usage ADD COLUMN IF NOT EXISTS shop_items_limit INTEGER DEFAULT 0;

-- 3. Create gear table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS gear (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    category TEXT,
    brand TEXT,
    model TEXT,
    notes TEXT,
    public BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Add affiliate fields to gear table
ALTER TABLE gear ADD COLUMN IF NOT EXISTS affiliate_url TEXT;
ALTER TABLE gear ADD COLUMN IF NOT EXISTS price TEXT;
ALTER TABLE gear ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE gear ADD COLUMN IF NOT EXISTS affiliate_enabled BOOLEAN DEFAULT false;
ALTER TABLE gear ADD COLUMN IF NOT EXISTS commission_rate TEXT;

-- 5. Create shop_gear_items table for dedicated affiliate items
CREATE TABLE IF NOT EXISTS shop_gear_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    brand TEXT,
    category TEXT,
    price TEXT,
    affiliate_url TEXT NOT NULL,
    image_url TEXT,
    commission_rate TEXT,
    featured BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    public BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Enable RLS on gear table
ALTER TABLE gear ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies for gear
DO $$
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can view public gear" ON gear;
    DROP POLICY IF EXISTS "Users can view their own gear" ON gear;
    DROP POLICY IF EXISTS "Users can insert gear for their own profiles" ON gear;
    DROP POLICY IF EXISTS "Users can update gear for their own profiles" ON gear;
    DROP POLICY IF EXISTS "Users can delete gear for their own profiles" ON gear;
END $$;

CREATE POLICY "Users can view public gear" ON gear
    FOR SELECT USING (public = true);
    
CREATE POLICY "Users can view their own gear" ON gear
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = gear.profile_id 
            AND profiles.user_id = auth.uid()
        )
    );
    
CREATE POLICY "Users can insert gear for their own profiles" ON gear
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = gear.profile_id 
            AND profiles.user_id = auth.uid()
        )
    );
    
CREATE POLICY "Users can update gear for their own profiles" ON gear
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = gear.profile_id 
            AND profiles.user_id = auth.uid()
        )
    );
    
CREATE POLICY "Users can delete gear for their own profiles" ON gear
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = gear.profile_id 
            AND profiles.user_id = auth.uid()
        )
    );

-- 8. Enable RLS on shop_gear_items
ALTER TABLE shop_gear_items ENABLE ROW LEVEL SECURITY;

-- 9. Create RLS policies for shop_gear_items
DO $$
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can view public shop gear items" ON shop_gear_items;
    DROP POLICY IF EXISTS "Users can view their own shop gear items" ON shop_gear_items;
    DROP POLICY IF EXISTS "Users can insert shop gear items for their own profiles" ON shop_gear_items;
    DROP POLICY IF EXISTS "Users can update shop gear items for their own profiles" ON shop_gear_items;
    DROP POLICY IF EXISTS "Users can delete shop gear items for their own profiles" ON shop_gear_items;
END $$;

CREATE POLICY "Users can view public shop gear items" ON shop_gear_items
    FOR SELECT USING (public = true);

CREATE POLICY "Users can view their own shop gear items" ON shop_gear_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = shop_gear_items.profile_id 
            AND profiles.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert shop gear items for their own profiles" ON shop_gear_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = shop_gear_items.profile_id 
            AND profiles.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update shop gear items for their own profiles" ON shop_gear_items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = shop_gear_items.profile_id 
            AND profiles.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete shop gear items for their own profiles" ON shop_gear_items
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = shop_gear_items.profile_id 
            AND profiles.user_id = auth.uid()
        )
    );

-- 10. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_tier ON profiles(tier);
CREATE INDEX IF NOT EXISTS idx_gear_affiliate ON gear(affiliate_enabled, public);
CREATE INDEX IF NOT EXISTS idx_shop_gear_profile ON shop_gear_items(profile_id, public);
CREATE INDEX IF NOT EXISTS idx_shop_gear_featured ON shop_gear_items(featured, sort_order);
CREATE INDEX IF NOT EXISTS idx_gear_profile ON gear(profile_id, public);

-- 11. Add updated_at triggers for new tables
CREATE TRIGGER IF NOT EXISTS update_gear_updated_at BEFORE UPDATE ON gear
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_shop_gear_items_updated_at BEFORE UPDATE ON shop_gear_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 12. Update the handle_new_user function to set default tier
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_usage (user_id, tier, stack_items_limit, protocols_limit, uploads_limit, current_tier)
    VALUES (NEW.id, 'free', 10, 5, 3, 'free');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. Add comments for documentation
COMMENT ON TABLE shop_gear_items IS 'Affiliate gear items for Creator tier users to monetize their influence';
COMMENT ON TABLE gear IS 'Personal gear items with optional affiliate links for Creator tier users';
COMMENT ON COLUMN profiles.custom_logo_url IS 'URL to custom logo for Creator tier branding';
COMMENT ON COLUMN profiles.custom_branding_enabled IS 'Whether custom branding is enabled for this profile';
COMMENT ON COLUMN profiles.tier IS 'User subscription tier: free, pro, or creator';
COMMENT ON COLUMN gear.affiliate_url IS 'Affiliate link for Creator tier monetization';
COMMENT ON COLUMN gear.commission_rate IS 'Commission rate for affiliate links (e.g., 5% or $10)';

-- 14. Create a function to check user tier for feature access
CREATE OR REPLACE FUNCTION public.check_user_tier(user_id_param UUID, required_tier TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    user_tier TEXT;
BEGIN
    SELECT tier INTO user_tier FROM profiles WHERE user_id = user_id_param;
    
    IF user_tier IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Tier hierarchy: free < pro < creator
    CASE required_tier
        WHEN 'free' THEN RETURN TRUE;
        WHEN 'pro' THEN RETURN user_tier IN ('pro', 'creator');
        WHEN 'creator' THEN RETURN user_tier = 'creator';
        ELSE RETURN FALSE;
    END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 15. Create a view for easy tier-based queries
CREATE OR REPLACE VIEW user_tier_info AS
SELECT 
    p.id as profile_id,
    p.user_id,
    p.slug,
    p.display_name,
    p.tier,
    p.custom_branding_enabled,
    p.custom_logo_url,
    u.stack_items_limit,
    u.protocols_limit,
    u.uploads_limit,
    u.shop_items_limit,
    u.tier_upgraded_at
FROM profiles p
LEFT JOIN user_usage u ON p.user_id = u.user_id;

-- Grant necessary permissions
GRANT SELECT ON user_tier_info TO authenticated;
GRANT EXECUTE ON FUNCTION check_user_tier TO authenticated;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Creator tier functionality has been successfully added!';
    RAISE NOTICE 'New tables created: gear, shop_gear_items';
    RAISE NOTICE 'New columns added to profiles: tier, custom_logo_url, custom_branding_enabled';
    RAISE NOTICE 'New columns added to user_usage: current_tier, tier_upgraded_at, shop_items_limit';
    RAISE NOTICE 'RLS policies and indexes created for optimal performance';
    RAISE NOTICE 'Helper functions created: check_user_tier, user_tier_info view';
END $$;
