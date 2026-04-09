import { cohortTransactionalCheckinMagicHref } from '@/lib/cohortEmailMagicLink'
import { cohortEmailCheckInLandingAbsoluteUrl } from '@/lib/cohortCheckInLanding'
import { cohortParticipantUserIdCandidatesSync } from '@/lib/cohortParticipantUserId'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * Shared eligibility for daily-reminder magic links and cohort transactional email shell.
 * Same gates: profile cohort_id → cohorts row → cohort_participants row; not dropped/completed; study not completed.
 */
async function resolveDailyReminderCohortParticipantContext(opts: {
  authUserId: string
  recipientEmail: string
}): Promise<
  | { eligible: false }
  | { eligible: true; partnerBrandName: string | null }
> {
  const email = String(opts.recipientEmail || '').trim()
  const uid = String(opts.authUserId || '').trim()
  if (!email || !uid) {
    return { eligible: false }
  }

  const { data: prof } = await supabaseAdmin
    .from('profiles')
    .select('id, cohort_id')
    .eq('user_id', uid)
    .maybeSingle()

  const cohortSlug = String((prof as { cohort_id?: string | null } | null)?.cohort_id || '').trim()
  if (!cohortSlug || !(prof as { id?: string } | null)?.id) {
    return { eligible: false }
  }

  const { data: cohortRow } = await supabaseAdmin
    .from('cohorts')
    .select('id, brand_name')
    .eq('slug', cohortSlug)
    .maybeSingle()

  const cohortUuid = (cohortRow as { id?: string } | null)?.id
  if (!cohortUuid) {
    return { eligible: false }
  }

  const brandRaw = (cohortRow as { brand_name?: string | null } | null)?.brand_name
  const partnerBrandName =
    brandRaw != null && String(brandRaw).trim() !== '' ? String(brandRaw).trim() : null

  const userKeys = cohortParticipantUserIdCandidatesSync(String((prof as { id: string }).id), uid)
  const { data: cpRows } = await supabaseAdmin
    .from('cohort_participants')
    .select('status, study_completed_at')
    .eq('cohort_id', cohortUuid)
    .in('user_id', userKeys)
    .limit(1)

  const cp = cpRows?.[0] as { status?: string | null; study_completed_at?: string | null } | undefined
  if (!cp) {
    return { eligible: false }
  }

  const status = String(cp.status || '').toLowerCase()
  if (status === 'dropped' || status === 'completed') {
    return { eligible: false }
  }
  if (cp.study_completed_at != null && String(cp.study_completed_at).trim() !== '') {
    return { eligible: false }
  }

  return { eligible: true, partnerBrandName }
}

/**
 * Daily-reminder V3 template: use cohort partner × BioStackr shell only when the same logic would issue a magic check-in link.
 */
export async function resolveDailyReminderEmailShellForUser(opts: {
  authUserId: string
  recipientEmail: string
}): Promise<{ cohortTransactionalShell: boolean; partnerBrandName: string | null }> {
  const ctx = await resolveDailyReminderCohortParticipantContext(opts)
  if (!ctx.eligible) {
    return { cohortTransactionalShell: false, partnerBrandName: null }
  }
  return {
    cohortTransactionalShell: true,
    partnerBrandName: ctx.partnerBrandName,
  }
}

/**
 * Daily reminder V3 template (`daily-reminder.tsx`): cohort study participants should receive
 * `/auth/callback?token_hash=…` check-in links; everyone else uses the stable `/check-in` landing.
 */
export async function resolveDailyReminderCheckinHrefForUser(opts: {
  authUserId: string
  recipientEmail: string
}): Promise<string> {
  const email = String(opts.recipientEmail || '').trim()
  const uid = String(opts.authUserId || '').trim()
  if (!email || !uid) {
    return cohortEmailCheckInLandingAbsoluteUrl()
  }

  const ctx = await resolveDailyReminderCohortParticipantContext({ authUserId: uid, recipientEmail: email })
  if (!ctx.eligible) {
    return cohortEmailCheckInLandingAbsoluteUrl()
  }

  const { href } = await cohortTransactionalCheckinMagicHref(email, 'daily-reminder')
  return href
}
