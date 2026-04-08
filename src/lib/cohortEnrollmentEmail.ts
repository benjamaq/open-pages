import { cohortEmailPublicOrigin } from '@/lib/cohortEmailPublicOrigin'
import { cohortTransactionalCheckinMagicHref } from '@/lib/cohortEmailMagicLink'
import {
  COHORT_EMAIL_CTA_LINK_ATTRS,
  cohortEmailPartnerXBioStackrLine,
  escapeHtml,
  firstNameFromAuthUser,
  wrapCohortTransactionalEmailHtml,
} from '@/lib/cohortTransactionalEmailHtml'
import { sendEmail } from '@/lib/email/resend'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { studyAndProductNamesFromCohortRow } from '@/lib/cohortComplianceConfirmed'
import { isSleepShapedCheckinFields, normalizeCohortCheckinFields } from '@/lib/cohortCheckinFields'
import { cohortUsesStoreCreditPartnerReward, storeCreditTitleFromCohortRow } from '@/lib/cohortStudyLandingRewards'

export function buildCohortEnrollmentTransactionalEmailHtml(params: {
  firstName: string
  productLabel: string
  partnerBrandName: string
  /** Absolute URL — production uses Supabase magic link via `cohortTransactionalCheckinMagicHref`. */
  firstCheckInHref: string
  /** Default true (sleep-style copy). Set false when cohort `checkin_fields` are not sleep-shaped. */
  sleepShapedCohort?: boolean
  /** When true, omit product-supply-as-reward framing; use store credit + Pro copy. */
  storeCreditPartnerReward?: boolean
  /** From `partner_store_credit.title` when store-credit cohort; defaults in sender. */
  storeCreditTitle?: string
}): { subject: string; html: string } {
  const firstEsc = escapeHtml(params.firstName)
  const productLabel = String(params.productLabel || 'your study product').trim() || 'your study product'
  const partnerBrandName = String(params.partnerBrandName || 'Study partner').trim() || 'Study partner'
  const productEsc = escapeHtml(productLabel)
  const brandLineEsc = escapeHtml(cohortEmailPartnerXBioStackrLine(partnerBrandName))

  const appBase = cohortEmailPublicOrigin()
  const checkinHref = String(params.firstCheckInHref || '').trim()
  const subject = "You're in — complete your first check-in"
  const sleepShaped = params.sleepShapedCohort !== false
  const secondCheckinWhen = sleepShaped ? 'tomorrow morning' : 'tomorrow'

  const storeCredit = params.storeCreditPartnerReward === true
  const creditTitleEsc = escapeHtml(
    String(params.storeCreditTitle || '$120 store credit').trim() || '$120 store credit',
  )
  const confirmNextSteps = storeCredit
    ? `Once both check-ins are complete, your place in the study is confirmed. We&apos;ll follow up by email with next steps — including your <strong>${creditTitleEsc}</strong> and 3 months of BioStackr Pro when you complete the study.`
    : `Once both check-ins are complete, your place in the study is confirmed and your <strong>${productEsc}</strong> is shipped to you.`

  const innerHtml =
    `<p style="margin:0 0 16px;">Hi ${firstEsc},</p>` +
    `<p style="margin:0 0 16px;">Welcome to the <strong>${brandLineEsc}</strong> study.</p>` +
    `<p style="margin:0 0 6px;"><strong>To confirm your place:</strong></p>` +
    `<p style="margin:0 0 16px;line-height:1.55;color:#374151;">` +
    `• Complete your first check-in today<br />` +
    `• Complete your second check-in ${secondCheckinWhen}` +
    `</p>` +
    `<p style="margin:0 0 16px;">This gives us your baseline.</p>` +
    `<p style="margin:0 0 22px;">${confirmNextSteps}</p>` +
    `<p style="margin:28px 0 0;text-align:center;">` +
    `<a href="${escapeHtml(checkinHref)}"${COHORT_EMAIL_CTA_LINK_ATTRS} style="display:inline-block;background:#C84B2F;color:#ffffff !important;font-weight:600;text-decoration:none;padding:14px 26px;border-radius:8px;font-size:16px;">Complete your first check-in →</a>` +
    `</p>`

  const html = wrapCohortTransactionalEmailHtml({
    appBase,
    partnerBrandName,
    innerHtml,
    dashboardHref: checkinHref,
    omitDashboardRow: true,
  })
  return { subject, html }
}

/**
 * Immediate enrollment email when a cohort participant joins (profiles POST + cohort, or first cohort attach).
 * Uses shared partner × BioStackr transactional shell: logos/wordmark, rust CTA, footer.
 */
export async function sendCohortEnrollmentEmail(params: {
  to: string
  authUserId?: string | null
  cohortSlug?: string | null
}): Promise<void> {
  const to = String(params.to || '').trim()
  if (!to) return

  let first = 'there'
  const uid = String(params.authUserId || '').trim()
  if (uid) {
    const { data: auth, error: auErr } = await supabaseAdmin.auth.admin.getUserById(uid)
    if (!auErr && auth?.user) {
      first = firstNameFromAuthUser(auth.user)
    }
  }
  let productLabel = 'your study product'
  let partnerBrandName = 'Study partner'
  const slug = String(params.cohortSlug || '').trim()
  let sleepShapedCohort = true
  let storeCreditPartnerReward = false
  let storeCreditTitle = '$120 store credit'
  if (slug) {
    const { data: row } = await supabaseAdmin
      .from('cohorts')
      .select('product_name, brand_name, checkin_fields, study_landing_reward_config')
      .eq('slug', slug)
      .maybeSingle()
    if (row) {
      const { productName } = studyAndProductNamesFromCohortRow(
        row as { product_name?: string | null; brand_name?: string | null },
      )
      if (productName && productName !== 'product') productLabel = productName
      const bn = String((row as { brand_name?: string | null }).brand_name || '').trim()
      if (bn) partnerBrandName = bn
      const fields = normalizeCohortCheckinFields((row as { checkin_fields?: unknown }).checkin_fields)
      sleepShapedCohort = isSleepShapedCheckinFields(fields)
      storeCreditPartnerReward = cohortUsesStoreCreditPartnerReward(
        row as { study_landing_reward_config?: unknown; checkin_fields?: unknown },
      )
      storeCreditTitle = storeCreditTitleFromCohortRow(row as { study_landing_reward_config?: unknown })
    }
  }
  const { href: firstCheckInHref } = await cohortTransactionalCheckinMagicHref(to, 'enrollment')
  const { subject, html } = buildCohortEnrollmentTransactionalEmailHtml({
    firstName: first,
    productLabel,
    partnerBrandName,
    firstCheckInHref,
    sleepShapedCohort,
    storeCreditPartnerReward,
    storeCreditTitle,
  })

  await sendEmail({ to, subject, html })
}
