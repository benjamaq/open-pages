import { NextResponse } from 'next/server'
import { getNotificationPreferences, updateNotificationPreferences } from '@/src/lib/actions/notifications'

export async function GET() {
  try {
    const prefs = await getNotificationPreferences()
    return NextResponse.json(prefs || {}, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to load preferences' }, { status: 401 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const update: any = {}
    if (typeof body.daily_reminder_enabled === 'boolean') update.daily_reminder_enabled = body.daily_reminder_enabled
    if (typeof body.reminder_time === 'string') update.reminder_time = body.reminder_time
    if (typeof body.timezone === 'string') update.timezone = body.timezone

    await updateNotificationPreferences(update)
    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to save preferences' }, { status: 400 })
  }
}

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
