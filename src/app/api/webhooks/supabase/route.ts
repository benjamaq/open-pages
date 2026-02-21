import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * Supabase Database Webhook receiver.
 *
 * Intended usage:
 * - Supabase Dashboard → Database → Webhooks → New webhook
 * - Table: auth.users, Event: INSERT
 * - Send to: https://<your-app-domain>/api/webhooks/supabase
 * - Add a header: x-webhook-secret: <SUPABASE_DB_WEBHOOK_SECRET>
 *
 * Optional (for promo usage notifications):
 * - Table: public.promo_redemptions, Event: INSERT
 *
 * Env vars:
 * - SUPABASE_DB_WEBHOOK_SECRET (required)
 * - SIGNUP_NOTIFY_EMAIL_TO (optional; defaults to BENJA_EMAIL_TO or ADMIN_EMAIL)
 * - BENJA_EMAIL_TO / ADMIN_EMAIL (optional fallbacks)
 * - SIGNUP_NOTIFY_SLACK_WEBHOOK_URL (optional)
 */

type WebhookPayload = {
  type?: string
  event?: string
  schema?: string
  table?: string
  record?: any
  old_record?: any
  // Some webhook variants use "new" instead of "record"
  new?: any
  old?: any
}

function maskEmail(email: string): string {
  const e = String(email || '').trim()
  const [u, d] = e.split('@')
  if (!u || !d) return e
  if (u.length <= 2) return `${u[0] || '*'}*@${d}`
  return `${u.slice(0, 2)}***@${d}`
}

async function postToSlack(args: { text: string; blocks?: any[] }) {
  const url = process.env.SIGNUP_NOTIFY_SLACK_WEBHOOK_URL
  if (!url) return
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: args.text,
        blocks: args.blocks,
      }),
    })
  } catch (e: any) {
    console.warn('[supabase-webhook] slack post failed:', e?.message || e)
  }
}

async function lookupPromoForUser(userId: string): Promise<{ used: boolean; code: string | null } | null> {
  const uid = String(userId || '').trim()
  if (!uid) return null
  try {
    // promo_redemptions has promo_code_id; promo_codes has code
    const { data: red, error: redErr } = await supabaseAdmin
      .from('promo_redemptions')
      .select('promo_code_id, redeemed_at')
      .eq('user_id', uid)
      .order('redeemed_at', { ascending: false })
      .limit(1)

    if (redErr) return { used: false, code: null }
    const promoCodeId = (red && red[0] ? String((red[0] as any).promo_code_id || '') : '') || ''
    if (!promoCodeId) return { used: false, code: null }

    const { data: promo } = await supabaseAdmin
      .from('promo_codes')
      .select('code')
      .eq('id', promoCodeId)
      .maybeSingle()

    const code = promo && (promo as any)?.code ? String((promo as any).code) : null
    return { used: true, code: code || null }
  } catch {
    return { used: false, code: null }
  }
}

export async function POST(req: NextRequest) {
  const expected = process.env.SUPABASE_DB_WEBHOOK_SECRET
  const provided = req.headers.get('x-webhook-secret') || ''
  if (!expected || provided !== expected) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const payload = (await req.json().catch(() => null)) as WebhookPayload | null
  if (!payload) return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 })

  const schema = String(payload.schema || '')
  const table = String(payload.table || '')
  const event = String(payload.type || payload.event || '')
  const record = (payload.record ?? payload.new ?? null) as any

  const to =
    process.env.SIGNUP_NOTIFY_EMAIL_TO ||
    process.env.BENJA_EMAIL_TO ||
    process.env.ADMIN_EMAIL ||
    ''

  if (!to) {
    console.warn('[supabase-webhook] SIGNUP_NOTIFY_EMAIL_TO not set; skipping notify')
    return NextResponse.json({ ok: true, skipped: true })
  }

  // Handle signup (auth.users INSERT)
  if ((schema === 'auth' && table === 'users' && event.toUpperCase().includes('INSERT')) || (table === 'auth.users')) {
    const email = String(record?.email || '')
    const userId = String(record?.id || '')
    const createdAt = String(record?.created_at || new Date().toISOString())
    const promo = userId ? await lookupPromoForUser(userId) : null
    const promoUsed = promo?.used ? 'yes' : 'no'
    const promoCode = promo?.code ? String(promo.code) : null

    const subject = `New signup: ${email || '(unknown email)'}`
    const text = [
      'New user signup',
      `Email: ${email || '(unknown)'}`,
      `Timestamp: ${createdAt}`,
      `Promo used: ${promoUsed}${promoCode ? ` (${promoCode})` : ''}`,
      userId ? `User ID: ${userId}` : '',
    ].filter(Boolean).join('\n')

    const html = `
      <div style="font-family: ui-sans-serif, system-ui; line-height: 1.4">
        <h2 style="margin: 0 0 12px 0">New user signup</h2>
        <p style="margin: 0 0 6px 0"><strong>Email:</strong> ${email || '(unknown)'}</p>
        <p style="margin: 0 0 6px 0"><strong>Timestamp:</strong> ${createdAt}</p>
        <p style="margin: 0 0 6px 0"><strong>Promo used:</strong> ${promoUsed}${promoCode ? ` (${promoCode})` : ''}</p>
        ${userId ? `<p style="margin: 0 0 6px 0"><strong>User ID:</strong> ${userId}</p>` : ''}
      </div>
    `

    const ok = await sendEmail({ to, subject, html, text })
    await postToSlack({
      text: `New signup: ${email || '(unknown)'} • promo: ${promoUsed}${promoCode ? ` (${promoCode})` : ''}`,
      blocks: [
        {
          type: 'section',
          text: { type: 'mrkdwn', text: `*New signup*\n• *Email:* ${email || '(unknown)'}\n• *Promo used:* ${promoUsed}${promoCode ? ` (${promoCode})` : ''}\n• *Timestamp:* ${createdAt}` },
        },
        userId ? { type: 'context', elements: [{ type: 'mrkdwn', text: `user_id: \`${userId}\`` }] } : null,
      ].filter(Boolean) as any[],
    })

    try {
      console.log('[supabase-webhook] signup notified', { email: maskEmail(email), ok, userId: userId || null })
    } catch {}
    return NextResponse.json({ ok: true, notified: ok })
  }

  // Handle promo redemption insert (optional): sends a separate note that a code was redeemed.
  if (schema === 'public' && table === 'promo_redemptions' && event.toUpperCase().includes('INSERT')) {
    const userId = String(record?.user_id || '')
    const redeemedAt = String(record?.redeemed_at || new Date().toISOString())
    const promoCodeId = String(record?.promo_code_id || '')
    let code: string | null = null
    try {
      const { data: promo } = await supabaseAdmin
        .from('promo_codes')
        .select('code')
        .eq('id', promoCodeId)
        .maybeSingle()
      code = promo && (promo as any)?.code ? String((promo as any).code) : null
    } catch {}

    const subject = `Promo redeemed${code ? `: ${code}` : ''}`
    const text = [
      'Promo code redeemed',
      code ? `Code: ${code}` : `promo_code_id: ${promoCodeId || '(unknown)'}`,
      userId ? `User ID: ${userId}` : '',
      `Timestamp: ${redeemedAt}`,
    ].filter(Boolean).join('\n')
    const html = `
      <div style="font-family: ui-sans-serif, system-ui; line-height: 1.4">
        <h2 style="margin: 0 0 12px 0">Promo code redeemed</h2>
        <p style="margin: 0 0 6px 0"><strong>Code:</strong> ${code || '(unknown)'}</p>
        <p style="margin: 0 0 6px 0"><strong>User ID:</strong> ${userId || '(unknown)'}</p>
        <p style="margin: 0 0 6px 0"><strong>Timestamp:</strong> ${redeemedAt}</p>
      </div>
    `
    const ok = await sendEmail({ to, subject, html, text })
    await postToSlack({ text: `Promo redeemed${code ? ` ${code}` : ''} • user ${userId || '(unknown)'}`, blocks: [] })
    return NextResponse.json({ ok: true, notified: ok })
  }

  // Unknown/unsupported event: ack to avoid retries.
  try {
    console.log('[supabase-webhook] ignored event', { schema, table, event })
  } catch {}
  return NextResponse.json({ ok: true, ignored: true })
}


