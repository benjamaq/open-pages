-- Check what data was actually inserted for Mum's profile

-- Check profile
SELECT 'Profile:' as info;
SELECT id, slug, display_name, public FROM profiles WHERE slug = 'mum-chronic-pain';

-- Check daily entries - show first 10 and last 10
SELECT 'Daily entries (first 10):' as info;
SELECT local_date, mood, sleep_quality, pain, sleep_hours, tags 
FROM daily_entries 
WHERE user_id = 'f3fdc655-efc6-4554-8159-8055e8f6f39d' 
ORDER BY local_date 
LIMIT 10;

SELECT 'Daily entries (last 10):' as info;
SELECT local_date, mood, sleep_quality, pain, sleep_hours, tags 
FROM daily_entries 
WHERE user_id = 'f3fdc655-efc6-4554-8159-8055e8f6f39d' 
ORDER BY local_date DESC 
LIMIT 10;

-- Check date range
SELECT 'Date range:' as info;
SELECT MIN(local_date) as earliest, MAX(local_date) as latest, COUNT(*) as total_days
FROM daily_entries 
WHERE user_id = 'f3fdc655-efc6-4554-8159-8055e8f6f39d';
