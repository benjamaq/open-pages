import { countDistinctDailyEntriesSinceForUserIds } from '@/lib/cohortCheckinCount'
import { cohortParticipantUserIdCandidatesSync } from '@/lib/cohortParticipantUserId'
import { sendEmail } from '@/lib/email/resend'
import { supabaseAdmin } from '@/lib/supabase/admin'

function escapeHtml(s: string): string {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function firstNameFromAuthUser(user: { user_metadata?: Record<string, unknown> | null; email?: string | null }): string {
  const m = user.user_metadata || {}
  if (typeof m.first_name === 'string' && m.first_name.trim()) return m.first_name.trim()
  if (typeof m.name === 'string' && m.name.trim()) return m.name.trim().split(/\s+/)[0] || 'there'
  if (typeof m.full_name === 'string' && m.full_name.trim()) return m.full_name.trim().split(/\s+/)[0] || 'there'
  const em = user.email ? String(user.email).split('@')[0] : ''
  return em || 'there'
}

/** Deep-link opens cohort dashboard check-in flow (see CheckinLauncher + CohortStudyDashboard id). */
export function cohortParticipantDashboardCheckinUrl(appBaseRaw: string): string {
  const appBase = String(appBaseRaw || 'https://www.biostackr.io').replace(/\/$/, '')
  return `${appBase}/dashboard?checkin=1#cohort-study-dashboard`
}

/**
 * After first distinct compliance check-in (n === 1): send nudge for second check-in.
 * Claimed atomically via post_first_checkin_email_sent_at to avoid duplicates.
 */
export async function trySendCohortPostFirstCheckinEmail(opts: {
  authUserId: string
  profileId: string
  cohortSlug: string
}): Promise<void> {
  const slug = String(opts.cohortSlug || '').trim()
  if (!slug || !opts.profileId || !opts.authUserId) return

  try {
    const { data: cohort, error: cErr } = await supabaseAdmin
      .from('cohorts')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()
    if (cErr || !cohort?.id) return

    const userKeys = cohortParticipantUserIdCandidatesSync(opts.profileId, opts.authUserId)
    const { data: part, error: pErr } = await supabaseAdmin
      .from('cohort_participants')
      .select('id, enrolled_at')
      .in('user_id', userKeys)
      .eq('cohort_id', cohort.id)
      .eq('status', 'applied')
      .maybeSingle()
    if (pErr || !part?.id || !part.enrolled_at) return

    const n = await countDistinctDailyEntriesSinceForUserIds(userKeys, String(part.enrolled_at))
    if (n !== 1) return

    const { data: claimed, error: claimErr } = await supabaseAdmin
      .from('cohort_participants')
      .update({ post_first_checkin_email_sent_at: new Date().toISOString() } as Record<string, unknown>)
      .eq('id', part.id)
      .is('post_first_checkin_email_sent_at', null)
      .select('id')
      .maybeSingle()

    if (claimErr || !claimed?.id) return

    const { data: auth, error: auErr } = await supabaseAdmin.auth.admin.getUserById(opts.authUserId)
    if (auErr || !auth?.user?.email) {
      console.error('[cohort-post-first-checkin-email] no email', opts.authUserId, auErr?.message)
      return
    }
    const to = String(auth.user.email).trim()
    if (!to) return

    const first = escapeHtml(firstNameFromAuthUser(auth.user))
    const appBase = (process.env.NEXT_PUBLIC_APP_URL || 'https://www.biostackr.io').replace(/\/$/, '')
    const checkinUrl = cohortParticipantDashboardCheckinUrl(appBase)

    const html = `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;line-height:1.6;color:#1a1a1a;padding:24px;max-width:560px;">
<p>Hi ${first},</p>
<p>Thanks for joining the SureSleep study with DoNotAge -- great to have you in.</p>
<p>You've completed your first check-in, so you're now one step away from securing your place.</p>
<p>Complete your second check-in tomorrow and you'll be fully confirmed in the study. From there:</p>
<p style="margin:16px 0;">- Your SureSleep supply will be dispatched<br>
- You'll begin your 21-day tracking<br>
- You'll receive your personal results at the end<br>
- And your completion reward is locked in</p>
<p>This is where it starts to get interesting.</p>
<p>Complete your next check-in here: <a href="${checkinUrl}" style="color:#C84B2F;font-weight:600;">${escapeHtml(checkinUrl)}</a></p>
<p style="margin-top:24px;color:#444;font-size:14px;">DoNotAge x BioStackr<br>
Running a real-world customer outcomes study<br>
Your data stays private and is only used in anonymised analysis<br>
BIOSTACKR</p>
</body></html>`

    const r = await sendEmail({
      to,
      subject: 'One more check-in to confirm your place',
      html,
    })
    if (!r.success) {
      console.error('[cohort-post-first-checkin-email] send failed:', to, r.error)
      await supabaseAdmin
        .from('cohort_participants')
        .update({ post_first_checkin_email_sent_at: null } as Record<string, unknown>)
        .eq('id', part.id)
    }
  } catch (e) {
    console.error('[cohort-post-first-checkin-email]', e)
  }
}
