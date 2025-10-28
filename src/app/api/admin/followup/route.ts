import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const DAY2_SUBJECT = 'Day 2: You’re doing great — tips to unlock insights faster'
const NURTURE_SUBJECTS = [
  'You’re part of something really early here',
  'Quick tip to help you get better insights',
]

type FoundMessage = { id: string; to: string; subject?: string; from?: string; created_at?: string }

async function fetchRecentRecipients(limit = 200): Promise<FoundMessage[]> {
  if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY not set')
  const resend = new Resend(process.env.RESEND_API_KEY)

  // Pull recent events and filter locally (Resend SDK provides events.list)
  const events = await resend.events.list({
    limit,
  } as any)

  const out: FoundMessage[] = []
  const arr = (events?.data || []) as any[]
  for (const ev of arr) {
    try {
      const payload = ev?.data || {}
      const subject = payload?.subject as string | undefined
      const from = payload?.from as string | undefined
      const to = (payload?.to as string | undefined) || (payload?.email as string | undefined)
      const id = ev?.id as string
      const created_at = ev?.created_at as string | undefined
      const matchesSubject = !!subject && (subject === DAY2_SUBJECT || NURTURE_SUBJECTS.includes(subject))
      const matchesFrom = !!from && from.includes('notifications@biostackr.io')
      if ((matchesSubject || matchesFrom) && to) {
        out.push({ id, to, subject, from, created_at })
      }
    } catch {}
  }
  return out
}

function uniqueEmails(found: FoundMessage[]): string[] {
  const seen = new Set<string>()
  const emails: string[] = []
  for (const f of found) {
    const e = f.to.toLowerCase()
    if (!seen.has(e)) { seen.add(e); emails.push(f.to) }
  }
  return emails
}

function renderFollowupHtml(name: string): string {
  const first = (name || '').trim() || 'there'
  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111827;">
      <div style="max-width:640px;margin:0 auto;padding:24px;">
        <p>Hey ${first},</p>
        <p>I sent you an email yesterday asking for feedback, but I just realized replies might not have reached me (tech hiccup on my end 🤦‍♂️).</p>
        <p>If you have any thoughts, questions, or feedback about BioStackr, just hit reply to <strong>THIS</strong> email and it'll come straight to me.</p>
        <p>Would love to hear from you.</p>
        <p>- Ben</p>
      </div>
    </div>`
}

function firstNameFromEmail(email: string): string {
  try {
    const local = (email || '').split('@')[0]
    const base = local.split('.')[0].replace(/[0-9_-]/g, '')
    return base ? base.charAt(0).toUpperCase() + base.slice(1) : 'there'
  } catch { return 'there' }
}

export async function GET(req: NextRequest) {
  try {
    const msgs = await fetchRecentRecipients(400)
    const emails = uniqueEmails(msgs)
    return NextResponse.json({ ok: true, count: emails.length, emails, sample: msgs.slice(0, 5) })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Failed to list recipients' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.RESEND_API_KEY) return NextResponse.json({ ok: false, error: 'RESEND_API_KEY not set' }, { status: 500 })
    const resend = new Resend(process.env.RESEND_API_KEY)
    const body = await req.json().catch(() => ({}))
    let recipients: string[] = Array.isArray(body?.recipients) ? body.recipients : []
    if (recipients.length === 0) {
      const msgs = await fetchRecentRecipients(400)
      recipients = uniqueEmails(msgs)
    }
    const from = process.env.RESEND_FROM || 'BioStackr <onboarding@resend.dev>'
    const reply_to = process.env.REPLY_TO_EMAIL || 'ben09@mac.com'
    const subject = 'Quick note from Ben - please reply here!'

    const results: any[] = []
    for (const to of recipients) {
      const name = firstNameFromEmail(to)
      try {
        const res = await resend.emails.send({
          from,
          to,
          subject,
          html: renderFollowupHtml(name),
          ...(reply_to ? { reply_to, headers: { 'Reply-To': reply_to } } : {}),
        })
        results.push({ to, ok: !res.error, id: res.data?.id, error: res.error?.message })
        await new Promise((r) => setTimeout(r, 400))
      } catch (e: any) {
        results.push({ to, ok: false, error: e?.message || 'send failed' })
      }
    }
    return NextResponse.json({ ok: true, sent: results.length, results })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Failed to send follow-up' }, { status: 500 })
  }
}


