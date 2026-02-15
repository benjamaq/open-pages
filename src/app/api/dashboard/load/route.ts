import { NextResponse } from 'next/server'

// Reuse existing route logic (no SQL duplication) while collapsing the browser to one request.
import { GET as meGET } from '@/app/api/me/route'
import { GET as billingInfoGET } from '@/app/api/billing/info/route'
import { GET as paymentsStatusGET } from '@/app/api/payments/status/route'
import { GET as supplementsGET } from '@/app/api/supplements/route'
import { GET as progressLoopGET } from '@/app/api/progress/loop/route'
import { GET as hasDailyGET } from '@/app/api/data/has-daily/route'
import { GET as dailySkipGET } from '@/app/api/suggestions/dailySkip/route'
import { GET as effectSummaryGET } from '@/app/api/effect/summary/route'
import { GET as wearableStatusGET } from '@/app/api/user/wearable-status/route'
import { GET as settingsGET } from '@/app/api/settings/route'
import { GET as elliContextGET } from '@/app/api/elli/context/route'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

type CallResult = { ok: boolean; status: number; ms: number; data: any | null; error?: string }

async function callJson(name: string, fn: () => Promise<Response>): Promise<CallResult> {
  const t0 = Date.now()
  try {
    const res = await fn()
    const data = await res.json().catch(() => null)
    return { ok: res.ok, status: res.status, ms: Date.now() - t0, data }
  } catch (e: any) {
    return { ok: false, status: 0, ms: Date.now() - t0, data: null, error: e?.message || String(e || name) }
  }
}

export async function GET(request: Request) {
  const origin = new URL(request.url).origin

  // Ensure any query-param dependent routes get the right URL (and keep the rest identical).
  const progressReq = new Request(`${origin}/api/progress/loop`, { headers: request.headers, cache: 'no-store' })
  const wearableReq = new Request(`${origin}/api/user/wearable-status?since=all`, { headers: request.headers, cache: 'no-store' })
  const billingReq = new Request(`${origin}/api/billing/info`, { headers: request.headers, cache: 'no-store' })
  const paymentsReq = new Request(`${origin}/api/payments/status`, { headers: request.headers, cache: 'no-store' })

  const t0 = Date.now()
  const [
    me,
    billingInfo,
    paymentsStatus,
    supplements,
    progressLoop,
    hasDaily,
    dailySkip,
    effectSummary,
    wearableStatus,
    settings,
    elliContext,
  ] = await Promise.all([
    callJson('me', () => meGET(request)),
    // Call via fetch with forwarded headers to ensure auth cookies are present in Next request context.
    callJson('billingInfo', () => fetch(billingReq) as any),
    callJson('paymentsStatus', () => fetch(paymentsReq) as any),
    callJson('supplements', () => supplementsGET() as any),
    callJson('progressLoop', () => progressLoopGET(progressReq) as any),
    callJson('hasDaily', () => hasDailyGET() as any),
    callJson('dailySkip', () => dailySkipGET() as any),
    callJson('effectSummary', () => effectSummaryGET() as any),
    callJson('wearableStatus', () => wearableStatusGET(wearableReq) as any),
    callJson('settings', () => settingsGET() as any),
    callJson('elliContext', () => elliContextGET() as any),
  ])

  // If auth is missing, surface a unified unauthorized (the dashboard page will redirect anyway).
  if (me.status === 401 || progressLoop.status === 401) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json(
    {
      me: me.data,
      billingInfo: billingInfo.data,
      paymentsStatus: paymentsStatus.data,
      supplements: supplements.data,
      progressLoop: progressLoop.data,
      hasDaily: hasDaily.data,
      dailySkip: dailySkip.data,
      effectSummary: effectSummary.data,
      wearableStatus: wearableStatus.data,
      settings: settings.data,
      elliContext: elliContext.data,
      _meta: {
        totalMs: Date.now() - t0,
        calls: {
          me,
          billingInfo,
          paymentsStatus,
          supplements,
          progressLoop,
          hasDaily,
          dailySkip,
          effectSummary,
          wearableStatus,
          settings,
          elliContext,
        },
      },
    },
    { headers: { 'Cache-Control': 'no-store' } }
  )
}


