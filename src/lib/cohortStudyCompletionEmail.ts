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
  /** Absolute URL e.g. https://…/claim?token=… — 3 months Pro reward CTA. */
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

  const appBase = cohortEmailPublicOrigin()
  const dashboardHref = `${appBase}${cohortDashboardStudyPath()}`
  const rewardClaimRaw = String(params.rewardClaimAbsoluteUrl || '').trim()
  const rewardClaimHref = rewardClaimRaw ? rewardClaimRaw : ''
  const subject = `Thank you — your ${productEsc} study is complete`

  const claimBlock =
    rewardClaimHref !== ''
      ? `<p style="margin:28px 0 0;text-align:center;">` +
        `<a href="${escapeHtml(rewardClaimHref)}"${COHORT_EMAIL_CTA_LINK_ATTRS} style="display:inline-block;background:#1e293b;color:#ffffff !important;font-weight:600;text-decoration:none;padding:14px 26px;border-radius:8px;font-size:16px;">Claim your 3 months of BioStackr Pro →</a>` +
        `</p>` +
        `<p style="margin:16px 0 0;text-align:center;font-size:13px;line-height:1.5;color:#6b7280;">` +
        `Use this link once you&apos;re signed in (or sign up first). Your study completion reward — details on the claim page.` +
        `</p>`
      : ''

  const innerHtml =
    `<p style="margin:0 0 16px;">Hi ${first},</p>` +
    `<p style="margin:0 0 16px;">Thank you for completing your <strong>${productEsc}</strong> study with <strong>${partnerBrand}</strong> on <strong>BioStackr</strong>. You do not need to submit any more daily check-ins for this study.</p>` +
    `<p style="margin:0 0 16px;">We&apos;re preparing your personal results summary. When it&apos;s ready, you&apos;ll see it on your study dashboard and we&apos;ll email you.</p>` +
    claimBlock +
    `<p style="margin:28px 0 0;text-align:center;">` +
    `<a href="${escapeHtml(dashboardHref)}"${COHORT_EMAIL_CTA_LINK_ATTRS} style="display:inline-block;background:#C84B2F;color:#ffffff !important;font-weight:600;text-decoration:none;padding:14px 26px;border-radius:8px;font-size:16px;">Open your study dashboard →</a>` +
    `</p>`

  const html = wrapCohortTransactionalEmailHtml({
    appBase,
    innerHtml,
    dashboardHref,
    omitDashboardRow: true,
  })

  return sendEmail({ to, subject, html })
}
