-- Create the uploads storage bucket for Files and Labs module
-- Run this in your Supabase SQL Editor

-- First, create the uploads bucket (this needs to be done via the Supabase Dashboard)
-- Go to Storage > Create a new bucket > Name: "uploads" > Make it public

-- Create RLS policies for the uploads bucket
-- Allow authenticated users to upload files
INSERT INTO storage.policies (id, bucket_id, name, definition, check, command)
VALUES (
  'uploads_insert_policy',
  'uploads',
  'Allow authenticated users to upload files',
  '(auth.role() = ''authenticated'')',
  '(auth.role() = ''authenticated'')',
  'INSERT'
) ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to view their own files
INSERT INTO storage.policies (id, bucket_id, name, definition, check, command)
VALUES (
  'uploads_select_policy',
  'uploads',
  'Allow users to view files',
  '(auth.role() = ''authenticated'')',
  '(auth.role() = ''authenticated'')',
  'SELECT'
) ON CONFLICT (id) DO NOTHING;

-- Allow users to update their own files
INSERT INTO storage.policies (id, bucket_id, name, definition, check, command)
VALUES (
  'uploads_update_policy',
  'uploads',
  'Allow users to update their own files',
  '(auth.role() = ''authenticated'')',
  '(auth.role() = ''authenticated'')',
  'UPDATE'
) ON CONFLICT (id) DO NOTHING;

-- Allow users to delete their own files
INSERT INTO storage.policies (id, bucket_id, name, definition, check, command)
VALUES (
  'uploads_delete_policy',
  'uploads',
  'Allow users to delete their own files',
  '(auth.role() = ''authenticated'')',
  '(auth.role() = ''authenticated'')',
  'DELETE'
) ON CONFLICT (id) DO NOTHING;

-- Enable RLS on the uploads bucket
UPDATE storage.buckets 
SET public = true 
WHERE name = 'uploads';
