import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const name = String(body?.name ?? '').trim()
    const brandProduct = String(body?.brandProduct ?? '').trim()
    const email = String(body?.email ?? '').trim()
    const message = String(body?.message ?? '').trim()

    if (!name || !brandProduct || !email) {
      return NextResponse.json(
        { error: 'Name, brand/product, and email are required' },
        { status: 400 }
      )
    }

    const to = 'ben@biostackr.io'
    const subject = `Cohort enquiry: ${brandProduct}`
    const nameEsc = escapeHtml(name)
    const brandEsc = escapeHtml(brandProduct)
    const emailEsc = escapeHtml(email)
    const messageEsc = escapeHtml(message)
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 640px; margin: 0 auto; padding: 24px;">
        <h2 style="margin: 0 0 16px 0;">New cohort study enquiry</h2>
        <p style="margin: 0 0 8px 0;"><strong>Name:</strong> ${nameEsc}</p>
        <p style="margin: 0 0 8px 0;"><strong>Brand & product:</strong> ${brandEsc}</p>
        <p style="margin: 0 0 8px 0;"><strong>Email:</strong> ${emailEsc}</p>
        ${message ? `<p style="margin: 16px 0 0 0;"><strong>Message:</strong></p><p style="margin: 4px 0 0 0; white-space: pre-wrap;">${messageEsc}</p>` : ''}
      </div>
    `
    const text = [
      `New cohort study enquiry`,
      `Name: ${name}`,
      `Brand & product: ${brandProduct}`,
      `Email: ${email}`,
      message ? `\nMessage:\n${message}` : '',
    ].filter(Boolean).join('\n')

    const ok = await sendEmail({ to, subject, html, text })

    if (!ok) {
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[cohort-enquiry] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
