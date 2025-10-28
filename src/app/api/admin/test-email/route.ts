import { NextRequest, NextResponse } from 'next/server'
import { sendDay2TipsEmail } from '@/lib/email/resend'

export async function POST(_req: NextRequest) {
  return NextResponse.json({ ok: false, error: 'Nurture emails disabled' }, { status: 410 })
}

export async function GET(_req: NextRequest) {
  return NextResponse.json({ ok: false, error: 'Nurture emails disabled' }, { status: 410 })
}


