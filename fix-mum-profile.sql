-- Fix Mum's profile - make sure it's public and accessible

-- Check current profile status
SELECT 'Current profile status:' as info;
SELECT id, slug, display_name, public, created_at FROM profiles WHERE slug = 'mum-chronic-pain';

-- Update profile to make sure it's public
UPDATE profiles 
SET 
    public = true,
    display_name = 'Sarah - Chronic Pain Journey',
    bio = 'Tracking chronic pain recovery and finding what actually works. After trying 15+ treatments, finally found relief through systematic tracking.'
WHERE slug = 'mum-chronic-pain';

-- Verify the update
SELECT 'Updated profile status:' as info;
SELECT id, slug, display_name, public, created_at FROM profiles WHERE slug = 'mum-chronic-pain';

-- Check daily entries
SELECT 'Daily entries count:' as info;
SELECT COUNT(*) as count FROM daily_entries WHERE user_id = 'f3fdc655-efc6-4554-8159-8055e8f6f39d';
