-- Simple fix: Create Mum's profile and data
-- This will definitely work

-- Step 1: Delete any existing profile with this slug
DELETE FROM profiles WHERE slug = 'mum-chronic-pain';

-- Step 2: Create the profile
INSERT INTO profiles (user_id, slug, display_name, bio, public, created_at)
VALUES (
    'f3fdc655-efc6-4554-8159-8055e8f6f39d',
    'mum-chronic-pain',
    'Sarah - Chronic Pain Journey',
    'Tracking chronic pain recovery and finding what actually works. After trying 15+ treatments, finally found relief through systematic tracking.',
    true,
    NOW()
);

-- Step 3: Clean existing daily entries for this user
DELETE FROM daily_entries WHERE user_id = 'f3fdc655-efc6-4554-8159-8055e8f6f39d';

-- Step 4: Insert August 1-8 (RED/YELLOW days)
INSERT INTO daily_entries (user_id, local_date, mood, sleep_quality, pain, sleep_hours, night_wakes, tags, journal, meds, protocols, activity, devices, wearables)
VALUES 
('f3fdc655-efc6-4554-8159-8055e8f6f39d', '2025-08-01', 2, 3, 9, 4.5, 5, ARRAY['exhausted', 'frustrated', 'overwhelmed', 'hopeless'], 'Pain at 9/10. New medication not working.', '["New Medication", "Ibuprofen 800mg"]'::jsonb, '["Heat therapy"]'::jsonb, '["Minimal movement"]'::jsonb, '["Heating pad"]'::jsonb, '["Manual tracking"]'::jsonb),
('f3fdc655-efc6-4554-8159-8055e8f6f39d', '2025-08-02', 2, 3, 9, 4.5, 5, ARRAY['exhausted', 'frustrated', 'overwhelmed', 'hopeless'], 'Pain at 9/10. Still terrible.', '["New Medication", "Ibuprofen 800mg"]'::jsonb, '["Heat therapy"]'::jsonb, '["Minimal movement"]'::jsonb, '["Heating pad"]'::jsonb, '["Manual tracking"]'::jsonb),
('f3fdc655-efc6-4554-8159-8055e8f6f39d', '2025-08-03', 2, 3, 9, 4.5, 5, ARRAY['exhausted', 'frustrated', 'overwhelmed', 'hopeless'], 'Pain at 9/10. Can''t think straight.', '["New Medication", "Ibuprofen 800mg"]'::jsonb, '["Heat therapy"]'::jsonb, '["Minimal movement"]'::jsonb, '["Heating pad"]'::jsonb, '["Manual tracking"]'::jsonb),
('f3fdc655-efc6-4554-8159-8055e8f6f39d', '2025-08-04', 2, 3, 9, 4.5, 5, ARRAY['exhausted', 'frustrated', 'overwhelmed', 'hopeless'], 'Pain at 9/10. This is hell.', '["New Medication", "Ibuprofen 800mg"]'::jsonb, '["Heat therapy"]'::jsonb, '["Minimal movement"]'::jsonb, '["Heating pad"]'::jsonb, '["Manual tracking"]'::jsonb),
('f3fdc655-efc6-4554-8159-8055e8f6f39d', '2025-08-05', 2, 3, 9, 4.5, 5, ARRAY['exhausted', 'frustrated', 'overwhelmed', 'hopeless'], 'Pain at 9/10. Still no improvement.', '["New Medication", "Ibuprofen 800mg"]'::jsonb, '["Heat therapy"]'::jsonb, '["Minimal movement"]'::jsonb, '["Heating pad"]'::jsonb, '["Manual tracking"]'::jsonb),
('f3fdc655-efc6-4554-8159-8055e8f6f39d', '2025-08-06', 2, 3, 9, 4.5, 5, ARRAY['exhausted', 'frustrated', 'overwhelmed', 'hopeless'], 'Pain at 9/10. Feeling hopeless.', '["New Medication", "Ibuprofen 800mg"]'::jsonb, '["Heat therapy"]'::jsonb, '["Minimal movement"]'::jsonb, '["Heating pad"]'::jsonb, '["Manual tracking"]'::jsonb),
('f3fdc655-efc6-4554-8159-8055e8f6f39d', '2025-08-07', 2, 3, 9, 4.5, 5, ARRAY['exhausted', 'frustrated', 'overwhelmed', 'hopeless'], 'Pain at 9/10. Week 1 complete.', '["New Medication", "Ibuprofen 800mg"]'::jsonb, '["Heat therapy"]'::jsonb, '["Minimal movement"]'::jsonb, '["Heating pad"]'::jsonb, '["Manual tracking"]'::jsonb),
('f3fdc655-efc6-4554-8159-8055e8f6f39d', '2025-08-08', 2, 3, 9, 4.5, 5, ARRAY['exhausted', 'frustrated', 'overwhelmed', 'hopeless'], 'Pain at 9/10. Starting to track.', '["New Medication", "Ibuprofen 800mg"]'::jsonb, '["Heat therapy"]'::jsonb, '["Minimal movement"]'::jsonb, '["Heating pad"]'::jsonb, '["Manual tracking"]'::jsonb);

-- Step 5: Insert August 9-10 (YELLOW days)
INSERT INTO daily_entries (user_id, local_date, mood, sleep_quality, pain, sleep_hours, night_wakes, tags, journal, meds, protocols, activity, devices, wearables)
VALUES 
('f3fdc655-efc6-4554-8159-8055e8f6f39d', '2025-08-09', 4, 4, 7, 5.5, 3, ARRAY['hopeful', 'determined'], 'Pain 7/10. Maybe some improvement.', '["New Medication", "Ibuprofen 600mg"]'::jsonb, '["Heat therapy"]'::jsonb, '["Light walking"]'::jsonb, '["Heating pad"]'::jsonb, '["Manual tracking"]'::jsonb),
('f3fdc655-efc6-4554-8159-8055e8f6f39d', '2025-08-10', 4, 4, 7, 5.5, 3, ARRAY['hopeful', 'determined'], 'Pain 7/10. Starting to track consistently.', '["New Medication", "Ibuprofen 600mg"]'::jsonb, '["Heat therapy"]'::jsonb, '["Light walking"]'::jsonb, '["Heating pad"]'::jsonb, '["Manual tracking"]'::jsonb);

-- Step 6: Insert August 11-17 (LIGHT GREEN days)
INSERT INTO daily_entries (user_id, local_date, mood, sleep_quality, pain, sleep_hours, night_wakes, tags, journal, meds, protocols, activity, devices, wearables)
VALUES 
('f3fdc655-efc6-4554-8159-8055e8f6f39d', '2025-08-11', 6, 6, 5, 6.5, 2, ARRAY['hopeful', 'grateful', 'progress'], 'Pain 5/10! This is working!', '["New Medication", "Magnesium"]'::jsonb, '["Heat therapy", "Gentle stretching"]'::jsonb, '["Walking 20min"]'::jsonb, '["Heating pad"]'::jsonb, '["Manual tracking"]'::jsonb),
('f3fdc655-efc6-4554-8159-8055e8f6f39d', '2025-08-12', 6, 6, 5, 6.5, 2, ARRAY['hopeful', 'grateful', 'progress'], 'Pain 5/10! Clear improvement.', '["New Medication", "Magnesium"]'::jsonb, '["Heat therapy", "Gentle stretching"]'::jsonb, '["Walking 20min"]'::jsonb, '["Heating pad"]'::jsonb, '["Manual tracking"]'::jsonb),
('f3fdc655-efc6-4554-8159-8055e8f6f39d', '2025-08-13', 6, 6, 5, 6.5, 2, ARRAY['hopeful', 'grateful', 'progress'], 'Pain 5/10! Pattern emerging.', '["New Medication", "Magnesium"]'::jsonb, '["Heat therapy", "Gentle stretching"]'::jsonb, '["Walking 20min"]'::jsonb, '["Heating pad"]'::jsonb, '["Manual tracking"]'::jsonb),
('f3fdc655-efc6-4554-8159-8055e8f6f39d', '2025-08-14', 6, 6, 5, 6.5, 2, ARRAY['hopeful', 'grateful', 'progress'], 'Pain 5/10! Better sleep.', '["New Medication", "Magnesium"]'::jsonb, '["Heat therapy", "Gentle stretching"]'::jsonb, '["Walking 20min"]'::jsonb, '["Heating pad"]'::jsonb, '["Manual tracking"]'::jsonb),
('f3fdc655-efc6-4554-8159-8055e8f6f39d', '2025-08-15', 6, 6, 5, 6.5, 2, ARRAY['hopeful', 'grateful', 'progress'], 'Pain 5/10! Family noticed improvement.', '["New Medication", "Magnesium"]'::jsonb, '["Heat therapy", "Gentle stretching"]'::jsonb, '["Walking 20min"]'::jsonb, '["Heating pad"]'::jsonb, '["Manual tracking"]'::jsonb),
('f3fdc655-efc6-4554-8159-8055e8f6f39d', '2025-08-16', 6, 6, 5, 6.5, 2, ARRAY['hopeful', 'grateful', 'progress'], 'Pain 5/10! Longest stretch of relief.', '["New Medication", "Magnesium"]'::jsonb, '["Heat therapy", "Gentle stretching"]'::jsonb, '["Walking 20min"]'::jsonb, '["Heating pad"]'::jsonb, '["Manual tracking"]'::jsonb),
('f3fdc655-efc6-4554-8159-8055e8f6f39d', '2025-08-17', 6, 6, 5, 6.5, 2, ARRAY['hopeful', 'grateful', 'progress'], 'Pain 5/10! Ready for doctor appointment.', '["New Medication", "Magnesium"]'::jsonb, '["Heat therapy", "Gentle stretching"]'::jsonb, '["Walking 20min"]'::jsonb, '["Heating pad"]'::jsonb, '["Manual tracking"]'::jsonb);

-- Step 7: Insert August 18-24 (DARK GREEN days)
INSERT INTO daily_entries (user_id, local_date, mood, sleep_quality, pain, sleep_hours, night_wakes, tags, journal, meds, protocols, activity, devices, wearables)
VALUES 
('f3fdc655-efc6-4554-8159-8055e8f6f39d', '2025-08-18', 8, 8, 3, 7.5, 1, ARRAY['amazing', 'grateful', 'energetic'], 'Pain 3/10! 7 days in a row of relief.', '["New Medication", "Magnesium", "Vitamin D"]'::jsonb, '["Heat therapy", "Gentle stretching"]'::jsonb, '["Walking 30min", "Normal activities"]'::jsonb, '["Heating pad"]'::jsonb, '["Manual tracking"]'::jsonb),
('f3fdc655-efc6-4554-8159-8055e8f6f39d', '2025-08-19', 8, 8, 3, 7.5, 1, ARRAY['amazing', 'grateful', 'energetic'], 'Pain 3/10! Best day in months.', '["New Medication", "Magnesium", "Vitamin D"]'::jsonb, '["Heat therapy", "Gentle stretching"]'::jsonb, '["Walking 30min", "Normal activities"]'::jsonb, '["Heating pad"]'::jsonb, '["Manual tracking"]'::jsonb),
('f3fdc655-efc6-4554-8159-8055e8f6f39d', '2025-08-20', 8, 8, 3, 7.5, 1, ARRAY['amazing', 'grateful', 'energetic'], 'Pain 3/10! Made dinner for family.', '["New Medication", "Magnesium", "Vitamin D"]'::jsonb, '["Heat therapy", "Gentle stretching"]'::jsonb, '["Walking 30min", "Normal activities"]'::jsonb, '["Heating pad"]'::jsonb, '["Manual tracking"]'::jsonb),
('f3fdc655-efc6-4554-8159-8055e8f6f39d', '2025-08-21', 8, 8, 3, 7.5, 1, ARRAY['amazing', 'grateful', 'energetic'], 'Pain 3/10! Went for proper walk.', '["New Medication", "Magnesium", "Vitamin D"]'::jsonb, '["Heat therapy", "Gentle stretching"]'::jsonb, '["Walking 30min", "Normal activities"]'::jsonb, '["Heating pad"]'::jsonb, '["Manual tracking"]'::jsonb),
('f3fdc655-efc6-4554-8159-8055e8f6f39d', '2025-08-22', 8, 8, 3, 7.5, 1, ARRAY['amazing', 'grateful', 'energetic'], 'Pain 3/10! Planning things again.', '["New Medication", "Magnesium", "Vitamin D"]'::jsonb, '["Heat therapy", "Gentle stretching"]'::jsonb, '["Walking 30min", "Normal activities"]'::jsonb, '["Heating pad"]'::jsonb, '["Manual tracking"]'::jsonb),
('f3fdc655-efc6-4554-8159-8055e8f6f39d', '2025-08-23', 8, 8, 3, 7.5, 1, ARRAY['amazing', 'grateful', 'energetic'], 'Pain 3/10! Best week of my life.', '["New Medication", "Magnesium", "Vitamin D"]'::jsonb, '["Heat therapy", "Gentle stretching"]'::jsonb, '["Walking 30min", "Normal activities"]'::jsonb, '["Heating pad"]'::jsonb, '["Manual tracking"]'::jsonb),
('f3fdc655-efc6-4554-8159-8055e8f6f39d', '2025-08-24', 8, 8, 3, 7.5, 1, ARRAY['amazing', 'grateful', 'energetic'], 'Pain 3/10! Doctor appointment tomorrow.', '["New Medication", "Magnesium", "Vitamin D"]'::jsonb, '["Heat therapy", "Gentle stretching"]'::jsonb, '["Walking 30min", "Normal activities"]'::jsonb, '["Heating pad"]'::jsonb, '["Manual tracking"]'::jsonb);

-- Step 8: Insert August 25-27 (YELLOW days - regression)
INSERT INTO daily_entries (user_id, local_date, mood, sleep_quality, pain, sleep_hours, night_wakes, tags, journal, meds, protocols, activity, devices, wearables)
VALUES 
('f3fdc655-efc6-4554-8159-8055e8f6f39d', '2025-08-25', 5, 5, 6, 6.0, 2, ARRAY['frustrated', 'determined'], 'Pain 6/10. Forgot supplements yesterday.', '["New Medication", "Magnesium"]'::jsonb, '["Heat therapy"]'::jsonb, '["Light walking"]'::jsonb, '["Heating pad"]'::jsonb, '["Manual tracking"]'::jsonb),
('f3fdc655-efc6-4554-8159-8055e8f6f39d', '2025-08-26', 5, 5, 6, 6.0, 2, ARRAY['frustrated', 'determined'], 'Pain 6/10. Consistency matters.', '["New Medication", "Magnesium"]'::jsonb, '["Heat therapy"]'::jsonb, '["Light walking"]'::jsonb, '["Heating pad"]'::jsonb, '["Manual tracking"]'::jsonb),
('f3fdc655-efc6-4554-8159-8055e8f6f39d', '2025-08-27', 5, 5, 6, 6.0, 2, ARRAY['frustrated', 'determined'], 'Pain 6/10. Learning what works.', '["New Medication", "Magnesium"]'::jsonb, '["Heat therapy"]'::jsonb, '["Light walking"]'::jsonb, '["Heating pad"]'::jsonb, '["Manual tracking"]'::jsonb);

-- Step 9: Insert August 28-31 (GREEN days - recovery)
INSERT INTO daily_entries (user_id, local_date, mood, sleep_quality, pain, sleep_hours, night_wakes, tags, journal, meds, protocols, activity, devices, wearables)
VALUES 
('f3fdc655-efc6-4554-8159-8055e8f6f39d', '2025-08-28', 7, 7, 4, 7.0, 1, ARRAY['hopeful', 'grateful', 'optimistic'], 'Pain 4/10. Back on track.', '["New Medication", "Magnesium", "Vitamin D"]'::jsonb, '["Heat therapy", "Gentle stretching"]'::jsonb, '["Walking 25min"]'::jsonb, '["Heating pad"]'::jsonb, '["Manual tracking"]'::jsonb),
('f3fdc655-efc6-4554-8159-8055e8f6f39d', '2025-08-29', 7, 7, 4, 7.0, 1, ARRAY['hopeful', 'grateful', 'optimistic'], 'Pain 4/10. Ready for doctor appointment.', '["New Medication", "Magnesium", "Vitamin D"]'::jsonb, '["Heat therapy", "Gentle stretching"]'::jsonb, '["Walking 25min"]'::jsonb, '["Heating pad"]'::jsonb, '["Manual tracking"]'::jsonb),
('f3fdc655-efc6-4554-8159-8055e8f6f39d', '2025-08-30', 7, 7, 4, 7.0, 1, ARRAY['hopeful', 'grateful', 'optimistic'], 'Pain 4/10. Doctor appointment today.', '["New Medication", "Magnesium", "Vitamin D"]'::jsonb, '["Heat therapy", "Gentle stretching"]'::jsonb, '["Walking 25min"]'::jsonb, '["Heating pad"]'::jsonb, '["Manual tracking"]'::jsonb),
('f3fdc655-efc6-4554-8159-8055e8f6f39d', '2025-08-31', 7, 7, 4, 7.0, 1, ARRAY['hopeful', 'grateful', 'optimistic'], 'Pain 4/10. Doctor amazed at tracking data!', '["New Medication", "Magnesium", "Vitamin D"]'::jsonb, '["Heat therapy", "Gentle stretching"]'::jsonb, '["Walking 25min"]'::jsonb, '["Heating pad"]'::jsonb, '["Manual tracking"]'::jsonb);

-- Step 10: Verify everything was created
SELECT 'Profile created:' as status, slug, display_name FROM profiles WHERE slug = 'mum-chronic-pain';
SELECT 'Daily entries count:' as status, COUNT(*) as count FROM daily_entries WHERE user_id = 'f3fdc655-efc6-4554-8159-8055e8f6f39d';
