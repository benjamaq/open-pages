-- Creator Trial System Implementation
-- Run this in your Supabase SQL Editor

-- 1. Add creator trial tracking columns to user_usage table
ALTER TABLE user_usage ADD COLUMN IF NOT EXISTS creator_trial_started_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE user_usage ADD COLUMN IF NOT EXISTS creator_trial_ended_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE user_usage ADD COLUMN IF NOT EXISTS is_in_creator_trial BOOLEAN DEFAULT false;
ALTER TABLE user_usage ADD COLUMN IF NOT EXISTS creator_trial_used BOOLEAN DEFAULT false;
ALTER TABLE user_usage ADD COLUMN IF NOT EXISTS creator_intent BOOLEAN DEFAULT false;

-- 2. Update handle_new_user function to support creator trials
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_metadata JSONB;
    is_creator_intent BOOLEAN DEFAULT false;
    wants_creator_trial BOOLEAN DEFAULT false;
BEGIN
    -- Get user metadata
    user_metadata := NEW.raw_user_meta_data;
    
    -- Check if user has creator intent
    IF user_metadata ? 'creator_intent' THEN
        is_creator_intent := (user_metadata->>'creator_intent')::BOOLEAN;
    END IF;
    
    -- Check if user wants creator trial
    IF user_metadata ? 'wants_creator_trial' THEN
        wants_creator_trial := (user_metadata->>'wants_creator_trial')::BOOLEAN;
    END IF;
    
    -- Insert user_usage with appropriate trial
    INSERT INTO public.user_usage (
        user_id, 
        tier, 
        current_tier,
        stack_items_limit, 
        protocols_limit, 
        uploads_limit,
        creator_intent,
        trial_started_at,
        is_in_trial,
        trial_used,
        creator_trial_started_at,
        is_in_creator_trial,
        creator_trial_used
    )
    VALUES (
        NEW.id, 
        CASE 
            WHEN wants_creator_trial THEN 'creator'
            ELSE 'free'
        END,
        CASE 
            WHEN wants_creator_trial THEN 'creator'
            ELSE 'free'
        END,
        10, 
        5, 
        3,
        is_creator_intent,
        CASE 
            WHEN NOT wants_creator_trial THEN NOW()
            ELSE NULL
        END,
        CASE 
            WHEN NOT wants_creator_trial THEN true
            ELSE false
        END,
        false,
        CASE 
            WHEN wants_creator_trial THEN NOW()
            ELSE NULL
        END,
        wants_creator_trial,
        false
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create function to check if user is in creator trial
CREATE OR REPLACE FUNCTION public.is_user_in_creator_trial(user_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
    trial_start TIMESTAMP WITH TIME ZONE;
    trial_active BOOLEAN;
BEGIN
    SELECT creator_trial_started_at, is_in_creator_trial INTO trial_start, trial_active
    FROM user_usage 
    WHERE user_id = user_id_param;
    
    IF trial_start IS NULL OR NOT trial_active THEN
        RETURN FALSE;
    END IF;
    
    -- Check if 14 days have passed
    RETURN trial_start > NOW() - INTERVAL '14 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create function to get creator trial status
CREATE OR REPLACE FUNCTION public.get_creator_trial_status(user_id_param UUID)
RETURNS TABLE(
    is_in_creator_trial BOOLEAN,
    days_remaining INTEGER,
    creator_trial_started_at TIMESTAMP WITH TIME ZONE,
    creator_trial_ended_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.is_in_creator_trial AND u.creator_trial_started_at > NOW() - INTERVAL '14 days' as is_in_creator_trial,
        GREATEST(0, 14 - EXTRACT(days FROM NOW() - u.creator_trial_started_at))::INTEGER as days_remaining,
        u.creator_trial_started_at,
        u.creator_trial_ended_at
    FROM user_usage u
    WHERE u.user_id = user_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Update can_user_add_items function to support creator trials
CREATE OR REPLACE FUNCTION public.can_user_add_items(
    user_id_param UUID, 
    item_type TEXT, 
    current_count INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
    user_tier TEXT;
    in_trial BOOLEAN;
    in_creator_trial BOOLEAN;
    limit_count INTEGER;
BEGIN
    -- Get user tier and trial status
    SELECT p.tier, 
           u.is_in_trial AND u.trial_started_at > NOW() - INTERVAL '14 days',
           u.is_in_creator_trial AND u.creator_trial_started_at > NOW() - INTERVAL '14 days'
    INTO user_tier, in_trial, in_creator_trial
    FROM profiles p
    JOIN user_usage u ON p.user_id = u.user_id
    WHERE p.user_id = user_id_param;
    
    -- If in any trial or paid tier, allow unlimited
    IF in_trial OR in_creator_trial OR user_tier IN ('pro', 'creator') THEN
        RETURN TRUE;
    END IF;
    
    -- Check limits for free tier
    CASE item_type
        WHEN 'stack_items' THEN limit_count := 10;
        WHEN 'protocols' THEN limit_count := 5;
        WHEN 'uploads' THEN limit_count := 3;
        ELSE limit_count := 0;
    END CASE;
    
    RETURN current_count < limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Grant permissions
GRANT EXECUTE ON FUNCTION is_user_in_creator_trial TO authenticated;
GRANT EXECUTE ON FUNCTION get_creator_trial_status TO authenticated;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Creator trial system has been successfully implemented!';
    RAISE NOTICE 'Users can now sign up for Creator trials or regular Pro trials';
    RAISE NOTICE 'Functions created: is_user_in_creator_trial, get_creator_trial_status';
END $$;
