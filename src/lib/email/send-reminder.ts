import { supabaseAdmin } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email/resend'
import { renderDailyReminderEmail } from './templates/daily-reminder'

type Options = {
  emailOverride?: string
  dry?: boolean
  preview?: boolean
}

export async function sendReminderToUser(userId: string, opts?: Options) {
  const dry = Boolean(opts?.dry)
  const preview = Boolean(opts?.preview)
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''
  // Profile (safe columns only)
  const { data: prof } = await supabaseAdmin
    .from('profiles')
    .select('display_name')
    .eq('user_id', userId)
    .maybeSingle()
  // Auth user for email + metadata fallback
  const { data: authRow } = await supabaseAdmin.auth.admin.getUserById(userId)
  const userEmail = (authRow?.user?.email as string) || ''
  const recipientEmail = opts?.emailOverride || userEmail
  if (!recipientEmail) return { ok: false, reason: 'no_email' as const }
  // First name fallback: display_name -> metadata.first_name/name -> email prefix
  let firstName = String((prof as any)?.display_name || '').trim()
  if (!firstName) {
    const meta = (authRow?.user?.user_metadata as any) || {}
    firstName =
      String(meta.first_name || meta.name || '')
        .split(' ')
        .filter(Boolean)[0] || ''
  }
  if (!firstName && userEmail) {
    firstName = String(userEmail.split('@')[0] || '').replace(/[^a-zA-Z0-9._-]/g, '')
  }
  // Supplement count (active or legacy null)
  const { data: supps } = await supabaseAdmin
    .from('user_supplement')
    .select('id,is_active')
    .eq('user_id', userId)
    .or('is_active.eq.true,is_active.is.null')
  const supplementCount = (supps || []).length
  // Approximate progress (weighted by monthly_cost_usd, 14-day window fallback). Next step: replace with dashboard source.
  let progressPercent = 0
  try {
    const { data: rows } = await supabaseAdmin
      .from('user_supplement')
      .select('created_at,monthly_cost_usd,is_active')
      .eq('user_id', userId)
      .or('is_active.eq.true,is_active.is.null')
    const todayTs = Date.now()
    const percs = (rows || []).map((r: any) => {
      const started = new Date(String(r?.created_at || new Date().toISOString())).getTime()
      const days = Math.max(0, Math.floor((todayTs - started) / (24 * 60 * 60 * 1000)))
      const pct = Math.max(0, Math.min(100, Math.round((days / 14) * 100)))
      const weight = Number(r?.monthly_cost_usd || 0) > 0 ? Number(r?.monthly_cost_usd || 0) : 1
      return { pct, weight }
    })
    const totalW = percs.reduce((s, x) => s + x.weight, 0)
    progressPercent = totalW > 0 ? Math.round(percs.reduce((s, x) => s + (x.pct * x.weight), 0) / totalW) : 0
  } catch {}
  const html = renderDailyReminderEmail({
    firstName: firstName || 'there',
    supplementCount,
    progressPercent,
    checkinUrl: `${baseUrl}/dashboard?checkin=open`,
  })
  const subject = `${progressPercent}% complete`
  if (dry || preview) {
    return { ok: true, dry: true, subject, html, supplementCount, progressPercent }
  }
  try {
    console.log('[send-reminder] Payload preview:', {
      to: recipientEmail,
      subject,
      html: (html || '').substring(0, 500)
    })
  } catch {}
  const result = await sendEmail({ to: recipientEmail, subject, html })
  if (!result.success) return { ok: false, error: result.error }
  return { ok: true, id: result.id }
}


