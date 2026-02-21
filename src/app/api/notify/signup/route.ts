import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email'

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
    console.warn('[SIGNUP-NOTIFY] slack post failed:', e?.message || e)
  }
}

async function lookupRedeemedPromoForUser(userId: string): Promise<{ used: boolean; code: string | null } | null> {
  const uid = String(userId || '').trim()
  if (!uid) return null
  try {
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

/**
 * POST /api/notify/signup
 *
 * Reliable, code-driven signup notification (does not require Supabase Dashboard webhooks).
 * Auth:
 * - Cookie session (server) OR Authorization: Bearer <access_token> (client)
 *
 * Body (optional):
 * - promoCodeEntered: string | null
 * - timestamp: ISO string (client-side time)
 */
export async function POST(request: Request) {
  const startedAt = Date.now()
  const supabase = await createClient()

  let { data: { user } } = await supabase.auth.getUser()
  let authSource: 'cookie' | 'bearer' | 'none' = user ? 'cookie' : 'none'

  if (!user) {
    try {
      const authHeader = request.headers.get('authorization') || request.headers.get('Authorization') || ''
      const token = authHeader.toLowerCase().startsWith('bearer ') ? authHeader.slice(7).trim() : ''
      if (token) {
        const u = await (supabaseAdmin as any).auth.getUser(token)
        if (u?.data?.user) {
          user = u.data.user
          authSource = 'bearer'
        }
      }
    } catch {}
  }

  if (!user) {
    try { console.log('[SIGNUP-NOTIFY] unauthorized', { authSource }) } catch {}
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const to =
    process.env.SIGNUP_NOTIFY_EMAIL_TO ||
    process.env.BENJA_EMAIL_TO ||
    process.env.ADMIN_EMAIL ||
    'ben09@mac.com'

  const body = (await request.json().catch(() => ({}))) as any
  const promoCodeEntered = (() => {
    const raw = String(body?.promoCodeEntered || '').trim().toUpperCase()
    return raw ? raw : null
  })()
  const clientTimestamp = (() => {
    const raw = String(body?.timestamp || '').trim()
    if (!raw) return null
    const ms = Date.parse(raw)
    if (!Number.isFinite(ms)) return null
    return new Date(ms).toISOString()
  })()

  const email = String((user as any)?.email || '')
  const userId = String((user as any)?.id || '')
  const createdAt = clientTimestamp || new Date().toISOString()

  // Promo redemption might happen after signup; we include both "entered" and "redeemed" signals.
  const redeemed = userId ? await lookupRedeemedPromoForUser(userId) : null
  const promoRedeemed = redeemed?.used ? 'yes' : 'no'
  const promoRedeemedCode = redeemed?.code ? String(redeemed.code) : null

  const subject = `New signup: ${email || '(unknown email)'}`
  const text = [
    'New user signup',
    `Email: ${email || '(unknown)'}`,
    `Timestamp: ${createdAt}`,
    promoCodeEntered ? `Promo entered: ${promoCodeEntered}` : 'Promo entered: (none)',
    `Promo redeemed: ${promoRedeemed}${promoRedeemedCode ? ` (${promoRedeemedCode})` : ''}`,
    userId ? `User ID: ${userId}` : '',
    `Auth: ${authSource}`,
  ].filter(Boolean).join('\n')

  const html = `
    <div style="font-family: ui-sans-serif, system-ui; line-height: 1.4">
      <h2 style="margin: 0 0 12px 0">New user signup</h2>
      <p style="margin: 0 0 6px 0"><strong>Email:</strong> ${email || '(unknown)'}</p>
      <p style="margin: 0 0 6px 0"><strong>Timestamp:</strong> ${createdAt}</p>
      <p style="margin: 0 0 6px 0"><strong>Promo entered:</strong> ${promoCodeEntered || '(none)'}</p>
      <p style="margin: 0 0 6px 0"><strong>Promo redeemed:</strong> ${promoRedeemed}${promoRedeemedCode ? ` (${promoRedeemedCode})` : ''}</p>
      ${userId ? `<p style="margin: 0 0 6px 0"><strong>User ID:</strong> ${userId}</p>` : ''}
      <p style="margin: 0 0 6px 0"><strong>Auth:</strong> ${authSource}</p>
    </div>
  `

  const ok = await sendEmail({ to, subject, html, text })
  await postToSlack({
    text: `New signup: ${email || '(unknown)'} • promo entered: ${promoCodeEntered || '(none)'} • redeemed: ${promoRedeemed}${promoRedeemedCode ? ` (${promoRedeemedCode})` : ''}`,
  })

  try {
    console.log('[SIGNUP-NOTIFY] sent', {
      ok,
      to: maskEmail(to),
      email: maskEmail(email),
      userId: userId || null,
      promoCodeEntered,
      promoRedeemed,
      promoRedeemedCode,
      authSource,
      ms: Date.now() - startedAt,
    })
  } catch {}

  return NextResponse.json({ ok: true, notified: ok })
}


