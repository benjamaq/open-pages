import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

function resolveFromAddress(): string {
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
    const url = new URL(req.url)
    const email = url.searchParams.get('email') || ''
    const send = url.searchParams.get('send') === '1'
    const from = resolveFromAddress()
    const replyTo = resolveReplyTo()
    const hasApiKey = !!process.env.RESEND_API_KEY
    const domain = process.env.RESEND_DOMAIN || ''

    let sendResult: any = null
    let sendError: string | undefined

    if (send) {
      if (!email) return NextResponse.json({ ok: false, error: 'Missing email param' }, { status: 400 })
      if (!hasApiKey) return NextResponse.json({ ok: false, error: 'RESEND_API_KEY not set' }, { status: 500 })
      try {
        const resend = new Resend(process.env.RESEND_API_KEY!)
        const result = await resend.emails.send({
          from,
          to: email,
          subject: 'BioStackr debug email',
          html: `<div style="font-family:Arial,sans-serif">This is a debug email.<br/>From: ${from}<br/>Reply-To: ${replyTo || '(none)'}<br/>Domain: ${domain}</div>`,
          ...(replyTo ? { reply_to: replyTo, headers: { 'Reply-To': replyTo } } : {}),
        })
        sendResult = result
        if (result.error) sendError = result.error.message
      } catch (e: any) {
        sendError = e?.message || 'Unknown send error'
      }
    }

    return NextResponse.json({
      ok: true,
      resolved: { from, replyTo, domain, hasApiKey },
      sendAttempted: send,
      sendResult,
      sendError,
    })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Unknown error' }, { status: 500 })
  }
}


