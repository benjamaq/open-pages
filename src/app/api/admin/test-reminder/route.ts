import { NextRequest, NextResponse } from 'next/server'
import { sendReminderToUser } from '@/lib/email/send-reminder'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const userId = url.searchParams.get('userId') || ''
    const email = url.searchParams.get('email') || ''
    const dry = url.searchParams.get('dry') === '1'
    const preview = url.searchParams.get('preview') === '1'
    if (!userId) return NextResponse.json({ ok: false, error: 'userId required' }, { status: 400 })
    const res = await sendReminderToUser(userId, { emailOverride: email || undefined, dry: dry || preview, preview })
    return NextResponse.json(res)
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'failed' }, { status: 500 })
  }
}


