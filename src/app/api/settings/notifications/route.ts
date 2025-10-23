import { NextRequest, NextResponse } from 'next/server'
import { getNotificationPreferences, updateNotificationPreferences } from '@/lib/actions/notifications'

export async function GET() {
  try {
    console.log('[API] GET /api/settings/notifications')
    const prefs = await getNotificationPreferences()
    console.log('[API] GET result', prefs)
    return NextResponse.json(prefs ?? {}, { status: 200 })
  } catch (e: any) {
    console.error('[API] GET error', e)
    return NextResponse.json({ error: e?.message || 'Failed to fetch preferences' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    console.log('[API] POST /api/settings/notifications body', body)
    await updateNotificationPreferences(body)
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('[API] POST error', e)
    return NextResponse.json({ error: e?.message || 'Failed to update preferences' }, { status: 500 })
  }
}
