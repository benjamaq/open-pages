import { resolveCohortDashboardEmailHref } from '@/lib/cohortEmailMagicLink'
import {
  COHORT_EMAIL_MAGIC_LINK_HINT,
  escapeHtml,
  firstNameFromAuthUser,
  wrapCohortTransactionalEmailHtml,
} from '@/lib/cohortTransactionalEmailHtml'
import { sendEmail } from '@/lib/email/resend'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function sendCohortStudyStartEmail(params: {
  to: string
  authUserId: string
  productName: string
}): Promise<{ success: boolean; id?: string; error?: string }> {
  const to = String(params.to || '').trim()
  if (!to) return { success: false, error: 'missing email' }
  const authUserId = String(params.authUserId || '').trim()
  if (!authUserId) return { success: false, error: 'missing user' }

  const product = String(params.productName || 'SureSleep').trim() || 'SureSleep'
  const productEsc = escapeHtml(product)
  const subject = `Your 21-day ${product} study begins today`

  const { data: auth, error: auErr } = await supabaseAdmin.auth.admin.getUserById(authUserId)
  if (auErr || !auth?.user) {
    console.error('[cohort-study-start-email] auth', authUserId, auErr?.message)
  }
  const first = escapeHtml(firstNameFromAuthUser(auth?.user ?? { email: to }))

  const appBase = (process.env.NEXT_PUBLIC_APP_URL || 'https://www.biostackr.com').replace(/\/$/, '')
  const dashboardHref = await resolveCohortDashboardEmailHref(to)

  const innerHtml =
    `<p style="margin:0 0 16px;">Hi ${first},</p>` +
    `<p style="margin:0 0 16px;">Your <strong>${productEsc}</strong> study officially starts today. Here's everything you need to know.</p>` +
    `<p style="margin:0 0 6px;"><strong>Taking ${productEsc}</strong></p>` +
    `<p style="margin:0 0 16px;">Mix one scoop with water and take it 45–60 minutes before bed tonight. Take it consistently every evening — this is what gives the study its signal.</p>` +
    `<p style="margin:0 0 16px;">If you miss a night, just pick up again the next evening. Don't double up.</p>` +
    `<p style="margin:0 0 6px;"><strong>Your morning check-in</strong></p>` +
    `<p style="margin:0 0 16px;">Each morning you'll get a reminder to complete a short check-in — it takes about 30 seconds. Four simple questions about how you slept. Complete it before midday while the night is still fresh.</p>` +
    `<p style="margin:0 0 6px;"><strong>If life gets in the way</strong></p>` +
    `<p style="margin:0 0 16px;">Some nights won't be typical — a late night out, illness, travel, a big workout. On those mornings, complete your check-in as normal but use the "Anything unusual today?" tags to note what happened. We exclude those days from the analysis so your results stay clean. Keep taking ${productEsc} unless you're unwell.</p>` +
    `<p style="margin:0 0 6px;"><strong>If you're unwell</strong></p>` +
    `<p style="margin:0 0 16px;">Pause ${productEsc} until you're feeling better. Tag those days. Pick back up when you're recovered — your 21 days continue from where you left off.</p>` +
    `<p style="margin:0 0 6px;"><strong>Your completion reward</strong></p>` +
    `<p style="margin:0 0 16px;">Participants who complete the full 21-day study receive a 3-month supply of ${productEsc} plus three months of BioStackr Pro — shipped and activated automatically on completion.</p>` +
    `<p style="margin:0 0 16px;">You're doing something most people never do — actually measuring whether what they're taking is working.</p>` +
    `<p style="margin:0 0 20px;">Let's see what ${productEsc} does for you.</p>` +
    `<p style="margin:28px 0 0;text-align:center;">` +
    `<a href="${escapeHtml(dashboardHref)}" style="display:inline-block;background:#C84B2F;color:#ffffff !important;font-weight:600;text-decoration:none;padding:14px 26px;border-radius:8px;font-size:16px;">Go to your dashboard →</a>` +
    `</p>` +
    `<p style="margin:12px 0 0;text-align:center;font-size:12px;line-height:1.45;color:#6b7280;">` +
    escapeHtml(COHORT_EMAIL_MAGIC_LINK_HINT) +
    `</p>`

  const html = wrapCohortTransactionalEmailHtml({
    appBase,
    innerHtml,
    dashboardHref,
    omitDashboardRow: true,
  })

  return sendEmail({ to, subject, html })
}
