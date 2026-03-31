import { countDistinctDailyEntriesSince } from '@/lib/cohortCheckinCount'
import { sendEmail } from '@/lib/email/resend'
import { supabaseAdmin } from '@/lib/supabase/admin'

function escapeHtml(s: string): string {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function studyAndProductNamesFromCohortRow(
  cRow: { product_name?: string | null; brand_name?: string | null } | null | undefined
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
}): Promise<void> {
  try {
    const { data: auth, error: auErr } = await supabaseAdmin.auth.admin.getUserById(params.authUserId)
    if (auErr || !auth?.user?.email) {
      console.error('[cohort-compliance] confirm email: no auth email', params.authUserId, auErr?.message)
      return
    }
    const to = String(auth.user.email).trim()
    if (!to) return

    const study = escapeHtml(params.studyName)
    const product = escapeHtml(params.productName)

    const html = `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;line-height:1.6;color:#1a1a1a;padding:24px;max-width:560px;">
<p>You completed both check-ins and your spot in the <strong>${study}</strong> study is confirmed.</p>
<p>DoNotAge will be dispatching your <strong>${product}</strong> shortly. While you wait, please do not add any new supplements to your routine — we need a clean baseline.</p>
<p>Your daily check-ins begin the morning after your product arrives. You will receive a reminder each morning at your preferred time. Each check-in takes about 30 seconds.</p>
<p>Thank you for being part of this.</p>
</body></html>`

    const r = await sendEmail({
      to,
      subject: "You're confirmed — your product is on its way",
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

    const { data: part, error: pErr } = await supabaseAdmin
      .from('cohort_participants')
      .select('id, enrolled_at')
      .eq('user_id', opts.profileId)
      .eq('cohort_id', cohort.id)
      .eq('status', 'applied')
      .maybeSingle()
    if (pErr || !part?.id || !part.enrolled_at) return

    const n = await countDistinctDailyEntriesSince(opts.authUserId, String(part.enrolled_at))
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
      cohort as { product_name?: string | null; brand_name?: string | null }
    )
    await sendComplianceConfirmedEmail({
      authUserId: opts.authUserId,
      studyName,
      productName,
    })
  } catch (e) {
    console.error('[checkin] cohort compliance confirm', e)
  }
}
