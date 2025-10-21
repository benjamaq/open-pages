import { NextRequest, NextResponse } from 'next/server'
import { getNotificationPreferences, updateNotificationPreferences } from '@/lib/actions/notifications'

export async function GET() {
  try {
    const prefs = await getNotificationPreferences()
    return NextResponse.json(prefs ?? {}, { status: 200 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to fetch preferences' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    await updateNotificationPreferences(body)
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to update preferences' }, { status: 500 })
  }
}
