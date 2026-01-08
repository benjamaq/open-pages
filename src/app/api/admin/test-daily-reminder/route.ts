import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { renderDailyReminderEmail as renderV3Reminder } from '@/lib/email/templates/daily-reminder'

function stackToLines(list: string[]): string {
  const emojiFor = (item: string) => {
    const s = (item || '').toLowerCase()
    if (s.includes('omega')) return '🐟'
    if (s.includes('sauna')) return '🔥'
    if (s.includes('mag')) return '🧴'
    return '💊'
  }
  return (list || []).map((i) => `${emojiFor(i)} ${i}`).join('<br/>')
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const to = url.searchParams.get('to') || 'ben09@mac.com'
    const userName = url.searchParams.get('userName') || 'Ben'
    const pain = Number(url.searchParams.get('pain') || 6)
    const mood = Number(url.searchParams.get('mood') || 7)
    const sleep = Number(url.searchParams.get('sleep') || 5)
    const readinessScore = Number(url.searchParams.get('readinessScore') || 60)
    const readinessEmoji = url.searchParams.get('readinessEmoji') || '💧'
    const readinessMessage = url.searchParams.get('readinessMessage') || 'Take it steady — light activity today'
    const checkInUrl = url.searchParams.get('checkInUrl') || `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3009'}/dashboard?checkin=open`
    const optOutUrl = url.searchParams.get('optOutUrl') || `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3009'}/settings/notifications`
    const supplements = (url.searchParams.getAll('supplement') || [])
    const supplementList = supplements.length ? supplements : ['Magnesium', 'Omega-3', 'Sauna Protocol']

    // Use V3 template (Energy/Focus/Sleep)
    const html = renderV3Reminder({
      firstName: userName,
      supplementCount: Math.max(1, supplementList.length),
      progressPercent: readinessScore,
      checkinUrl: checkInUrl,
      energy: pain,
      focus: mood,
      sleep
    })

    const subject = `${readinessScore}% complete`
    const resend = new Resend(process.env.RESEND_API_KEY!)
    const from = process.env.RESEND_FROM || 'BioStackr <onboarding@resend.dev>'
    const reply_to = process.env.REPLY_TO_EMAIL || undefined
    const result = await resend.emails.send({ from, to, subject, html, ...(reply_to ? { reply_to } : {}) })
    if (result.error) return NextResponse.json({ ok: false, error: result.error.message }, { status: 500 })
    return NextResponse.json({ ok: true, id: result.data?.id, to })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Failed to send' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const to = body.to || 'ben09@mac.com'
    const userName = body.userName || 'Ben'
    const pain = Number(body.pain || 6)
    const mood = Number(body.mood || 7)
    const sleep = Number(body.sleep || 5)
    const readinessScore = Number(body.readinessScore || 60)
    const readinessEmoji = body.readinessEmoji || '💧'
    const readinessMessage = body.readinessMessage || 'Take it steady — light activity today'
    const supplements: string[] = body.supplementList || ['Magnesium', 'Omega-3', 'Sauna Protocol']
    const checkInUrl = body.checkInUrl || `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3009'}/dashboard?checkin=open`
    const optOutUrl = body.optOutUrl || `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3009'}/settings/notifications`

    const html = renderV3Reminder({
      firstName: userName,
      supplementCount: Math.max(1, supplements.length),
      progressPercent: readinessScore,
      checkinUrl: checkInUrl,
      energy: pain,
      focus: mood,
      sleep
    })

    const subject = `${readinessScore}% complete`
    const resend = new Resend(process.env.RESEND_API_KEY!)
    const from = process.env.RESEND_FROM || 'BioStackr <onboarding@resend.dev>'
    const reply_to = process.env.REPLY_TO_EMAIL || undefined
    const result = await resend.emails.send({ from, to, subject, html, ...(reply_to ? { reply_to } : {}) })
    if (result.error) return NextResponse.json({ ok: false, error: result.error.message }, { status: 500 })
    return NextResponse.json({ ok: true, id: result.data?.id, to })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Failed to send' }, { status: 500 })
  }
}


