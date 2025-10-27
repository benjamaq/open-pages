import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email/resend'

type Recipient = { email: string; userId: string; daysTracked: number; hasTags: boolean; emailType: 'JESSE_SPECIAL' | 'NURTURE_3_DAYS' | 'NURTURE_4_DAYS' }

function extractFirstName(rawEmail: string): string {
  try {
    const email = (rawEmail || '').trim().toLowerCase()
    // Manual overrides per brief
    if (email === 'debbitenada127@gmail.com') return 'Deb'
    if (email === 'kimmytide6@gmail.com') return 'Kimmy'
    if (email === 'kingirl66@gmail.com') return 'kingirl'

    const username = email.split('@')[0]
    if (username.includes('.')) {
      const base = username.split('.')[0]
      return base.charAt(0).toUpperCase() + base.slice(1)
    }
    const cleaned = username.replace(/[0-9]/g, '')
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
  } catch {
    return 'there'
  }
}

function renderJesseSpecial(firstName: string): { subject: string; html: string } {
  const subject = 'Quick tip to help you get better insights'
  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#111827;">
      <div style="max-width:640px;margin:0 auto;padding:24px;">
        <p>Hi ${firstName},</p>
        <p>Ben here (founder of BioStackr). I wanted to reach out with a quick tip that could really help you.</p>
        <p style="color:#374151">(Quick privacy note: I can see that you've tracked 2 days — awesome! — and that you haven't selected lifestyle tags yet. But I can't see your actual pain scores, symptoms, or any of your personal health data. That's yours alone. Just wanted you to know!)</p>
        <p>Here's the thing: I noticed you haven't been selecting lifestyle tags (like caffeine, supplements, exercise, stress, etc.) when you check in.</p>
        <p>This matters because our pattern detection looks at TWO types of patterns:</n><ol><li>Metric patterns — how your sleep quality affects your mood (we'll catch these!)</li><li>Lifestyle patterns — how caffeine, supplements, and food affect you (we'll miss these if you don't select tags)</li></ol></p>
        <p>So when you check in today: try tapping a few lifestyle tags that apply. Even just “caffeine” or “stress” helps us find patterns you’d never spot on your own.</p>
        <p>You're 3 days away from your first personalized insight — let's make sure we catch everything that might be affecting you!</p>
        <p>Keep going,<br/>Ben</p>
        <p style="color:#6b7280">P.S. If you have questions about anything, just reply. I read every email.</p>
      </div>
    </div>`
  return { subject, html }
}

function renderNurture(firstName: string, daysTracked: number, daysNeeded: number): { subject: string; html: string } {
  const subject = 'You’re part of something really early here'
  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#111827;">
      <div style="max-width:640px;margin:0 auto;padding:24px;">
        <p>Hey ${firstName},</p>
        <p>Ben here — I’m the person building BioStackr. Thanks for jumping in and starting to track — that means a lot to me.</p>
        <p style="color:#374151">(Quick note: I can see you’ve been tracking — that’s amazing — but I can’t see your actual pain scores, symptoms, or personal health data. That’s private to you. I’m reaching out because you’re an early user and I genuinely want to help you get the most out of this.)</p>
        <p>This whole thing started because I watched my mum struggle with chronic pain for years — trying supplement after supplement, changing her diet, adjusting her sleep — but never really knowing what actually helped. Just guessing in the dark.</p>
        <p>So I built this for her. And for anyone who’s tired of that same guessing game.</p>
        <p>You’re ${daysTracked} day${daysTracked === 1 ? '' : 's'} into tracking. That’s brilliant. But here’s what most people don’t realize — the magic kicks in at Day 5.</p>
        <p>That’s when we have enough data to spot patterns you’d never see on your own. Things like:</p>
        <ul>
          <li>“Your pain drops 2 points on days you sleep 7+ hours”</li>
          <li>“Caffeine after 2pm correlates with worse sleep quality”</li>
          <li>“That magnesium you take? It’s working — your pain is ~30% lower on days you take it”</li>
        </ul>
        <p>But we can’t find those patterns unless you:</p>
        <ol>
          <li>Keep tracking (just need ${daysNeeded} more day${daysNeeded === 1 ? '' : 's'})</li>
          <li>Select a couple lifestyle tags — caffeine, stress, supplements, exercise, whatever applies that day</li>
        </ol>
        <p>Those tags are critical. They’re how we connect the dots.</p>
        <p>So here’s what I’m asking:</p>
        <p>Track for ${daysNeeded} more day${daysNeeded === 1 ? '' : 's'}. Takes 20 seconds. Select a couple tags each time. Then check back on Day 5.</p>
        <p>I genuinely believe you’ll see something that makes you go “holy shit, THAT’S why I’ve been feeling this way.”</p>
        <p>That’s the moment I built this for.</p>
        <p>Keep going. You’re almost there.</p>
        <p>Ben<br/>Founder, BioStackr</p>
        <p style="color:#6b7280">P.S. If you have any questions, or something’s not working right, just reply. I read every single one.</p>
      </div>
    </div>`
  return { subject, html }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    const recipients = (payload?.recipients || []) as Recipient[]
    const dryRun = !!payload?.dryRun

    if (!Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json({ error: 'No recipients provided' }, { status: 400 })
    }

    const results: any[] = []
    const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms))
    for (const r of recipients) {
      const first = extractFirstName(r.email)
      let subject = ''
      let html = ''
      if (r.emailType === 'JESSE_SPECIAL') {
        ({ subject, html } = renderJesseSpecial(first))
      } else if (r.emailType === 'NURTURE_3_DAYS') {
        ({ subject, html } = renderNurture(first, 2, 3))
      } else {
        ({ subject, html } = renderNurture(first, 1, 4))
      }

      if (dryRun) {
        results.push({ email: r.email, subject, preview: html.slice(0, 200) + '...' })
        continue
      }

      // Throttle to respect provider rate limits
      await sleep(600)

      let resp = await sendEmail({
        to: r.email,
        subject,
        html,
        from: 'Ben from BioStackr <notifications@biostackr.io>',
        replyTo: 'ben09@mac.com'
      })
      if (!resp.success && (resp.error || '').toLowerCase().includes('too many requests')) {
        await sleep(1000)
        resp = await sendEmail({
          to: r.email,
          subject,
          html,
          from: 'Ben from BioStackr <notifications@biostackr.io>',
          replyTo: 'ben09@mac.com'
        })
      }
      results.push({ email: r.email, ok: resp.success, id: resp.id, error: resp.error })
    }

    return NextResponse.json({ ok: true, count: results.length, results })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}


