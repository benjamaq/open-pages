import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cohortParticipantUserIdCandidatesSync } from '@/lib/cohortParticipantUserId'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email/resend'

const SUPPORT_TO = 'benm@biostackr.io'
const MAX_MESSAGE_CHARS = 8000

const REASONS = ['missed_checkin', 'next_steps', 'study_question'] as const
type Reason = (typeof REASONS)[number]

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

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
 * Study support: reason tag + required free-text message in email (no DB).
 * Body: { reason, message }
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

    const messageRaw = body?.message
    const message =
      typeof messageRaw === 'string' ? messageRaw.replace(/\r\n/g, '\n').trim() : ''
    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }
    if (message.length > MAX_MESSAGE_CHARS) {
      return NextResponse.json(
        { error: `Message must be ${MAX_MESSAGE_CHARS} characters or less` },
        { status: 400 },
      )
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
        const cpKeys = cohortParticipantUserIdCandidatesSync(profileId, user.id)
        const { data: pRow } = await supabaseAdmin
          .from('cohort_participants')
          .select('status')
          .in('user_id', cpKeys)
          .eq('cohort_id', cid)
          .maybeSingle()
        participantStatus =
          pRow && (pRow as { status?: string }).status ? String((pRow as { status: string }).status) : ''
      }
    }

    const subject = `[Study support] ${labelForReason(reason)} · ${email}`
    const metaLines = [
      `Reason: ${labelForReason(reason)}`,
      `Auth user id: ${user.id}`,
      profileId ? `Profile id: ${profileId}` : '',
      cohortSlug ? `Cohort slug: ${cohortSlug}` : '',
      participantStatus ? `Participant status: ${participantStatus}` : '',
    ]
      .filter(Boolean)
      .join('\n')

    const preStyle =
      'font-family:system-ui,sans-serif;white-space:pre-wrap;line-height:1.5;margin:0'
    const html = `<div style="font-family:system-ui,sans-serif;line-height:1.5;color:#111827">
  <p style="margin:0 0 8px 0;font-weight:600;font-size:14px">Participant message</p>
  <pre style="${preStyle};padding:12px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:20px">${escHtml(
    message,
  )}</pre>
  <p style="margin:0 0 8px 0;font-weight:600;font-size:14px">Account details</p>
  <pre style="${preStyle}">${escHtml(metaLines)}</pre>
</div>`

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
