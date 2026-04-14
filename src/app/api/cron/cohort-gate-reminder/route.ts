import { NextRequest, NextResponse } from 'next/server'
import {
  cohortParticipantUserIdCandidatesSync,
  fetchProfilesByCohortParticipantUserIds,
} from '@/lib/cohortParticipantUserId'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { sendCohortGateReminderEmail } from '@/lib/cohortGateReminderEmail'
import { countDistinctDailyEntriesSinceForUserIds } from '@/lib/cohortCheckinCount'
import { runCohortGateCheckin2Reminders } from '@/lib/cohortGateCheckin2Reminder'

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

type Row = {
  id: string
  user_id: string
  cohort_id: string
  enrolled_at: string
  gate_reminder_sent_at: string | null
  study_started_at: string | null
  confirmed_at: string | null
  study_completed_at: string | null
}

function isNonEmptyTs(v: unknown): boolean {
  return v != null && String(v).trim() !== ''
}

/** Pre-send / pre-dry guard: cohort state may advance while the cron iterates. */
async function participantStillEligibleForGateReminder(participantId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from('cohort_participants')
    .select('status, confirmed_at, study_started_at, study_completed_at, gate_reminder_sent_at')
    .eq('id', participantId)
    .maybeSingle()
  if (error || !data) return false
  const r = data as {
    status?: string
    confirmed_at?: string | null
    study_started_at?: string | null
    study_completed_at?: string | null
    gate_reminder_sent_at?: string | null
  }
  if (String(r.status || '') !== 'applied') return false
  if (isNonEmptyTs(r.confirmed_at)) return false
  if (isNonEmptyTs(r.study_started_at)) return false
  if (isNonEmptyTs(r.study_completed_at)) return false
  if (isNonEmptyTs(r.gate_reminder_sent_at)) return false
  return true
}

export async function GET(request: NextRequest) {
  const denied = assertCron(request)
  if (denied) return denied

  const dry = new URL(request.url).searchParams.get('dry') === '1'
  const now = Date.now()
  const ms24 = 24 * 60 * 60 * 1000
  const ms48 = 48 * 60 * 60 * 1000

  try {
    const { data: participants, error: pErr } = await supabaseAdmin
      .from('cohort_participants')
      .select(
        'id, user_id, cohort_id, enrolled_at, gate_reminder_sent_at, study_started_at, confirmed_at, study_completed_at',
      )
      .eq('status', 'applied')
      .is('confirmed_at', null)
      .is('study_started_at', null)
      .is('study_completed_at', null)

    if (pErr) {
      console.error('[cohort-gate-reminder]', pErr)
      return NextResponse.json({ error: pErr.message }, { status: 500 })
    }

    const list = (participants || []) as Row[]
    if (list.length === 0) {
      return NextResponse.json({ ok: true, sent: 0, dry })
    }

    const cohortIds = [...new Set(list.map((p) => p.cohort_id).filter(Boolean))]
    const cohortMeta = new Map<
      string,
      { slug: string | null; brand_name: string | null; product_name: string | null }
    >()
    if (cohortIds.length > 0) {
      const { data: cRows, error: cErr } = await supabaseAdmin
        .from('cohorts')
        .select('id, slug, brand_name, product_name')
        .in('id', cohortIds)
      if (cErr) {
        console.error('[cohort-gate-reminder] cohorts lookup', cErr)
        return NextResponse.json({ error: cErr.message }, { status: 500 })
      }
      for (const c of (cRows || []) as Array<{
        id: string
        slug?: string | null
        brand_name?: string | null
        product_name?: string | null
      }>) {
        cohortMeta.set(String(c.id), {
          slug: c.slug != null && String(c.slug).trim() !== '' ? String(c.slug).trim() : null,
          brand_name: c.brand_name ?? null,
          product_name: c.product_name ?? null,
        })
      }
    }

    const profMap = await fetchProfilesByCohortParticipantUserIds(list.map((p) => p.user_id))

    let sent = 0
    for (const p of list) {
      if (p.gate_reminder_sent_at) continue
      const enrolledMs = new Date(String(p.enrolled_at)).getTime()
      if (!Number.isFinite(enrolledMs)) continue
      const age = now - enrolledMs
      if (age < ms24 || age >= ms48) continue

      const row = profMap.get(p.user_id)
      if (!row) continue
      const entryUserIds = cohortParticipantUserIdCandidatesSync(row.id, row.user_id)
      const authUid = row.user_id

      const n = await countDistinctDailyEntriesSinceForUserIds(entryUserIds, String(p.enrolled_at))
      if (n >= 1) continue

      const stillEligible = await participantStillEligibleForGateReminder(p.id)
      if (!stillEligible) {
        console.log('[cohort-gate-reminder] skip: participant no longer pre-compliance', {
          cohortParticipantId: p.id,
          user_id: p.user_id,
        })
        continue
      }

      if (dry) {
        sent += 1
        continue
      }

      const { data: auth, error: auErr } = await supabaseAdmin.auth.admin.getUserById(authUid)
      if (auErr || !auth?.user?.email) {
        console.warn('[cohort-gate-reminder] no email', authUid)
        continue
      }
      const to = String(auth.user.email).trim()
      if (!to) continue

      const cm = cohortMeta.get(String(p.cohort_id))
      const r = await sendCohortGateReminderEmail(to, {
        partnerBrandName:
          cm?.brand_name != null && String(cm.brand_name).trim() !== ''
            ? String(cm.brand_name).trim()
            : 'Study partner',
        productName: cm?.product_name != null ? String(cm.product_name).trim() : null,
        cohortSlug: cm?.slug ?? null,
      })
      if (!r.success) {
        console.error('[cohort-gate-reminder] send failed', to, r.error)
        continue
      }

      const { error: uErr } = await supabaseAdmin
        .from('cohort_participants')
        .update({ gate_reminder_sent_at: new Date().toISOString() } as Record<string, unknown>)
        .eq('id', p.id)
        .is('gate_reminder_sent_at', null)

      if (uErr) {
        console.error('[cohort-gate-reminder] mark sent', p.id, uErr)
      } else {
        sent += 1
      }
    }

    const gateCheckin2Reminder = await runCohortGateCheckin2Reminders({ dry })
    return NextResponse.json({
      ok: true,
      sent,
      dry,
      scanned: list.length,
      gate_checkin2_reminder: gateCheckin2Reminder,
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Failed'
    console.error('[cohort-gate-reminder]', e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
