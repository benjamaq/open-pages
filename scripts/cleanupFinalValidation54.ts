/**
 * Destructive cleanup for seedFinalValidation54.ts data.
 *
 * Deletes (per user): cohort_participant_results → daily_entries → cohort_participants → profiles → auth.users
 *
 *   One run (by user_metadata.run_tag):
 *     npx dotenv-cli -e .env.local -- npx tsx scripts/cleanupFinalValidation54.ts --runTag=1775846453952
 *
 *   All final54 batches ever (user_metadata.seed_batch === "final54"):
 *     npx dotenv-cli -e .env.local -- npx tsx scripts/cleanupFinalValidation54.ts --all
 *
 * Requires service role. Confirm project before running.
 */

import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
const SEED_BATCH = 'final54'

function parseArgs(): { runTag: string | null; all: boolean } {
  const argv = process.argv.slice(2)
  let runTag: string | null = null
  let all = false
  for (const a of argv) {
    if (a === '--all') all = true
    if (a.startsWith('--runTag=')) runTag = a.slice('--runTag='.length).trim() || null
  }
  return { runTag, all }
}

type MetaUser = { id: string; email?: string; user_metadata?: Record<string, unknown> }

async function listAllAuthUsers(supabase: ReturnType<typeof createClient>): Promise<MetaUser[]> {
  const out: MetaUser[] = []
  let page = 1
  const perPage = 1000
  for (;;) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage })
    if (error) throw new Error(`listUsers page ${page}: ${error.message}`)
    const users = (data?.users || []) as MetaUser[]
    out.push(...users)
    if (users.length < perPage) break
    page += 1
  }
  return out
}

async function main() {
  const { runTag, all } = parseArgs()
  if (!url || !key) {
    console.error('Need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }
  if ((!runTag && !all) || (runTag && all)) {
    console.error('Usage: --runTag=<timestamp>  OR  --all')
    process.exit(1)
  }

  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })

  const users = await listAllAuthUsers(supabase)
  const targets = users.filter((u) => {
    const meta = u.user_metadata || {}
    if (String(meta.seed_batch || '') !== SEED_BATCH) return false
    if (all) return true
    return String(meta.run_tag || '') === runTag
  })

  console.log('Matched auth users:', targets.length, all ? '(all final54)' : `runTag=${runTag}`)
  if (targets.length === 0) {
    console.log('Nothing to delete.')
    return
  }

  const ids = targets.map((u) => u.id)

  const chunk = <T,>(arr: T[], size: number): T[][] => {
    const c: T[][] = []
    for (let i = 0; i < arr.length; i += size) c.push(arr.slice(i, i + size))
    return c
  }

  for (const batch of chunk(ids, 100)) {
    const { error: e1 } = await supabase.from('cohort_participant_results').delete().in('user_id', batch)
    if (e1) console.error('cohort_participant_results delete:', e1.message)

    const { error: e2 } = await supabase.from('daily_entries').delete().in('user_id', batch)
    if (e2) console.error('daily_entries delete:', e2.message)

    const { error: e3 } = await supabase.from('cohort_participants').delete().in('user_id', batch)
    if (e3) console.error('cohort_participants delete:', e3.message)

    const { error: e4 } = await supabase.from('profiles').delete().in('user_id', batch)
    if (e4) console.error('profiles delete:', e4.message)
  }

  for (const u of targets) {
    const { error: e5 } = await supabase.auth.admin.deleteUser(u.id)
    if (e5) console.error('auth delete', u.id, u.email, e5.message)
  }

  console.log('Cleanup finished.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
