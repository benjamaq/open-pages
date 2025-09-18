-- FINAL UPLOADS FIX - Run each section separately if needed

-- Section 1: Fix uploads table (run this first)
ALTER TABLE uploads ADD COLUMN IF NOT EXISTS file_type TEXT;
ALTER TABLE uploads ADD COLUMN IF NOT EXISTS file_size INTEGER;
