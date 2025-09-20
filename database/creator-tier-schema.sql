-- Creator Tier Schema Updates
-- Run this in your Supabase SQL Editor

-- Add tier column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'creator'));

-- Add custom branding fields to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS custom_logo_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS custom_branding_enabled BOOLEAN DEFAULT false;

-- Add affiliate fields to gear table (assuming gear table exists)
-- If gear table doesn't exist, we'll need to create it first
DO $$
BEGIN
    -- Check if gear table exists, if not create it
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'gear') THEN
        CREATE TABLE gear (
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
        
        -- Enable RLS on gear table
        ALTER TABLE gear ENABLE ROW LEVEL SECURITY;
        
        -- Create RLS policies for gear
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
    END IF;
END $$;

-- Add affiliate fields to gear table
ALTER TABLE gear ADD COLUMN IF NOT EXISTS affiliate_url TEXT;
ALTER TABLE gear ADD COLUMN IF NOT EXISTS price TEXT;
ALTER TABLE gear ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE gear ADD COLUMN IF NOT EXISTS affiliate_enabled BOOLEAN DEFAULT false;
ALTER TABLE gear ADD COLUMN IF NOT EXISTS commission_rate TEXT; -- e.g., "5%" or "flat $10"

-- Create shop_gear_items table for dedicated affiliate items (optional approach)
-- This allows creators to have separate "shop" items beyond their personal gear
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

-- Enable RLS on shop_gear_items
ALTER TABLE shop_gear_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for shop_gear_items
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

-- Update user_usage table to include tier tracking
ALTER TABLE user_usage ADD COLUMN IF NOT EXISTS current_tier TEXT DEFAULT 'free';
ALTER TABLE user_usage ADD COLUMN IF NOT EXISTS tier_upgraded_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE user_usage ADD COLUMN IF NOT EXISTS shop_items_limit INTEGER DEFAULT 0; -- 0 = unlimited for creator tier

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_tier ON profiles(tier);
CREATE INDEX IF NOT EXISTS idx_gear_affiliate ON gear(affiliate_enabled, public);
CREATE INDEX IF NOT EXISTS idx_shop_gear_profile ON shop_gear_items(profile_id, public);
CREATE INDEX IF NOT EXISTS idx_shop_gear_featured ON shop_gear_items(featured, sort_order);

-- Update the handle_new_user function to set default tier
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_usage (user_id, tier, stack_items_limit, protocols_limit, uploads_limit, current_tier)
    VALUES (NEW.id, 'free', 10, 5, 3, 'free');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE shop_gear_items IS 'Affiliate gear items for Creator tier users to monetize their influence';
COMMENT ON COLUMN profiles.custom_logo_url IS 'URL to custom logo for Creator tier branding';
COMMENT ON COLUMN profiles.custom_branding_enabled IS 'Whether custom branding is enabled for this profile';
COMMENT ON COLUMN gear.affiliate_url IS 'Affiliate link for Creator tier monetization';
COMMENT ON COLUMN gear.commission_rate IS 'Commission rate for affiliate links (e.g., 5% or $10)';
