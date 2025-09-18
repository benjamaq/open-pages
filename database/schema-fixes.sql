-- Schema fixes for Open Pages
-- Run this in your Supabase SQL editor to fix column mismatches

-- Fix protocols table: rename 'details' to 'description'
ALTER TABLE protocols RENAME COLUMN details TO description;

-- Fix uploads table: add missing columns and rename 'title' to 'name'
ALTER TABLE uploads RENAME COLUMN title TO name;
ALTER TABLE uploads ADD COLUMN IF NOT EXISTS file_type TEXT;
ALTER TABLE uploads ADD COLUMN IF NOT EXISTS file_size INTEGER;

-- Update uploads table to have proper structure
-- Note: If you have existing data, you might need to populate these new columns
