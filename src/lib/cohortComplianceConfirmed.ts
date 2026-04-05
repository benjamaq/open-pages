import { countDistinctDailyEntriesSinceForUserIds } from '@/lib/cohortCheckinCount'
import { cohortParticipantUserIdCandidatesSync } from '@/lib/cohortParticipantUserId'
import { cohortDashboardStudyPath } from '@/lib/cohortDashboardDeepLink'
import { cohortEmailPublicOrigin } from '@/lib/cohortEmailPublicOrigin'
import {
  cohortEmailDashboardCtaHtml,
  escapeHtml,
  firstNameFromAuthUser,
  wrapCohortTransactionalEmailHtml,
} from '@/lib/cohortTransactionalEmailHtml'
import { sendEmail } from '@/lib/email/resend'
import { supabaseAdmin } from '@/lib/supabase/admin'

export function studyAndProductNamesFromCohortRow(
  cRow: { product_name?: string | null; brand_name?: string | null } | null | undefined,
): { studyName: string; productName: string } {
  let studyName = 'study'
  let productName = 'product'
  if (!cRow) return { studyName, productName }
  const pn = cRow.product_name
  const bn = cRow.brand_name
  productName = pn != null && String(pn).trim() !== '' ? String(pn).trim() : productName
  const brand = bn != null && String(bn).trim() !== '' ? String(bn).trim() : ''
  studyName = brand ? `${brand} ${productName}` : productName
  return { studyName, productName }
}

/** Confirmation email after two qualifying check-ins (cron backstop + immediate path from /api/checkin). */
export async function sendComplianceConfirmedEmail(params: {
  authUserId: string
  studyName: string
  productName: string
  brandName?: string | null
}): Promise<void> {
  try {
    const { data: auth, error: auErr } = await supabaseAdmin.auth.admin.getUserById(params.authUserId)
    if (auErr || !auth?.user?.email) {
      console.error('[cohort-compliance] confirm email: no auth email', params.authUserId, auErr?.message)
      return
    }
    const to = String(auth.user.email).trim()
    if (!to) return

    const first = escapeHtml(firstNameFromAuthUser(auth.user))
    const study = escapeHtml(params.studyName)
    const product = escapeHtml(params.productName)
    const brand = escapeHtml(String(params.brandName ?? '').trim() || 'DoNotAge')
    const appBase = cohortEmailPublicOrigin()
    const dashboardStudyHref = `${appBase}${cohortDashboardStudyPath()}`

    const innerHtml =
      `<p style="margin:0 0 16px;">Hi ${first},</p>` +
      `<p style="margin:0 0 20px;">You're in. Your place in the <strong>${study}</strong> study is confirmed. <strong>${brand}</strong> will be dispatching your <strong>${product}</strong> shortly — <strong>BioStackr</strong> runs the study platform and your check-ins.</p>` +
      `<p style="margin:0 0 6px;"><strong>Before it arrives</strong></p>` +
      `<p style="margin:0 0 18px;">Keep your routine stable — no new supplements. We want a clean baseline.</p>` +
      `<p style="margin:0 0 6px;"><strong>When it arrives</strong></p>` +
      `<p style="margin:0 0 18px;">Take ${product} in the evening (45 minutes before bed).<br />Complete your first check-in the next morning.</p>` +
      `<p style="margin:0 0 6px;"><strong>During the study</strong></p>` +
      `<p style="margin:0 0 18px;">You'll get a short daily reminder from <strong>BioStackr</strong>. Each check-in takes ~30 seconds.</p>` +
      `<p style="margin:0 0 6px;"><strong>At the end</strong></p>` +
      `<p style="margin:0 0 18px;">You'll receive a clear breakdown of what actually changed for you.</p>` +
      `<p style="margin:0 0 20px;">Your completion reward — a 3-month supply of ${product} from <strong>${brand}</strong>, plus three months of BioStackr Pro — is locked in from today.</p>` +
      `<p style="margin:0;">Thank you for being part of this.</p>` +
      cohortEmailDashboardCtaHtml(dashboardStudyHref)

    const html = wrapCohortTransactionalEmailHtml({
      appBase,
      innerHtml,
      dashboardHref: dashboardStudyHref,
      omitDashboardRow: true,
    })

    const r = await sendEmail({
      to,
      subject: "You're in — your product is on its way",
      html,
    })
    if (!r.success) {
      console.error('[cohort-compliance] confirm email send failed:', to, r.error)
    }
  } catch (e) {
    console.error('[cohort-compliance] confirm email exception:', e)
  }
}

/**
 * After a cohort daily_entries upsert: if this applied participant now has ≥2 distinct check-in days
 * since enroll (same semantics as the cron), confirm and send the same email. Cron remains the backstop
 * for missed edge cases.
 */
export async function tryImmediateCohortComplianceConfirm(opts: {
  authUserId: string
  profileId: string
  cohortSlug: string
}): Promise<void> {
  const slug = String(opts.cohortSlug || '').trim()
  if (!slug || !opts.profileId || !opts.authUserId) return

  try {
    const { data: cohort, error: cErr } = await supabaseAdmin
      .from('cohorts')
      .select('id, product_name, brand_name')
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
    if (n < 2) return

    const { data: updated, error: uErr } = await supabaseAdmin
      .from('cohort_participants')
      .update({
        status: 'confirmed',
        confirmed_at: new Date().toISOString(),
      } as any)
      .eq('id', part.id)
      .eq('status', 'applied')
      .select('id')
      .maybeSingle()

    if (uErr) {
      console.error('[checkin] cohort compliance confirm update', part.id, uErr)
      return
    }
    if (!updated) return

    const { studyName, productName } = studyAndProductNamesFromCohortRow(
      cohort as { product_name?: string | null; brand_name?: string | null },
    )
    const brandName = (cohort as { brand_name?: string | null }).brand_name
    await sendComplianceConfirmedEmail({
      authUserId: opts.authUserId,
      studyName,
      productName,
      brandName,
    })
  } catch (e) {
    console.error('[checkin] cohort compliance confirm', e)
  }
}
