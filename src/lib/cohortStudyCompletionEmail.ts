import { cohortDashboardStudyPath } from '@/lib/cohortDashboardDeepLink'
import { cohortEmailPublicOrigin } from '@/lib/cohortEmailPublicOrigin'
import {
  COHORT_EMAIL_CTA_LINK_ATTRS,
  escapeHtml,
  firstNameFromAuthUser,
  wrapCohortTransactionalEmailHtml,
} from '@/lib/cohortTransactionalEmailHtml'
import { sendEmail } from '@/lib/email/resend'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function sendCohortStudyCompletionEmail(params: {
  to: string
  authUserId: string
  productName: string
  partnerBrandName?: string | null
  /** Retained for callers (cron); claim CTA lives in result-ready email and on the result page only. */
  rewardClaimAbsoluteUrl?: string | null
}): Promise<{ success: boolean; id?: string; error?: string }> {
  const to = String(params.to || '').trim()
  if (!to) return { success: false, error: 'missing email' }
  const authUserId = String(params.authUserId || '').trim()
  if (!authUserId) return { success: false, error: 'missing user' }

  const product = String(params.productName || 'your study').trim() || 'your study'
  const productEsc = escapeHtml(product)
  const partnerBrand = escapeHtml(String(params.partnerBrandName ?? 'DoNotAge').trim() || 'DoNotAge')

  const { data: auth, error: auErr } = await supabaseAdmin.auth.admin.getUserById(authUserId)
  if (auErr || !auth?.user) {
    console.error('[cohort-study-completion-email] auth', authUserId, auErr?.message)
  }
  const first = escapeHtml(firstNameFromAuthUser(auth?.user ?? { email: to }))

  void params.rewardClaimAbsoluteUrl

  const appBase = cohortEmailPublicOrigin()
  const dashboardHref = `${appBase}${cohortDashboardStudyPath()}`
  const subject = `Thank you — your ${productEsc} study is complete`

  const rewardsInfoBlock =
    `<div style="margin:24px 0;padding:16px 18px;border:1px solid #e2e8f0;border-radius:12px;background:#f8fafc;">` +
    `<p style="margin:0 0 8px;font-weight:600;color:#111827;">Your rewards</p>` +
    `<p style="margin:0 0 10px;font-size:15px;line-height:1.5;color:#374151;">You&apos;ve unlocked:</p>` +
    `<ul style="margin:0;padding-left:20px;color:#374151;font-size:15px;line-height:1.55;">` +
    `<li style="margin:0 0 6px;">3 months of BioStackr Pro</li>` +
    `<li style="margin:0;">A 3-month supply of SureSleep</li>` +
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
    innerHtml,
    dashboardHref,
    omitDashboardRow: true,
  })

  return sendEmail({ to, subject, html })
}
