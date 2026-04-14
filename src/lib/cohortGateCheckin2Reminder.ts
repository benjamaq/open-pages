import { supabaseAdmin } from '@/lib/supabase/admin'
import {
  cohortParticipantUserIdCandidatesSync,
  fetchProfilesByCohortParticipantUserIds,
} from '@/lib/cohortParticipantUserId'
import { countDistinctDailyEntriesSinceForUserIds } from '@/lib/cohortCheckinCount'
import { cohortTransactionalCheckinMagicHref } from '@/lib/cohortEmailMagicLink'
import { cohortEmailPublicOrigin } from '@/lib/cohortEmailPublicOrigin'
import {
  cohortEmailCheckInCtaHtml,
  cohortEmailPartnerXBioStackrLine,
  escapeHtml,
  firstNameFromAuthUser,
  wrapCohortTransactionalEmailHtml,
} from '@/lib/cohortTransactionalEmailHtml'
import { sendEmail } from '@/lib/email/resend'
import { studyAndProductNamesFromCohortRow } from '@/lib/cohortComplianceConfirmed'

const MS_20H = 20 * 60 * 60 * 1000
const MS_48H = 48 * 60 * 60 * 1000

function isNonEmptyTs(v: unknown): boolean {
  return v != null && String(v).trim() !== ''
}

function firstNameForGreeting(displayName: string | null | undefined, authUser: {
  user_metadata?: Record<string, unknown> | null
  email?: string | null
}): string {
  if (displayName != null && String(displayName).trim() !== '') {
    const w = String(displayName).trim().split(/\s+/)[0]
    if (w) return w
  }
  return firstNameFromAuthUser(authUser)
}

async function participantStillEligibleForCheckin2Reminder(participantId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from('cohort_participants')
    .select('status, confirmed_at, study_started_at, study_completed_at, gate_checkin2_reminder_sent_at')
    .eq('id', participantId)
    .maybeSingle()
  if (error || !data) return false
  const r = data as {
    status?: string
    confirmed_at?: string | null
    study_started_at?: string | null
    study_completed_at?: string | null
    gate_checkin2_reminder_sent_at?: string | null
  }
  if (String(r.status || '') !== 'applied') return false
  if (isNonEmptyTs(r.confirmed_at)) return false
  if (isNonEmptyTs(r.study_started_at)) return false
  if (isNonEmptyTs(r.study_completed_at)) return false
  if (isNonEmptyTs(r.gate_checkin2_reminder_sent_at)) return false
  return true
}

export type CohortGateCheckin2ReminderResult = {
  sent: number
  dry: boolean
  scanned: number
}

/**
 * Second compliance check-in nudge: applied, one distinct check-in day since enroll,
 * enrolled 20–48h ago, single send per participant via gate_checkin2_reminder_sent_at.
 */
export async function runCohortGateCheckin2Reminders(opts: {
  dry: boolean
}): Promise<CohortGateCheckin2ReminderResult> {
  const dry = opts.dry === true
  const now = Date.now()
  let sent = 0

  const { data: participants, error: pErr } = await supabaseAdmin
    .from('cohort_participants')
    .select('id, user_id, cohort_id, enrolled_at')
    .eq('status', 'applied')
    .is('confirmed_at', null)
    .is('study_started_at', null)
    .is('study_completed_at', null)
    .is('gate_checkin2_reminder_sent_at', null)

  if (pErr) {
    console.error('[cohort-gate-checkin2-reminder] load:', pErr)
    return { sent: 0, dry, scanned: 0 }
  }

  const list = participants || []
  if (list.length === 0) {
    return { sent: 0, dry, scanned: 0 }
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
      console.error('[cohort-gate-checkin2-reminder] cohorts:', cErr)
      return { sent: 0, dry, scanned: list.length }
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
  const profileIds = [...new Set(Array.from(profMap.values()).map((r) => r.id))]
  const displayByProfileId = new Map<string, string | null>()
  if (profileIds.length > 0) {
    const { data: dispRows, error: dErr } = await supabaseAdmin
      .from('profiles')
      .select('id, display_name')
      .in('id', profileIds)
    if (dErr) {
      console.error('[cohort-gate-checkin2-reminder] display names:', dErr)
    } else {
      for (const r of (dispRows || []) as Array<{ id: string; display_name?: string | null }>) {
        displayByProfileId.set(String(r.id), r.display_name ?? null)
      }
    }
  }

  for (const p of list) {
    const enrolledMs = new Date(String(p.enrolled_at)).getTime()
    if (!Number.isFinite(enrolledMs)) continue
    const age = now - enrolledMs
    if (age < MS_20H || age >= MS_48H) continue

    const row = profMap.get(p.user_id)
    if (!row) continue
    const entryUserIds = cohortParticipantUserIdCandidatesSync(row.id, row.user_id)
    const n = await countDistinctDailyEntriesSinceForUserIds(entryUserIds, String(p.enrolled_at))
    if (n !== 1) continue

    const authUid = row.user_id

    if (dry) {
      sent += 1
      continue
    }

    const stillEligible = await participantStillEligibleForCheckin2Reminder(p.id)
    if (!stillEligible) {
      console.log('[cohort-gate-checkin2-reminder] skip: no longer eligible', { id: p.id })
      continue
    }

    const { data: auth, error: auErr } = await supabaseAdmin.auth.admin.getUserById(authUid)
    if (auErr || !auth?.user?.email) {
      console.warn('[cohort-gate-checkin2-reminder] no email', authUid)
      continue
    }
    const to = String(auth.user.email).trim()
    if (!to) continue

    const cm = cohortMeta.get(String(p.cohort_id))
    const partnerBrandPlain =
      cm?.brand_name != null && String(cm.brand_name).trim() !== ''
        ? String(cm.brand_name).trim()
        : 'Study partner'
    const cohortSlug = cm?.slug ?? null
    const cohortRowForNames = {
      brand_name: cm?.brand_name ?? null,
      product_name: cm?.product_name ?? null,
    }
    const { productName } = studyAndProductNamesFromCohortRow(cohortRowForNames)

    const { href: checkInHref } = await cohortTransactionalCheckinMagicHref(to, 'gate-checkin2-reminder')

    const displayName = displayByProfileId.get(row.id) ?? null
    const first = escapeHtml(firstNameForGreeting(displayName, auth.user))
    const brandEsc = escapeHtml(partnerBrandPlain)
    const productEsc = escapeHtml(productName)
    const partnerLineEsc = escapeHtml(cohortEmailPartnerXBioStackrLine(partnerBrandPlain))

    const innerHtml =
      `<p style="margin:0 0 16px;">Hi ${first},</p>` +
      `<p style="margin:0 0 16px;">You&apos;re almost in.</p>` +
      `<p style="margin:0 0 16px;">You completed your first check-in yesterday — just one more to go to confirm your place in the <strong>${brandEsc}</strong> <strong>${productEsc}</strong> study.</p>` +
      `<p style="margin:0 0 16px;">It takes 30 seconds. Come back now before your spot is released.</p>` +
      cohortEmailCheckInCtaHtml(checkInHref, 'Complete your second check-in →') +
      `<p style="margin:24px 0 0;font-size:13px;line-height:1.5;color:#6b7280;">${partnerLineEsc}</p>`

    const html = wrapCohortTransactionalEmailHtml({
      appBase: cohortEmailPublicOrigin(),
      partnerBrandName: partnerBrandPlain,
      cohortSlug,
      innerHtml,
      dashboardHref: checkInHref,
      omitDashboardRow: true,
    })

    const subject = "Don't lose your spot — one check-in left to confirm"

    const r = await sendEmail({ to, subject, html })
    if (!r.success) {
      console.error('[cohort-gate-checkin2-reminder] send failed', to, r.error)
      continue
    }

    const { error: uErr } = await supabaseAdmin
      .from('cohort_participants')
      .update({ gate_checkin2_reminder_sent_at: new Date().toISOString() } as Record<string, unknown>)
      .eq('id', p.id)
      .is('gate_checkin2_reminder_sent_at', null)

    if (uErr) {
      console.error('[cohort-gate-checkin2-reminder] mark sent', p.id, uErr)
    } else {
      sent += 1
    }
  }

  return { sent, dry, scanned: list.length }
}
