import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email/resend'

const SUPPORT_TO = 'ben@biostackr.io'

const REASONS = ['missed_checkin', 'next_steps', 'study_question'] as const
type Reason = (typeof REASONS)[number]

function labelForReason(r: string): string {
  switch (r) {
    case 'missed_checkin':
      return 'I missed a check-in'
    case 'next_steps':
      return "I'm unsure what to do next"
    case 'study_question':
      return 'I have a question about the study'
    default:
      return r
  }
}

/**
 * Framed study support: tagged email only (no chat, no free text).
 * Body: { reason: 'missed_checkin' | 'next_steps' | 'study_question' }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser()
    if (authErr || !user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const reasonRaw = body?.reason
    const reason = typeof reasonRaw === 'string' ? reasonRaw.trim().toLowerCase() : ''
    if (!REASONS.includes(reason as Reason)) {
      return NextResponse.json({ error: 'Invalid reason' }, { status: 400 })
    }

    const email = String(user.email || '').trim() || 'unknown'

    const { data: prof } = await supabaseAdmin
      .from('profiles')
      .select('id, cohort_id')
      .eq('user_id', user.id)
      .maybeSingle()
    const profileId = prof?.id != null ? String((prof as { id: string }).id) : ''
    const cohortSlug =
      (prof as { cohort_id?: string | null } | null)?.cohort_id != null
        ? String((prof as { cohort_id: string }).cohort_id).trim()
        : ''

    let participantStatus = ''
    if (cohortSlug && profileId) {
      const { data: cRow } = await supabaseAdmin.from('cohorts').select('id').eq('slug', cohortSlug).maybeSingle()
      const cid = cRow && (cRow as { id?: string }).id ? String((cRow as { id: string }).id) : ''
      if (cid) {
        const { data: pRow } = await supabaseAdmin
          .from('cohort_participants')
          .select('status')
          .eq('user_id', profileId)
          .eq('cohort_id', cid)
          .maybeSingle()
        participantStatus =
          pRow && (pRow as { status?: string }).status ? String((pRow as { status: string }).status) : ''
      }
    }

    const subject = `[Study support] ${labelForReason(reason)} · ${email}`
    const textLines = [
      `Reason: ${labelForReason(reason)}`,
      `Auth user id: ${user.id}`,
      profileId ? `Profile id: ${profileId}` : '',
      cohortSlug ? `Cohort slug: ${cohortSlug}` : '',
      participantStatus ? `Participant status: ${participantStatus}` : '',
    ]
      .filter(Boolean)
      .join('\n')

    const html = `<pre style="font-family:system-ui,sans-serif;white-space:pre-wrap;line-height:1.5">${textLines
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')}</pre>`

    const r = await sendEmail({
      to: SUPPORT_TO,
      subject,
      html,
      replyTo: email,
    })
    if (!r.success) {
      return NextResponse.json({ error: r.error || 'Send failed' }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
