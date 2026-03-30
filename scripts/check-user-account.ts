#!/usr/bin/env npx tsx
/**
 * Check a user's account status (profile, onboarding, auth).
 * Usage: npx tsx scripts/check-user-account.ts [userId]
 * Default: 4560a4df-60e1-47f3-aaba-281fccce9ed9 (nburtonnz@gmail.com)
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

config({ path: resolve(process.cwd(), '.env.local') })

const USER_ID = process.argv[2] || '4560a4df-60e1-47f3-aaba-281fccce9ed9'

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
    process.exit(1)
  }

  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  console.log('Checking user:', USER_ID)
  console.log('—'.repeat(50))

  // Auth user
  const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(USER_ID)
  if (authError) {
    console.error('Auth lookup failed:', authError.message)
    process.exit(1)
  }
  if (!authUser?.user) {
    console.error('User not found in auth.users')
    process.exit(1)
  }

  const u = authUser.user
  console.log('Auth:')
  console.log('  Email:', u.email)
  console.log('  Created:', u.created_at)
  console.log('  Last sign-in:', u.last_sign_in_at || '(never)')
  console.log('  Email confirmed:', u.email_confirmed_at ? 'yes' : 'no')
  console.log('')

  // Profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', USER_ID)
    .maybeSingle()

  if (profileError) {
    console.error('Profile lookup failed:', profileError.message)
  } else if (!profile) {
    console.log('Profile: NOT FOUND — user has no profiles row (possible trigger issue)')
  } else {
    console.log('Profile:')
    console.log('  Slug:', profile.slug)
    console.log('  Display name:', profile.display_name)
    console.log('  Onboarding completed:', profile.onboarding_completed ?? false)
    console.log('  Profile created:', profile.profile_created ?? false)
    console.log('  Public page viewed:', profile.public_page_viewed ?? false)
    console.log('  First check-in completed:', profile.first_checkin_completed ?? false)
    console.log('  First supplement added:', profile.first_supplement_added ?? false)
    console.log('  Reminder enabled:', profile.reminder_enabled ?? true)
    console.log('')
  }

  // Daily entries count
  const { count: entriesCount } = await supabase
    .from('daily_entries')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', USER_ID)
  console.log('Daily entries:', entriesCount ?? 0)

  // Supplements count
  const { count: supplementsCount } = await supabase
    .from('user_supplements')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', USER_ID)
  console.log('Supplements:', supplementsCount ?? 0)

  console.log('')
  console.log('—'.repeat(50))
  if (!authUser.user.last_sign_in_at) {
    console.log('⚠️  User has never signed in — may indicate auth/session issue')
  } else if (!profile) {
    console.log('⚠️  No profile row — new signups should get one via trigger')
  } else if (!profile.onboarding_completed && !profile.first_checkin_completed) {
    console.log('⚠️  Onboarding not started — user may have had sign-in issues')
  } else {
    console.log('Account looks OK. Multiple sign-ins could be normal (session expiry, different devices).')
  }
}

main()
