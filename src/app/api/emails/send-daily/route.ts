import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { renderDailyReminderHTML as renderDailyReminderHTML_HTML, getDailyReminderSubject as getDailyReminderSubject_HTML } from '@/lib/email/dailyReminderTemplate'
import { Resend } from 'resend'

export async function POST(_req: NextRequest) {
  try {
    // Authenticated service usage: iterate users who should receive today
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

    // For demo: only send to current user (expand to cron selection later)
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, email')
      .eq('user_id', user.id)
      .maybeSingle()

    const userEmail = (profile as any)?.email || user.email
    const name = ((profile as any)?.display_name || '').split(' ')[0] || (user.email || 'there').split('@')[0]

    // Mock latest metrics; in production, compute from daily_entries
    const pain = 6, mood = 7, sleep = 5
    const readiness_percent = 60
    const readiness_emoji = '💧'
    const readiness_message = 'Take it steady — light activity today.'
    const stack_lines = '🧴 Magnesium<br/>🐟 Omega-3<br/>🔥 Sauna Protocol'
    const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3009'
    const html = renderDailyReminderHTML_HTML({
      userName: name,
      pain, mood, sleep,
      readinessPercent: readiness_percent,
      readinessEmoji: readiness_emoji,
      readinessMessage: readiness_message,
      contextualInsight: '',
      supplementList: ['Magnesium', 'Omega-3', 'Sauna Protocol'],
      checkInUrl: `${base}/dash`,
      quickSaveUrl: `${base}/api/checkin/magic?token=PLACEHOLDER`,
      unsubscribeUrl: `${base}/settings/notifications`,
    })

    const subject = getDailyReminderSubject_HTML(name)
    const resend = new Resend(process.env.RESEND_API_KEY!)
    const from = process.env.RESEND_FROM || 'BioStackr <onboarding@resend.dev>'
    const reply_to = process.env.REPLY_TO_EMAIL || undefined
    const result = await resend.emails.send({ from, to: userEmail!, subject, html, ...(reply_to ? { reply_to } : {}) })
    if (result.error) return NextResponse.json({ ok: false, error: result.error.message }, { status: 500 })
    return NextResponse.json({ ok: true, id: result.data?.id })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Failed to send' }, { status: 500 })
  }
}


