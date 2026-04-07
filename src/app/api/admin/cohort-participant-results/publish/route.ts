import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { validateCohortParticipantResultJsonForPublish } from '@/lib/cohortParticipantResultPublishValidation'

export const dynamic = 'force-dynamic'

function assertPublishAuth(request: NextRequest): NextResponse | null {
  const header = request.headers.get('authorization') || ''
  const cron = process.env.CRON_SECRET || ''
  const admin = process.env.COHORT_ADMIN_SECRET || ''
  const okCron = cron && header === `Bearer ${cron}`
  const okAdmin = admin && header === `Bearer ${admin}`
  if (!okCron && !okAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return null
}

type Body = {
  /** `cohort_participant_results.id` */
  resultRowId?: string
  /** If true, run validation only (no DB write). */
  dryRun?: boolean
}

/**
 * Single supported path to mark a participant result `published` with validation.
 * Auth: `Authorization: Bearer $CRON_SECRET` or `Bearer $COHORT_ADMIN_SECRET`.
 *
 * On validation failure: **400** with `{ errors: string[] }` — no row update.
 */
export async function POST(request: NextRequest) {
  const denied = assertPublishAuth(request)
  if (denied) return denied

  let body: Body = {}
  try {
    body = (await request.json()) as Body
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const id = String(body.resultRowId || '').trim()
  if (!id) {
    return NextResponse.json({ error: 'resultRowId required' }, { status: 400 })
  }
  const dryRun = Boolean(body.dryRun)

  const { data: resRow, error: rErr } = await supabaseAdmin
    .from('cohort_participant_results')
    .select('id, user_id, cohort_id, status, result_json, published_at')
    .eq('id', id)
    .maybeSingle()

  if (rErr || !resRow) {
    return NextResponse.json({ error: rErr?.message || 'Result row not found' }, { status: 404 })
  }

  const cohortId = String((resRow as { cohort_id?: string }).cohort_id || '').trim()
  const userId = String((resRow as { user_id?: string }).user_id || '').trim()
  const status = String((resRow as { status?: string }).status || '').toLowerCase()
  const resultJson = (resRow as { result_json?: unknown }).result_json

  if (!cohortId || !userId) {
    return NextResponse.json({ error: 'Result row missing cohort_id or user_id' }, { status: 400 })
  }

  const { data: part, error: pErr } = await supabaseAdmin
    .from('cohort_participants')
    .select('cohort_id')
    .eq('cohort_id', cohortId)
    .eq('user_id', userId)
    .maybeSingle()

  if (pErr || !part) {
    return NextResponse.json(
      { error: 'No cohort_participants row for this result (user_id + cohort_id)' },
      { status: 400 },
    )
  }
  const participantCohortId = String((part as { cohort_id: string }).cohort_id)

  const { data: cohort, error: cErr } = await supabaseAdmin
    .from('cohorts')
    .select('id, checkin_fields')
    .eq('id', cohortId)
    .maybeSingle()

  if (cErr || !cohort) {
    return NextResponse.json({ error: 'Cohort not found for result.cohort_id' }, { status: 400 })
  }

  const validated = validateCohortParticipantResultJsonForPublish({
    resultCohortId: cohortId,
    participantCohortId,
    cohortCheckinFieldsRaw: (cohort as { checkin_fields?: unknown }).checkin_fields,
    resultJson,
  })

  if (!validated.ok) {
    return NextResponse.json({ ok: false, errors: validated.errors }, { status: 400 })
  }

  if (status === 'published' && (resRow as { published_at?: string | null }).published_at) {
    return NextResponse.json({ ok: true, skipped: true, reason: 'already_published' })
  }

  if (dryRun) {
    return NextResponse.json({ ok: true, dryRun: true })
  }

  const publishedAt = new Date().toISOString()
  const { error: upErr } = await supabaseAdmin
    .from('cohort_participant_results')
    .update({
      status: 'published',
      published_at: publishedAt,
    } as Record<string, unknown>)
    .eq('id', id)

  if (upErr) {
    return NextResponse.json({ error: upErr.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, published_at: publishedAt })
}
