-- CRITICAL SECURITY FIX - URGENT
-- Fix major RLS bypass vulnerabilities
-- Run this IMMEDIATELY in Supabase SQL editor

-- 1. FIX BETA CODES TABLE - Remove public access
DROP POLICY IF EXISTS "Anyone can view beta codes" ON beta_codes;
DROP POLICY IF EXISTS "Users can update beta codes when using them" ON beta_codes;

-- Only allow users to view their own used beta codes
CREATE POLICY "Users can view their own used beta codes" ON beta_codes
  FOR SELECT USING (used_by = auth.uid());

-- Only allow system to update beta codes (via service role)
-- No public access to updates

-- 2. FIX STACK FOLLOWERS TABLE - Remove public insert
DROP POLICY IF EXISTS "Anyone can create follows (with verification)" ON stack_followers;

-- Only allow authenticated users to create follows
CREATE POLICY "Authenticated users can create follows" ON stack_followers
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 3. FIX WAITLIST TABLE - Remove public access
DROP POLICY IF EXISTS "Anyone can view waitlist signups" ON waitlist_signups;

-- Only allow system/admin access to waitlist data
-- No public access to view signups

-- 4. ADD ADDITIONAL SECURITY POLICIES

-- Beta codes: Only allow system to insert new codes
CREATE POLICY "System can insert beta codes" ON beta_codes
  FOR INSERT WITH CHECK (false); -- Only service role can insert

-- Stack followers: Restrict updates
CREATE POLICY "Users can update their own follows" ON stack_followers
  FOR UPDATE USING (
    follower_user_id = auth.uid() OR 
    owner_user_id = auth.uid()
  );

-- Waitlist: Only allow system to insert
CREATE POLICY "System can insert waitlist signups" ON waitlist_signups
  FOR INSERT WITH CHECK (false); -- Only service role can insert

-- 5. VERIFY SECURITY
-- Check that RLS is properly enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('beta_codes', 'stack_followers', 'waitlist_signups', 'email_prefs')
AND schemaname = 'public';

-- Check policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('beta_codes', 'stack_followers', 'waitlist_signups', 'email_prefs')
ORDER BY tablename, policyname;
