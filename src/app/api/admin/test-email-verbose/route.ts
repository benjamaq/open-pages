import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

function resolveFrom(): string {
  const domain = process.env.RESEND_DOMAIN
  const configured = process.env.RESEND_FROM
  if (configured) return configured
  if (domain) return `BioStackr <noreply@${domain}>`
  return 'BioStackr <reminders@biostackr.io>'
}

function resolveReplyTo(): string | undefined {
  return process.env.REPLY_TO_EMAIL || process.env.SUPPORT_EMAIL
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const email = searchParams.get('email')
    const name = searchParams.get('name') || 'there'
    if (!email) return NextResponse.json({ ok: false, error: 'Missing email' }, { status: 400 })

    if (!process.env.RESEND_API_KEY) return NextResponse.json({ ok: false, error: 'RESEND_API_KEY not set' }, { status: 500 })

    const resend = new Resend(process.env.RESEND_API_KEY!)
    const from = resolveFrom()
    const reply_to = resolveReplyTo()

    const html = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111">
        <h2 style="margin:0 0 6px 0;">Hi ${name} 👋</h2>
        <p style="margin:0 0 12px 0;">This is a verbose test email to verify Reply-To handling.</p>
        <p style="margin:0 0 6px 0;">From: <strong>${from}</strong></p>
        <p style="margin:0 0 6px 0;">Reply-To: <strong>${reply_to || '(none set)'}</strong></p>
      </div>
    `

    const payload: any = {
      from,
      to: email,
      subject: 'BioStackr Reply-To verification',
      html,
      ...(reply_to ? { reply_to } : {}),
      ...(reply_to ? { headers: { 'Reply-To': reply_to } } : {}),
    }

    let result: any
    try {
      result = await resend.emails.send(payload)
    } catch (e: any) {
      return NextResponse.json({ ok: false, payload, error: e?.message || 'Send failed' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, payload, result })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Unknown error' }, { status: 500 })
  }
}


