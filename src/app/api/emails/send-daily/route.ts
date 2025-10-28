import { NextRequest, NextResponse } from 'next/server'

// Legacy daily sender disabled in favor of /api/cron/send-daily-emails
export async function POST(_req: NextRequest) {
  return NextResponse.json({ ok: false, error: 'Legacy daily sender disabled' }, { status: 410 })
}


