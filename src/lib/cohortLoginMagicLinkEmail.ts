import { generateCohortEmailMagicLinkUrl } from '@/lib/cohortEmailMagicLink'
import { cohortDashboardStudyPath } from '@/lib/cohortDashboardDeepLink'
import { cohortEmailPublicOrigin } from '@/lib/cohortEmailPublicOrigin'
import {
  COHORT_EMAIL_CTA_LINK_ATTRS,
  COHORT_EMAIL_MAGIC_LINK_HINT,
  escapeHtml,
  wrapCohortTransactionalEmailHtml,
} from '@/lib/cohortTransactionalEmailHtml'
import { resolveAuthUserByEmailForServer } from '@/lib/cohortLoginLinkEligibility'
import { sendEmail } from '@/lib/email/resend'
import { supabaseAdmin } from '@/lib/supabase/admin'

/** Rust CTA + hint line for cohort login magic-link emails (distinct label from generic dashboard CTA). */
export function cohortEmailLoginMagicLinkCtaHtml(loginHref: string): string {
  const href = escapeHtml(loginHref)
  return (
    '<p style="margin:28px 0 0;text-align:center;">' +
    '<a href="' +
    href +
    '"' +
    COHORT_EMAIL_CTA_LINK_ATTRS +
    ' style="display:inline-block;background:#C84B2F;color:#ffffff !important;font-weight:600;text-decoration:none;padding:14px 26px;border-radius:8px;font-size:16px;">Log in to your dashboard →</a>' +
    '</p>' +
    '<p style="margin:12px 0 0;text-align:center;font-size:12px;line-height:1.45;color:#6b7280;">' +
    escapeHtml(COHORT_EMAIL_MAGIC_LINK_HINT) +
    '</p>'
  )
}

export function buildCohortParticipantLoginMagicLinkTransactionalEmailHtml(params: {
  partnerBrandName: string
  magicHref: string
  emailSubject?: string | null
}): { subject: string; html: string } {
  const appBase = cohortEmailPublicOrigin()
  const partnerBrandName = String(params.partnerBrandName || '').trim() || 'Study partner'
  const href = String(params.magicHref || '').trim()
  const subject =
    String(params.emailSubject || '').trim() ||
    `Your login link — ${partnerBrandName} study on BioStackr`

  const innerHtml =
    '<p style="margin:0 0 16px;">Hi,</p>' +
    '<p style="margin:0 0 16px;">Here is a fresh link to your study dashboard. If an older email link expired or opened in a preview window, use this one instead.</p>' +
    cohortEmailLoginMagicLinkCtaHtml(href)

  const html = wrapCohortTransactionalEmailHtml({
    appBase,
    partnerBrandName,
    innerHtml,
    dashboardHref: href,
    omitDashboardRow: true,
  })
  return { subject, html }
}

export async function sendCohortParticipantLoginMagicLinkEmail(
  to: string,
  magicHref: string,
  opts?: { partnerBrandName?: string | null; emailSubject?: string | null },
): Promise<{ success: boolean; error?: string }> {
  const safe = String(to || '').trim()
  if (!safe) return { success: false, error: 'no email' }
  const href = String(magicHref || '').trim()
  if (!href) return { success: false, error: 'no link' }

  const partnerBrandName = String(opts?.partnerBrandName || '').trim() || 'Study partner'
  const { subject, html } = buildCohortParticipantLoginMagicLinkTransactionalEmailHtml({
    partnerBrandName,
    magicHref: href,
    emailSubject: opts?.emailSubject,
  })

  return sendEmail({ to: safe, subject, html })
}

/**
 * Resolves a new magic link for a cohort participant and sends the transactional email.
 * `authCanonicalEmail` must match auth.users.email (case) for generateLink.
 * Returns null on success; an error message only for unexpected send failures.
 */
export async function sendFreshCohortLoginMagicLinkForParticipantEmail(
  authCanonicalEmail: string,
): Promise<string | null> {
  const em = String(authCanonicalEmail || '').trim()
  if (!em) return 'Invalid email'

  const magic = await generateCohortEmailMagicLinkUrl(em, cohortDashboardStudyPath())
  if (!magic) {
    console.error('[cohortLoginMagicLink] generateCohortEmailMagicLinkUrl failed', {
      domain: em.includes('@') ? em.split('@')[1] : '(none)',
    })
    return 'Could not create login link'
  }

  let partnerBrandName = 'Study partner'
  try {
    const resolved = await resolveAuthUserByEmailForServer(em.toLowerCase(), supabaseAdmin)
    if (resolved?.id) {
      const { data: prof } = await supabaseAdmin
        .from('profiles')
        .select('cohort_id')
        .eq('user_id', resolved.id)
        .maybeSingle()
      const slug = String((prof as { cohort_id?: string | null })?.cohort_id || '').trim().toLowerCase()
      if (slug) {
        const { data: c } = await supabaseAdmin.from('cohorts').select('brand_name').eq('slug', slug).maybeSingle()
        const bn = String((c as { brand_name?: string | null })?.brand_name || '').trim()
        if (bn) partnerBrandName = bn
      }
    }
  } catch {
    /* keep default */
  }

  const r = await sendCohortParticipantLoginMagicLinkEmail(em, magic, { partnerBrandName })
  if (!r.success) {
    console.error('[cohortLoginMagicLink] sendEmail', r.error)
    return r.error || 'Send failed'
  }
  return null
}
