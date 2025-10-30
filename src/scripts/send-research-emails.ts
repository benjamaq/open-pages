/*
  One-time script to email users who checked in once and churned

  Usage:
    DRY RUN (no send): npx tsx src/scripts/send-research-emails.ts
    SEND:              npx tsx src/scripts/send-research-emails.ts --send
*/

import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

// Load .env.local from project root so terminal exports aren't required
config({ path: resolve(process.cwd(), '.env.local') })

type ProfileRow = {
  user_id: string
  display_name: string | null
  created_at: string
}

async function main() {
  const isSend = process.argv.includes('--send')
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const resendKey = process.env.RESEND_API_KEY

  if (!url || !serviceKey || !resendKey) {
    console.error('Missing env vars in .env.local file')
    console.error('Need: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY')
    process.exit(1)
  }

  const supabase = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
  // 1) Use RPC that exactly matches desired criteria (date, email filters, exactly 1 check-in)
  const { data: users, error: usersError } = await supabase
    .rpc('get_research_email_users', { max_results: 15 })

  if (usersError) {
    console.error('Failed to fetch users via RPC get_research_email_users:', usersError)
    process.exit(1)
  }

  const results: Array<{ userId: string; email: string; name: string | null; createdAt: string }> = []
  let wouldHaveDeduped = 0
  let examinedCandidates = 0
  const rpcCount = users?.length || 0

  // 2) Iterate RPC results; fetch optional display_name for personalization; perform dedup count only
  for (const u of (users as Array<{ user_id: string; email: string; created_at: string }>)) {
    try {
      examinedCandidates++
      const email = u.email
      const createdAt = u.created_at
      // Optional: fetch display_name
      let displayName: string | null = null
      try {
        const { data: prof } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('user_id', u.user_id)
          .maybeSingle()
        displayName = (prof as any)?.display_name || null
      } catch {}

      // Skip if already sent this research email
      // First run: skip dedup exclusion, but count those that would be deduped
      const { data: sentAlready } = await supabase
        .from('email_sends')
        .select('id')
        .eq('user_id', u.user_id)
        .eq('email_type', 'user_research')
        .limit(1)
      if (sentAlready && sentAlready.length) {
        wouldHaveDeduped++
        // continue; // intentionally NOT continuing on first run
      }

      results.push({ userId: u.user_id, email, name: displayName, createdAt })
    } catch (e) {
      // Continue on error to next user
    }
  }

  // 3) DRY RUN report (+ debug counters)
  if (!isSend) {
    console.log('DRY RUN: would send research emails to (limit 15):')
    results.forEach((r, i) => {
      console.log(`${i + 1}. ${r.email}  (user_id=${r.userId}, name=${r.name || '—'}, created=${r.createdAt})`)
    })
    if (results.length === 0) console.log('No eligible users found.')
    console.log('\n--- DEBUG COUNTS ---')
    console.log('RPC matched users:', rpcCount)
    console.log('Examined candidates:', examinedCandidates)
    console.log('Would have been deduped (skipped on first run):', wouldHaveDeduped)
    console.log('Included (results):', results.length)
    process.exit(0)
  }

  // 4) SEND mode
  const resend = new Resend(resendKey!)
  const from = 'Ben from BioStackr <notifications@biostackr.io>'
  const replyTo = 'findbenhere@gmail.com'
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://biostackr.io'

  console.log(`Sending ${results.length} emails...`)
  for (const r of results) {
    const firstName = (r.name || '').toString().split(' ')[0] || 'there'
    const text = `Hey ${firstName},

I saw you checked in once on BioStackr but didn't come back.

I'm Ben, I built this. What got in the way? Was it confusing, not interesting, or did you just forget?

Your honest answer helps me make it better.

Thanks,
Ben

P.S. If you want to try again: ${base}/dash`

    try {
      const sendRes = await resend.emails.send({
        from,
        to: r.email,
        subject: 'Quick question from the BioStackr founder',
        reply_to: replyTo,
        text
      })
      console.log(`✅ Sent to ${r.email} (${r.userId}) id=${(sendRes as any)?.id || 'n/a'}`)

      // Record send to prevent duplicates
      await supabase.from('email_sends').insert({
        user_id: r.userId,
        email_type: 'user_research',
        sent_at: new Date().toISOString()
      })
    } catch (e: any) {
      console.warn(`⚠️ Failed to send to ${r.email} (${r.userId}):`, e?.message || e)
    }
  }

  console.log('Done.')
  process.exit(0)
}

main().catch((e) => {
  console.error('Fatal error:', e)
  process.exit(1)
})


