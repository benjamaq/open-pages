import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

function isNowAt(timeHHmm: string, tz: string | null): boolean {
  try {
    const now = new Date()
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: tz || 'UTC',
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
    })
    const parts = fmt.formatToParts(now)
    const hh = parts.find(p => p.type === 'hour')?.value || '00'
    const mm = parts.find(p => p.type === 'minute')?.value || '00'
    const cur = `${hh}:${mm}`
    return cur === timeHHmm
  } catch {
    return false
  }
}

function b64url(input: string) {
  return Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

async function buildEmailHTML({
  firstName,
  yesterday,
  checkinUrl,
  stack,
  rotationNote,
}: {
  firstName: string
  yesterday: { mood?: number; energy?: number; focus?: number } | null
  checkinUrl: string
  stack: string[]
  rotationNote?: string
}) {
  const header = `<div style="font-size:18px;font-weight:600;color:#111">Good morning, ${firstName || 'there'}</div>`
  const y = yesterday
    ? `<div style="margin-top:12px;line-height:1.5;color:#222">
         Yesterday's record:<br/>
         Mood: ${(yesterday as any)?.mood ?? '—'}/5<br/>
         Energy: ${(yesterday as any)?.energy ?? '—'}/5<br/>
         Focus: ${(yesterday as any)?.focus ?? '—'}/5
       </div>`
    : `<div style="margin-top:12px;line-height:1.5;color:#222">Yesterday: No check-in recorded</div>`
  const frame = `<div style="margin-top:16px;color:#222">Let's record today.</div>`
  const buttons = `
    <div style="margin-top:16px;display:flex;gap:12px">
      <a href="${checkinUrl}" style="background:#111;color:#fff;text-decoration:none;padding:10px 14px;border-radius:9999px;font-weight:600;font-size:14px">Check in</a>
    </div>`
  const stackList = stack && stack.length
    ? `<div style="margin-top:16px;color:#222">Today's stack:<br/>- ${stack.slice(0, 5).join('<br/>- ')}${rotationNote ? `<br/><span style="color:#555">(${rotationNote})</span>` : ''}</div>`
    : ''
  const footer = `<div style="margin-top:24px;font-size:12px;color:#555">
      Want to stop daily emails? <a href="${process.env.NEXT_PUBLIC_BASE_URL || ''}/settings">Update preferences</a><br/><br/>— BioStackr
    </div>`
  return `<div style="background:#fff;color:#111;padding:20px;font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;line-height:1.4">
    ${header}${y}${frame}${buttons}${stackList}${footer}
  </div>`
}

export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const dry = url.searchParams.get('dry') === '1'
    // Fetch users with reminders enabled
    const { data: profiles, error } = await supabaseAdmin
      .from('profiles')
      .select('id,user_id,display_name,reminder_enabled,reminder_time,reminder_timezone,last_reminder_sent_at,public,public_modules')
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })

    const sent: string[] = []
    const skipped: Array<{ userId: string; reason: string }> = []
    for (const p of profiles || []) {
      const userId = (p as any).user_id
      const enabled = Boolean((p as any).reminder_enabled ?? (p as any)?.public_modules?.settings?.reminder_enabled)
      if (!userId || !enabled) {
        skipped.push({ userId, reason: 'disabled' }); continue
      }
      const time = String(((p as any).reminder_time ?? (p as any)?.public_modules?.settings?.reminder_time) || '06:00')
      const tz = ((p as any).reminder_timezone ?? (p as any)?.public_modules?.settings?.reminder_timezone) ?? 'UTC'
      if (!isNowAt(time, tz)) { skipped.push({ userId, reason: 'time_mismatch' }); continue }
      // Has already checked in today?
      const today = new Date().toISOString().slice(0,10)
      const { data: todays } = await supabaseAdmin
        .from('daily_entries')
        .select('local_date')
        .eq('user_id', userId)
        .eq('local_date', today)
        .limit(1)
      if (todays && todays.length > 0) { skipped.push({ userId, reason: 'already_checked_in' }); continue }
      // Prevent multiple sends today
      const lastSent = (p as any).last_reminder_sent_at ? new Date((p as any).last_reminder_sent_at) : null
      if (lastSent) {
        const lastKey = new Date(lastSent.toISOString().slice(0,10)).getTime()
        const todayKey = new Date(`${today}T00:00:00Z`).getTime()
        if (lastKey === todayKey) { skipped.push({ userId, reason: 'already_sent_today' }); continue }
      }
      // Fetch yesterday summary
      const yDate = new Date(`${today}T00:00:00Z`); yDate.setDate(yDate.getDate() - 1)
      const yKey = yDate.toISOString().slice(0,10)
      const { data: y } = await supabaseAdmin
        .from('daily_entries')
        .select('mood,energy,focus')
        .eq('user_id', userId)
        .eq('local_date', yKey)
        .maybeSingle()
      // Build a token (userId|day|exp) -> base64url; HMAC would require a shared secret; keep simple time-limited token
      const payload = JSON.stringify({ u: userId, d: today, y: y || null, exp: Date.now() + 24*60*60*1000 })
      const token = b64url(payload)
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''
      const checkinUrl = `${baseUrl || ''}/dashboard?checkin=open`
      const quickUrl = `${baseUrl || ''}/api/checkin/quick-save?token=${token}`
      // Optional stack
      const { data: us } = await supabaseAdmin
        .from('user_supplement')
        .select('name')
        .eq('user_id', userId)
        .or('is_active.eq.true,is_active.is.null')
      const stack = (us || []).map((r: any) => String(r.name || '')).filter(Boolean).slice(0, 5)
      const html = await buildEmailHTML({
        firstName: (p as any).first_name || (p as any).display_name || '',
        yesterday: y || null,
        checkinUrl,
        stack,
      })
      if (!dry) {
        // Fetch email from auth
        const { data: authRow } = await supabaseAdmin.auth.admin.getUserById(userId)
        const to = (authRow?.user?.email as string) || ''
        if (!to) { skipped.push({ userId, reason: 'no_email' }); continue }
        await sendEmail({ to, subject: 'Daily check‑in', html })
        await supabaseAdmin
          .from('profiles')
          .update({ last_reminder_sent_at: new Date().toISOString() } as any)
          .eq('user_id', userId)
      }
      sent.push(userId)
    }
    return NextResponse.json({ ok: true, sent: sent.length, skipped })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'failed' }, { status: 500 })
  }
}



