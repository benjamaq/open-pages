import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import webpush from 'web-push'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function isTimeInWindow(timeHHMM: string, timezone: string, windowMinutes = 5) {
  try {
    const [hStr, mStr] = (timeHHMM || '09:00').split(':')
    const targetH = parseInt(hStr, 10)
    const targetM = parseInt(mStr, 10)

    const now = new Date()
    const fmt = new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone || 'UTC',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
    const parts = fmt.formatToParts(now)
    const curH = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10)
    const curM = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10)

    const curTotal = curH * 60 + curM
    const tgtTotal = targetH * 60 + targetM
    return Math.abs(curTotal - tgtTotal) <= windowMinutes
  } catch (e) {
    return false
  }
}

async function sendToUser(userId: string, payload: any) {
  const supabase = createAdminClient()
  const { data: subs, error } = await supabase
    .from('push_subscriptions')
    .select('endpoint, subscription')
    .eq('user_id', userId)

  if (error) {
    if (error.message?.includes('relation') || error.message?.includes('table')) {
      console.warn('[push-cron] push_subscriptions table missing; skipping')
      return { sent: 0, deleted: 0 }
    }
    console.error('[push-cron] read subscriptions error', error)
    return { sent: 0, deleted: 0 }
  }

  if (!subs || subs.length === 0) return { sent: 0, deleted: 0 }

  const pub = process.env.VAPID_PUBLIC_KEY || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const priv = process.env.VAPID_PRIVATE_KEY || process.env.NEXT_PUBLIC_VAPID_PRIVATE_KEY
  if (!pub || !priv) {
    console.warn('[push-cron] VAPID keys not configured; skipping send')
    return { sent: 0, deleted: 0 }
  }

  webpush.setVapidDetails('mailto:support@biostackr.io', pub, priv)

  let sent = 0
  let deleted = 0
  for (const row of subs) {
    try {
      await webpush.sendNotification(row.subscription, JSON.stringify(payload))
      sent += 1
    } catch (e: any) {
      // Clean up invalid subscriptions (410 Gone, 404 Not Found)
      const status = e?.statusCode || e?.status || 0
      if (status === 410 || status === 404) {
        await supabase.from('push_subscriptions').delete().eq('endpoint', (row as any).endpoint)
        deleted += 1
      } else {
        console.warn('[push-cron] send failure', { status, message: e?.message })
      }
    }
  }
  return { sent, deleted }
}

async function handleSend() {
  const supabase = createAdminClient()
  const now = new Date().toISOString()
  let processed = 0
  let attempted = 0
  let sent = 0
  let cleaned = 0

  // Read preferences with daily push enabled
  const { data: prefs, error } = await supabase
    .from('notification_preferences')
    .select('profile_id, daily_reminder_enabled, reminder_time, timezone, profiles:profile_id(user_id, display_name)')
    .eq('daily_reminder_enabled', true)

  if (error) {
    if (error.message?.includes('relation') || error.message?.includes('table')) {
      return NextResponse.json({ note: 'notification_preferences missing; nothing to do' })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  for (const pref of prefs || []) {
    processed += 1
    const tz = (pref as any).timezone || 'UTC'
    const t = (pref as any).reminder_time?.slice?.(0, 5) || '09:00'
    const userId = (pref as any).profiles?.user_id
    if (!userId) continue

    const inWindow = isTimeInWindow(t, tz, 3)
    if (!inWindow) continue
    attempted += 1

    const payload = {
      title: 'BioStackr Check-In',
      body: 'Time to log your daily health check-in',
      url: '/dash/today'
    }
    const result = await sendToUser(userId, payload)
    sent += result.sent
    cleaned += result.deleted
  }

  return NextResponse.json({ ok: true, now, processed, attempted, sent, cleaned })
}

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const headerSecret = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (cronSecret && headerSecret !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return handleSend()
}

export async function POST(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const headerSecret = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (cronSecret && headerSecret !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return handleSend()
}


