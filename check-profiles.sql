-- Check what profiles exist in the database
SELECT 'All Profiles:' as info;
SELECT id, user_id, slug, display_name, public, created_at FROM profiles ORDER BY created_at DESC;

-- Check if our specific profile exists
SELECT 'Mum Profile Check:' as info;
SELECT id, user_id, slug, display_name, public FROM profiles WHERE slug = 'mum-chronic-pain';

-- Check daily entries for our user
SELECT 'Daily Entries Count:' as info;
SELECT COUNT(*) as entry_count FROM daily_entries WHERE user_id = 'f3fdc655-efc6-4554-8159-8055e8f6f39d';

-- Check if the user exists in auth.users
SELECT 'User Check:' as info;
SELECT id, email FROM auth.users WHERE id = 'f3fdc655-efc6-4554-8159-8055e8f6f39d';
