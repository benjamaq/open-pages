/**
 * @deprecated Legacy daily reminder sender removed (2026-04). Do not schedule this path.
 * Production source of truth: `GET|POST /api/cron/send-daily-emails` (see `vercel.json`).
 * Duplicate cron + different dedupe (`daily_email_sends` vs `email_sends`) caused operational risk.
 */
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const BODY = {
  ok: false,
  error: 'deprecated',
  message:
    'This endpoint is retired. Use /api/cron/send-daily-emails (Vercel cron + CRON_SECRET / x-vercel-cron).',
  replacement: '/api/cron/send-daily-emails',
} as const

export async function GET() {
  return NextResponse.json(BODY, { status: 410 })
}

export async function POST() {
  return NextResponse.json(BODY, { status: 410 })
}
