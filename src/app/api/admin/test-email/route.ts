import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email/resend'

export async function POST(_req: NextRequest) {
  return NextResponse.json({ ok: false, error: 'Use GET with ?email=...' }, { status: 400 })
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const email = url.searchParams.get('email') || ''
    const preview = url.searchParams.get('preview') === '1'
    if (!email) return NextResponse.json({ ok: false, error: 'email required' }, { status: 400 })

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>BioStackr Test Email</title>
        </head>
        <body style="margin:0;padding:24px;font-family:system-ui,-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;line-height:1.5;color:#1a1a1a;background:#f8f8f6">
          <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #eee;padding:24px">
            <h1 style="margin:0 0 12px 0;font-size:18px">BioStackr email test</h1>
            <p style="margin:0 0 6px 0">If you received this, Resend is configured and sending works.</p>
            <p style="margin:0;color:#666;font-size:13px">To: ${email}</p>
          </div>
        </body>
      </html>
    `

    if (preview) {
      return NextResponse.json({
        ok: true,
        subject: 'BioStackr test email',
        html,
        htmlLength: html.length
      })
    }

    const result = await sendEmail({
      to: email,
      subject: 'BioStackr test email',
      html
    })
    try {
      console.log('[admin-test-email] Payload preview:', {
        to: email,
        subject: 'BioStackr test email',
        html: html.substring(0, 500)
      })
    } catch {}

    if (!result.success) {
      return NextResponse.json({ ok: false, error: result.error || 'send failed' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, id: result.id })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'failed' }, { status: 500 })
  }
}

