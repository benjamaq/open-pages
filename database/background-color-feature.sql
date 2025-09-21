-- Background Color Customization for Creators
-- Run this in your Supabase SQL Editor

-- 1. Add background_color column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS background_color TEXT DEFAULT '#FFFFFF';

-- 2. Create function to update background color
CREATE OR REPLACE FUNCTION public.update_background_color(
    user_id_param UUID,
    new_color TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    profile_record RECORD;
BEGIN
    -- Get user's profile and check if they're a creator
    SELECT * INTO profile_record
    FROM profiles 
    WHERE user_id = user_id_param;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Only allow creators to change background color
    IF profile_record.tier != 'creator' THEN
        RETURN FALSE;
    END IF;
    
    -- Validate color format (hex color)
    IF new_color !~ '^#[0-9A-Fa-f]{6}$' THEN
        RETURN FALSE;
    END IF;
    
    -- Update background color
    UPDATE profiles 
    SET 
        background_color = new_color,
        updated_at = NOW()
    WHERE user_id = user_id_param;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Grant permissions
GRANT EXECUTE ON FUNCTION update_background_color TO authenticated;

-- 4. Update RLS policies to include background_color in selects
-- (Existing policies should already cover this, but let's make sure)

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Background color customization feature added!';
    RAISE NOTICE 'Creators can now customize their dashboard and profile background colors';
    RAISE NOTICE 'Function created: update_background_color';
END $$;
