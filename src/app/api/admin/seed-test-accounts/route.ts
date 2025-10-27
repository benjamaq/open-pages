import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

type Entry = {
  local_date: string
  pain: number
  mood: number
  sleep_quality?: number | null
  sleep_hours?: number | null
  tags?: string[] | null
  symptoms?: string[] | null
}

type AccountSpec = {
  display_name: string
  slug: string
  email: string
  bio: string
  entries: Entry[]
}

function clamp01to10(n: number): number {
  return Math.max(0, Math.min(10, Math.round(n)))
}

function jitter(val: number, delta = 1): number {
  const jittered = val + (Math.random() < 0.5 ? -1 : 1) * (Math.random() * delta)
  return clamp01to10(jittered)
}

function buildAccounts(): AccountSpec[] {
  const dates: string[] = []
  const start = new Date('2025-10-13T00:00:00Z')
  for (let i = 0; i < 14; i++) {
    const d = new Date(start.getTime() + i * 86400000)
    dates.push(d.toISOString().slice(0, 10))
  }

  // Account 1: Caffeine signal (first 7 days with too_much_caffeine, worse pain/mood)
  const acc1Entries: Entry[] = dates.map((d, idx) => {
    const withCaffeine = idx < 7
    const basePain = withCaffeine ? 8 : 3
    const baseMood = withCaffeine ? 3 : 8
    const sleepQ = 7
    const sleepH = 7
    const tags = withCaffeine ? ['too_much_caffeine'] : []
    const symptoms = withCaffeine ? (idx % 2 === 0 ? ['irritability'] : ['irritability', 'anxiety']) : []
    return {
      local_date: d,
      pain: jitter(basePain, 0.8),
      mood: jitter(baseMood, 0.8),
      sleep_quality: jitter(sleepQ, 0.5),
      sleep_hours: sleepH,
      tags,
      symptoms,
    }
  })

  // Account 2: Magnesium helps (tag 'magnesium' on most days)
  const magnesiumDays = new Set([0,1,2,4,5,7,8,10,11,13]) // 10 days with magnesium
  const acc2Entries: Entry[] = dates.map((d, idx) => {
    const withMag = magnesiumDays.has(idx)
    const basePain = withMag ? 3 : 7
    const baseMood = withMag ? 7 : 4
    const sleepQ = withMag ? 7.5 : 7
    const tags = withMag ? ['magnesium'] : []
    const symptoms = withMag ? [] : ['muscle_pain']
    return {
      local_date: d,
      pain: jitter(basePain, 0.8),
      mood: jitter(baseMood, 0.8),
      sleep_quality: jitter(sleepQ, 0.6),
      sleep_hours: withMag ? 7.5 : 7,
      tags,
      symptoms,
    }
  })

  // Account 3: Sleep master (first 7 days poor sleep, tag 'poor_sleep')
  const acc3Entries: Entry[] = dates.map((d, idx) => {
    const poor = idx < 7
    const basePain = poor ? 8 : 3
    const baseMood = poor ? 3 : 8
    const sleepQ = poor ? (idx % 2 === 0 ? 4 : 3) : (idx % 2 === 0 ? 8 : 9)
    const sleepH = poor ? 4.5 : 8.5
    const tags = poor ? ['poor_sleep'] : []
    const sym = poor ? (idx % 3 === 0 ? ['fatigue','brain_fog'] : ['fatigue']) : []
    return {
      local_date: d,
      pain: jitter(basePain, 0.8),
      mood: jitter(baseMood, 0.8),
      sleep_quality: clamp01to10(sleepQ),
      sleep_hours: sleepH,
      tags,
      symptoms: sym,
    }
  })

  return [
    {
      display_name: 'Casey Chen - Caffeine Test',
      slug: 'test-caffeine-signal',
      email: 'test-caffeine@biostackr.test',
      bio: 'Testing caffeine pattern detection',
      entries: acc1Entries,
    },
    {
      display_name: 'Morgan Smith - Magnesium Test',
      slug: 'test-magnesium-proof',
      email: 'test-magnesium@biostackr.test',
      bio: 'Testing magnesium supplement detection',
      entries: acc2Entries,
    },
    {
      display_name: 'Sam Taylor - Sleep Test',
      slug: 'test-sleep-master',
      email: 'test-sleep@biostackr.test',
      bio: 'Testing sleep quality pattern detection',
      entries: acc3Entries,
    },
  ]
}

export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const dryRun = url.searchParams.get('dryRun') === '1' || url.searchParams.get('dry') === '1'

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: 'Missing Supabase service credentials' }, { status: 500 })
    }
    const supabase = createServiceClient(supabaseUrl, serviceKey)

    const accounts = buildAccounts()

    if (dryRun) {
      return NextResponse.json({ ok: true, preview: accounts.map(a => ({ email: a.email, entries: a.entries.length })) })
    }

    const results: any[] = []
    for (const acc of accounts) {
      // Create auth user (no password, email_confirmed)
      const userResp = await (supabase as any).auth.admin.createUser({
        email: acc.email,
        email_confirm: true,
        user_metadata: { display_name: acc.display_name }
      })
      const userId = userResp?.data?.user?.id
      if (!userId) {
        results.push({ email: acc.email, ok: false, error: userResp?.error?.message || 'auth create failed' })
        continue
      }

      // Upsert profile
      await (supabase as any)
        .from('profiles')
        .upsert({ id: userId, email: acc.email, display_name: acc.display_name, slug: acc.slug, bio: acc.bio, public: true, created_at: new Date().toISOString() }, { onConflict: 'id' })

      // Insert entries oldest to newest
      const sorted = [...acc.entries].sort((a, b) => a.local_date.localeCompare(b.local_date))
      for (const e of sorted) {
        await (supabase as any)
          .from('daily_entries')
          .insert({
            user_id: userId,
            local_date: e.local_date,
            pain: e.pain,
            mood: e.mood,
            sleep_quality: e.sleep_quality ?? null,
            sleep_hours: e.sleep_hours ?? null,
            tags: (e.tags && e.tags.length) ? e.tags : [],
            symptoms: (e.symptoms && e.symptoms.length) ? e.symptoms : [],
            created_at: `${e.local_date}T08:00:00Z`,
          })
      }

      // Validate counts
      const { count } = await (supabase as any)
        .from('daily_entries')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('local_date', '2025-10-13')
        .lte('local_date', '2025-10-26')
      results.push({ email: acc.email, ok: true, userId, entries: count })
    }

    return NextResponse.json({ ok: true, results })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}


