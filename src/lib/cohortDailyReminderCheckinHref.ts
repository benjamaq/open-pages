import { cohortTransactionalCheckinMagicHref } from '@/lib/cohortEmailMagicLink'
import { cohortEmailCheckInLandingAbsoluteUrl } from '@/lib/cohortCheckInLanding'
import { cohortParticipantUserIdCandidatesSync } from '@/lib/cohortParticipantUserId'
import { supabaseAdmin } from '@/lib/supabase/admin'

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

  const { data: prof } = await supabaseAdmin
    .from('profiles')
    .select('id, cohort_id')
    .eq('user_id', uid)
    .maybeSingle()

  const cohortSlug = String((prof as { cohort_id?: string | null } | null)?.cohort_id || '').trim()
  if (!cohortSlug || !(prof as { id?: string } | null)?.id) {
    return cohortEmailCheckInLandingAbsoluteUrl()
  }

  const { data: cohortRow } = await supabaseAdmin.from('cohorts').select('id').eq('slug', cohortSlug).maybeSingle()
  const cohortUuid = (cohortRow as { id?: string } | null)?.id
  if (!cohortUuid) {
    return cohortEmailCheckInLandingAbsoluteUrl()
  }

  const userKeys = cohortParticipantUserIdCandidatesSync(String((prof as { id: string }).id), uid)
  const { data: cpRows } = await supabaseAdmin
    .from('cohort_participants')
    .select('status, study_completed_at')
    .eq('cohort_id', cohortUuid)
    .in('user_id', userKeys)
    .limit(1)

  const cp = cpRows?.[0] as { status?: string | null; study_completed_at?: string | null } | undefined
  if (!cp) {
    return cohortEmailCheckInLandingAbsoluteUrl()
  }

  const status = String(cp.status || '').toLowerCase()
  if (status === 'dropped' || status === 'completed') {
    return cohortEmailCheckInLandingAbsoluteUrl()
  }
  if (cp.study_completed_at != null && String(cp.study_completed_at).trim() !== '') {
    return cohortEmailCheckInLandingAbsoluteUrl()
  }

  const { href } = await cohortTransactionalCheckinMagicHref(email, 'daily-reminder')
  return href
}
