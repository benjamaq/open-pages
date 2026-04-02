import { NextRequest, NextResponse } from 'next/server'
import {
  sendComplianceConfirmedEmail,
  studyAndProductNamesFromCohortRow,
} from '@/lib/cohortComplianceConfirmed'
import { countDistinctDailyEntriesSince } from '@/lib/cohortCheckinCount'
import { authUserIdFromCohortParticipantProfileMap, fetchProfilesByCohortParticipantUserIds } from '@/lib/cohortParticipantUserId'
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
  cohort_id: string
}

export async function GET(request: NextRequest) {
  const denied = assertCron(request)
  if (denied) return denied

  const dry = new URL(request.url).searchParams.get('dry') === '1'

  try {
    const { data: participants, error: pErr } = await supabaseAdmin
      .from('cohort_participants')
      .select('id, enrolled_at, user_id, cohort_id')
      .eq('status', 'applied')

    if (pErr) {
      console.error('[cohort-compliance] load participants:', pErr)
      return NextResponse.json({ error: pErr.message }, { status: 500 })
    }

    const list = (participants || []) as ParticipantRow[]
    if (list.length === 0) {
      return NextResponse.json({ ok: true, processed: 0, confirmed: 0, dropped: 0, dry })
    }

    const profMap = await fetchProfilesByCohortParticipantUserIds(list.map((p) => p.user_id))

    let confirmed = 0
    let dropped = 0
    const now = Date.now()

    for (const p of list) {
      const authUid = authUserIdFromCohortParticipantProfileMap(p.user_id, profMap)
      if (!authUid) {
        console.warn('[cohort-compliance] no profile for cohort participant user_id', p.user_id)
        continue
      }

      const enrolledIso = String(p.enrolled_at)
      const n = await countDistinctDailyEntriesSince(authUid, enrolledIso)
      const enrolledMs = new Date(enrolledIso).getTime()
      const past48h = Number.isFinite(enrolledMs) && now - enrolledMs > 48 * 60 * 60 * 1000

      if (n >= 2) {
        if (!dry) {
          const { data: confirmedRow, error: uErr } = await supabaseAdmin
            .from('cohort_participants')
            .update({
              status: 'confirmed',
              confirmed_at: new Date().toISOString(),
            } as any)
            .eq('id', p.id)
            .eq('status', 'applied')
            .select('id')
            .maybeSingle()
          if (uErr) {
            console.error('[cohort-compliance] confirm update', p.id, uErr)
          } else if (!confirmedRow) {
            /* already confirmed (e.g. immediate check-in path won the race) */
          } else {
            confirmed += 1
            let studyName = 'study'
            let productName = 'product'
            try {
              const { data: cRow } = await supabaseAdmin
                .from('cohorts')
                .select('product_name, brand_name')
                .eq('id', p.cohort_id)
                .maybeSingle()
              const names = studyAndProductNamesFromCohortRow(cRow as { product_name?: string | null; brand_name?: string | null } | null)
              studyName = names.studyName
              productName = names.productName
            } catch (cohErr) {
              console.error('[cohort-compliance] cohort lookup for email', p.cohort_id, cohErr)
            }
            await sendComplianceConfirmedEmail({
              authUserId: authUid,
              studyName,
              productName,
            })
          }
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
