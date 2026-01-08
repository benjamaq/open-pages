import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json({ ok: false, deprecated: true, message: 'Digest endpoint deprecated. Cron removed.' }, { status: 410 })
}

export async function GET() {
  return NextResponse.json({ ok: false, deprecated: true, message: 'Digest endpoint deprecated. Cron removed.' }, { status: 410 })
}
