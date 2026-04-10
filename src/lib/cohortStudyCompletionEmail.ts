import { cohortEmailPublicOrigin } from '@/lib/cohortEmailPublicOrigin'
import { cohortTransactionalDashboardMagicHref } from '@/lib/cohortEmailMagicLink'
import {
  COHORT_EMAIL_CTA_LINK_ATTRS,
  escapeHtml,
  firstNameFromAuthUser,
  wrapCohortTransactionalEmailHtml,
} from '@/lib/cohortTransactionalEmailHtml'
import { sendEmail } from '@/lib/email/resend'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { NEUTRAL_STORE_CREDIT_DISPLAY_TITLE } from '@/lib/cohortStudyLandingRewards'

export function buildCohortStudyCompletionTransactionalEmailHtml(params: {
  firstNameForGreeting: string
  productName: string
  partnerBrandName: string
  /** Absolute URL — production uses Supabase magic link via `cohortTransactionalDashboardMagicHref`. */
  dashboardHref: string
  cohortSlug?: string | null
  storeCreditPartnerReward?: boolean
  storeCreditTitle?: string | null
}): { subject: string; html: string } {
  const product = String(params.productName || 'your study').trim() || 'your study'
  const productEsc = escapeHtml(product)
  const partnerPlain = String(params.partnerBrandName ?? 'Study partner').trim() || 'Study partner'
  const partnerBrand = escapeHtml(partnerPlain)
  const first = escapeHtml(params.firstNameForGreeting)
  const storeCredit = params.storeCreditPartnerReward === true
  const creditTitleEsc = escapeHtml(
    String(params.storeCreditTitle || NEUTRAL_STORE_CREDIT_DISPLAY_TITLE).trim() ||
      NEUTRAL_STORE_CREDIT_DISPLAY_TITLE,
  )

  const appBase = cohortEmailPublicOrigin()
  const dashboardHref = String(params.dashboardHref || '').trim()
  const subject = `Thank you — your ${product} study is complete`

  const partnerRewardLi = storeCredit
    ? `<li style="margin:0;"><strong>${creditTitleEsc}</strong> from <strong>${partnerBrand}</strong> (per study terms)</li>`
    : `<li style="margin:0;">A 3-month supply of <strong>${productEsc}</strong> (via <strong>${partnerBrand}</strong>)</li>`

  const rewardsInfoBlock =
    `<div style="margin:24px 0;padding:16px 18px;border:1px solid #e2e8f0;border-radius:12px;background:#f8fafc;">` +
    `<p style="margin:0 0 8px;font-weight:600;color:#111827;">Your rewards</p>` +
    `<p style="margin:0 0 10px;font-size:15px;line-height:1.5;color:#374151;">You&apos;ve unlocked:</p>` +
    `<ul style="margin:0;padding-left:20px;color:#374151;font-size:15px;line-height:1.55;">` +
    `<li style="margin:0 0 6px;">3 months of BioStackr Pro</li>` +
    partnerRewardLi +
    `</ul>` +
    `<p style="margin:12px 0 0;font-size:14px;line-height:1.5;color:#6b7280;">You&apos;ll receive full details with your results.</p>` +
    `</div>`

  const innerHtml =
    `<p style="margin:0 0 16px;">Hi ${first},</p>` +
    `<p style="margin:0 0 16px;"><strong>Congratulations — your study is complete.</strong> Thank you for taking part in your <strong>${productEsc}</strong> study with <strong>${partnerBrand}</strong> on <strong>BioStackr</strong>.</p>` +
    `<p style="margin:0 0 16px;">You do not need to submit any more daily check-ins for this study.</p>` +
    `<p style="margin:0 0 16px;">We&apos;re preparing your personal results summary. When it&apos;s ready, you&apos;ll see it on your dashboard and we&apos;ll email you.</p>` +
    rewardsInfoBlock +
    `<p style="margin:28px 0 0;text-align:center;">` +
    `<a href="${escapeHtml(dashboardHref)}"${COHORT_EMAIL_CTA_LINK_ATTRS} style="display:inline-block;background:#C84B2F;color:#ffffff !important;font-weight:600;text-decoration:none;padding:14px 26px;border-radius:8px;font-size:16px;">Open your dashboard →</a>` +
    `</p>`

  const html = wrapCohortTransactionalEmailHtml({
    appBase,
    partnerBrandName: partnerPlain,
    cohortSlug: params.cohortSlug,
    innerHtml,
    dashboardHref,
    omitDashboardRow: true,
  })
  return { subject, html }
}

export async function sendCohortStudyCompletionEmail(params: {
  to: string
  authUserId: string
  productName: string
  partnerBrandName?: string | null
  cohortSlug?: string | null
  /** Retained for callers (cron); claim CTA lives in result-ready email and on the result page only. */
  rewardClaimAbsoluteUrl?: string | null
  storeCreditPartnerReward?: boolean
  storeCreditTitle?: string | null
}): Promise<{ success: boolean; id?: string; error?: string }> {
  const to = String(params.to || '').trim()
  if (!to) return { success: false, error: 'missing email' }
  const authUserId = String(params.authUserId || '').trim()
  if (!authUserId) return { success: false, error: 'missing user' }

  const product = String(params.productName || 'your study').trim() || 'your study'
  const partnerPlain = String(params.partnerBrandName ?? 'Study partner').trim() || 'Study partner'

  const { data: auth, error: auErr } = await supabaseAdmin.auth.admin.getUserById(authUserId)
  if (auErr || !auth?.user) {
    console.error('[cohort-study-completion-email] auth', authUserId, auErr?.message)
  }
  const firstNameForGreeting = firstNameFromAuthUser(auth?.user ?? { email: to })

  void params.rewardClaimAbsoluteUrl

  const dashboardHref = await cohortTransactionalDashboardMagicHref(to, 'study-completion')
  const { subject, html } = buildCohortStudyCompletionTransactionalEmailHtml({
    firstNameForGreeting,
    productName: product,
    partnerBrandName: partnerPlain,
    dashboardHref,
    cohortSlug: params.cohortSlug,
    storeCreditPartnerReward: params.storeCreditPartnerReward,
    storeCreditTitle: params.storeCreditTitle,
  })

  return sendEmail({ to, subject, html })
}
