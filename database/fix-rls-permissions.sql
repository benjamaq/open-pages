-- Fix RLS permissions for follow functionality without breaking existing security
-- Run this in your Supabase SQL editor

-- First, let's see what RLS policies currently exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('stack_followers', 'email_prefs', 'profiles')
ORDER BY tablename, policyname;

-- The issue is that the API needs to insert into stack_followers table
-- but the current RLS policies are too restrictive for server-side operations

-- Let's create a more permissive policy for INSERT operations on stack_followers
-- This allows the API to create follow records while maintaining security

-- Drop the existing restrictive INSERT policy
DROP POLICY IF EXISTS "Anyone can create follows (with verification)" ON stack_followers;

-- Create a new INSERT policy that allows the API to work
-- This policy allows inserts when:
-- 1. The owner_user_id exists in auth.users (valid user)
-- 2. Either follower_user_id is null (email-only follows) OR follower_user_id exists in auth.users
CREATE POLICY "Allow API to create follows" ON stack_followers
  FOR INSERT WITH CHECK (
    -- Owner must be a valid user
    owner_user_id IN (SELECT id FROM auth.users) AND
    -- Either email-only follow (follower_user_id is null) or valid follower user
    (follower_user_id IS NULL OR follower_user_id IN (SELECT id FROM auth.users))
  );

-- Also create a policy for email_prefs inserts
DROP POLICY IF EXISTS "Followers can manage their own email preferences" ON email_prefs;

-- Allow inserts when the follower_id references a valid stack_followers record
CREATE POLICY "Allow API to create email preferences" ON email_prefs
  FOR INSERT WITH CHECK (
    follower_id IN (SELECT id FROM stack_followers)
  );

-- Allow updates to email preferences
CREATE POLICY "Allow followers to update their email preferences" ON email_prefs
  FOR UPDATE USING (
    follower_id IN (
      SELECT id FROM stack_followers 
      WHERE follower_user_id = auth.uid() OR follower_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- Allow followers to view their own email preferences
CREATE POLICY "Allow followers to view their email preferences" ON email_prefs
  FOR SELECT USING (
    follower_id IN (
      SELECT id FROM stack_followers 
      WHERE follower_user_id = auth.uid() OR follower_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- Test the policies by trying to insert a test record
-- This should work now without permission errors
INSERT INTO stack_followers (owner_user_id, follower_email, verified_at)
VALUES (
  (SELECT id FROM auth.users LIMIT 1), 
  'test@example.com', 
  NOW()
);

-- If the insert worked, clean up the test record
DELETE FROM stack_followers WHERE follower_email = 'test@example.com';

-- Show the updated policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('stack_followers', 'email_prefs')
ORDER BY tablename, policyname;
