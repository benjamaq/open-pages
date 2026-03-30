import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

function assertCron(request: NextRequest): NextResponse | null {
  const url = new URL(request.url)
  const header = request.headers.get('authorization') || ''
  const vercelCron = request.headers.get('x-vercel-cron')
  const param = url.searchParams.get('key') || ''
  const secret = process.env.CRON_SECRET || ''
  const okHeader = header === `Bearer ${secret}`
  const okParam = param === secret && secret.length > 0
  const okVercel = !!vercelCron
  if (!secret && !okVercel) {
    return NextResponse.json({ error: 'Missing CRON_SECRET' }, { status: 401 })
  }
  if (!okHeader && !okParam && !okVercel) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return null
}

type ParticipantRow = {
  id: string
  enrolled_at: string
  user_id: string
}

export async function GET(request: NextRequest) {
  const denied = assertCron(request)
  if (denied) return denied

  const dry = new URL(request.url).searchParams.get('dry') === '1'

  try {
    const { data: participants, error: pErr } = await supabaseAdmin
      .from('cohort_participants')
      .select('id, enrolled_at, user_id')
      .eq('status', 'applied')

    if (pErr) {
      console.error('[cohort-compliance] load participants:', pErr)
      return NextResponse.json({ error: pErr.message }, { status: 500 })
    }

    const list = (participants || []) as ParticipantRow[]
    if (list.length === 0) {
      return NextResponse.json({ ok: true, processed: 0, confirmed: 0, dropped: 0, dry })
    }

    const profileIds = [...new Set(list.map((p) => p.user_id))]
    const { data: profs, error: profErr } = await supabaseAdmin
      .from('profiles')
      .select('id, user_id')
      .in('id', profileIds)

    if (profErr) {
      console.error('[cohort-compliance] profiles:', profErr)
      return NextResponse.json({ error: profErr.message }, { status: 500 })
    }

    const authByProfileId = Object.fromEntries((profs || []).map((r: any) => [r.id, r.user_id as string]))

    let confirmed = 0
    let dropped = 0
    const now = Date.now()

    for (const p of list) {
      const authUid = authByProfileId[p.user_id]
      if (!authUid) {
        console.warn('[cohort-compliance] no auth user for profile', p.user_id)
        continue
      }

      const enrolledIso = String(p.enrolled_at)
      const enrollYmd = enrolledIso.slice(0, 10)

      const { data: byCreated, error: cErr } = await supabaseAdmin
        .from('daily_entries')
        .select('id')
        .eq('user_id', authUid)
        .gte('created_at', enrolledIso)
      const { data: byDate, error: dErr } = await supabaseAdmin
        .from('daily_entries')
        .select('id')
        .eq('user_id', authUid)
        .gte('local_date', enrollYmd)

      if (cErr || dErr) {
        console.error('[cohort-compliance] count check-ins', p.id, cErr || dErr)
        continue
      }

      const ids = new Set<string>()
      for (const r of byCreated || []) {
        if ((r as { id?: string }).id) ids.add(String((r as { id: string }).id))
      }
      for (const r of byDate || []) {
        if ((r as { id?: string }).id) ids.add(String((r as { id: string }).id))
      }
      const n = ids.size
      const enrolledMs = new Date(enrolledIso).getTime()
      const past48h = Number.isFinite(enrolledMs) && now - enrolledMs > 48 * 60 * 60 * 1000

      if (n >= 2) {
        if (!dry) {
          const { error: uErr } = await supabaseAdmin
            .from('cohort_participants')
            .update({
              status: 'confirmed',
              confirmed_at: new Date().toISOString(),
            } as any)
            .eq('id', p.id)
            .eq('status', 'applied')
          if (uErr) console.error('[cohort-compliance] confirm update', p.id, uErr)
          else confirmed += 1
        } else {
          confirmed += 1
        }
      } else if (n < 2 && past48h) {
        if (!dry) {
          const { error: uErr } = await supabaseAdmin
            .from('cohort_participants')
            .update({
              status: 'dropped',
              dropped_at: new Date().toISOString(),
            } as any)
            .eq('id', p.id)
            .eq('status', 'applied')
          if (uErr) console.error('[cohort-compliance] drop update', p.id, uErr)
          else dropped += 1
        } else {
          dropped += 1
        }
      }
    }

    return NextResponse.json({
      ok: true,
      processed: list.length,
      confirmed,
      dropped,
      dry,
    })
  } catch (e: any) {
    console.error('[cohort-compliance]', e)
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 })
  }
}
