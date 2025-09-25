-- Update stack items limit to 20 for free tier users
-- Run this in your Supabase SQL editor

-- Update the default limit for new users
UPDATE user_usage 
SET stack_items_limit = 20 
WHERE tier = 'free' AND stack_items_limit = 10;

-- Update the function that creates new users to use 20 as the default
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_usage (user_id, tier, stack_items_limit, protocols_limit, uploads_limit)
    VALUES (NEW.id, 'free', 20, 5, 3);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Stack items limit updated to 20 for free tier users!';
    RAISE NOTICE 'New users will now get 20 stack items by default.';
END $$;
