-- Open Pages Database Schema
-- Run this in your Supabase SQL editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE profiles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    bio TEXT,
    avatar_url TEXT,
    public BOOLEAN DEFAULT true,
    referral_code TEXT,
    referral_source TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create stack_items table
CREATE TABLE stack_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    dose TEXT,
    timing TEXT,
    brand TEXT,
    notes TEXT,
    public BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create protocols table
CREATE TABLE protocols (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    details TEXT,
    frequency TEXT,
    public BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create uploads table
CREATE TABLE uploads (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    file_url TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    public BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_usage table for freemium limits
CREATE TABLE user_usage (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'pro')),
    stack_items_limit INTEGER DEFAULT 20,
    protocols_limit INTEGER DEFAULT 5,
    uploads_limit INTEGER DEFAULT 3,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_profiles_slug ON profiles(slug);
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_public ON profiles(public);

CREATE INDEX idx_stack_items_profile_id ON stack_items(profile_id);
CREATE INDEX idx_stack_items_public ON stack_items(public);

CREATE INDEX idx_protocols_profile_id ON protocols(profile_id);
CREATE INDEX idx_protocols_public ON protocols(public);

CREATE INDEX idx_uploads_profile_id ON uploads(profile_id);
CREATE INDEX idx_uploads_public ON uploads(public);

CREATE INDEX idx_user_usage_user_id ON user_usage(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stack_items_updated_at BEFORE UPDATE ON stack_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_protocols_updated_at BEFORE UPDATE ON protocols
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_uploads_updated_at BEFORE UPDATE ON uploads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_usage_updated_at BEFORE UPDATE ON user_usage
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stack_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Profiles are viewable by everyone if public" ON profiles
    FOR SELECT USING (public = true);

CREATE POLICY "Users can view their own profiles" ON profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profiles" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profiles" ON profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own profiles" ON profiles
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for stack_items
CREATE POLICY "Stack items are viewable by everyone if public" ON stack_items
    FOR SELECT USING (public = true);

CREATE POLICY "Users can view stack items for their own profiles" ON stack_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = stack_items.profile_id 
            AND profiles.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert stack items for their own profiles" ON stack_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = stack_items.profile_id 
            AND profiles.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update stack items for their own profiles" ON stack_items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = stack_items.profile_id 
            AND profiles.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete stack items for their own profiles" ON stack_items
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = stack_items.profile_id 
            AND profiles.user_id = auth.uid()
        )
    );

-- RLS Policies for protocols
CREATE POLICY "Protocols are viewable by everyone if public" ON protocols
    FOR SELECT USING (public = true);

CREATE POLICY "Users can view protocols for their own profiles" ON protocols
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = protocols.profile_id 
            AND profiles.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert protocols for their own profiles" ON protocols
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = protocols.profile_id 
            AND profiles.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update protocols for their own profiles" ON protocols
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = protocols.profile_id 
            AND profiles.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete protocols for their own profiles" ON protocols
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = protocols.profile_id 
            AND profiles.user_id = auth.uid()
        )
    );

-- RLS Policies for uploads
CREATE POLICY "Uploads are viewable by everyone if public" ON uploads
    FOR SELECT USING (public = true);

CREATE POLICY "Users can view uploads for their own profiles" ON uploads
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = uploads.profile_id 
            AND profiles.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert uploads for their own profiles" ON uploads
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = uploads.profile_id 
            AND profiles.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update uploads for their own profiles" ON uploads
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = uploads.profile_id 
            AND profiles.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete uploads for their own profiles" ON uploads
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = uploads.profile_id 
            AND profiles.user_id = auth.uid()
        )
    );

-- RLS Policies for user_usage
CREATE POLICY "Users can view their own usage" ON user_usage
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own usage" ON user_usage
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own usage" ON user_usage
    FOR UPDATE USING (auth.uid() = user_id);

-- Function to automatically create user_usage record when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_usage (user_id, tier, stack_items_limit, protocols_limit, uploads_limit)
    VALUES (NEW.id, 'free', 20, 5, 3);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user_usage when a new user is created
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
