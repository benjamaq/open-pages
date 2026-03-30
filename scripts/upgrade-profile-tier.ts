#!/usr/bin/env npx tsx
/**
 * Set a user's profile tier (e.g. pro) by email. Uses service role.
 * Usage: npx tsx scripts/upgrade-profile-tier.ts <email> [tier]
 * Example: npx tsx scripts/upgrade-profile-tier.ts user@example.com pro
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

config({ path: resolve(process.cwd(), '.env.local') })

const email = String(process.argv[2] || '').trim().toLowerCase()
const tier = String(process.argv[3] || 'pro').trim().toLowerCase()

async function findUserIdByEmail(
  supabase: ReturnType<typeof createClient>,
  targetEmail: string
): Promise<string | null> {
  let page = 1
  const perPage = 1000
  for (;;) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage })
    if (error) throw error
    const users = data?.users || []
    const found = users.find((u) => String(u.email || '').toLowerCase() === targetEmail)
    if (found?.id) return found.id
    if (users.length < perPage) break
    page++
  }
  return null
}

async function main() {
  if (!email) {
    console.error('Usage: npx tsx scripts/upgrade-profile-tier.ts <email> [tier]')
    process.exit(1)
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
    process.exit(1)
  }

  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  console.log('Looking up:', email)
  const userId = await findUserIdByEmail(supabase, email)
  if (!userId) {
    console.error('No auth user found with that email.')
    process.exit(1)
  }
  console.log('user_id:', userId)

  const { data: before, error: selErr } = await supabase
    .from('profiles')
    .select('id, tier, pro_expires_at')
    .eq('user_id', userId)
    .maybeSingle()

  if (selErr) {
    console.error('profiles select failed:', selErr.message)
    process.exit(1)
  }
  if (!before) {
    console.error('No profiles row for this user_id. Fix signup/trigger first, then retry.')
    process.exit(1)
  }

  console.log('Before:', { tier: before.tier, pro_expires_at: before.pro_expires_at })

  const { data: after, error: updErr } = await supabase
    .from('profiles')
    .update({
      tier,
      // Permanent pro: clear trial expiry so isProActive treats as paid tier
      pro_expires_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .select('id, tier, pro_expires_at')
    .maybeSingle()

  if (updErr) {
    console.error('profiles update failed:', updErr.message)
    process.exit(1)
  }

  console.log('After:', after)
  console.log('Done.')
}

main()
