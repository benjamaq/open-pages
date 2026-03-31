import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { sendCohortStudyStartEmail } from '@/lib/cohortStudyStartEmail'

export const dynamic = 'force-dynamic'

type ArrivalChoice = 'today' | 'yesterday' | 'few_days_ago' | 'skip'

function ymdAddDays(ymd: string, delta: number): string {
  const [y, m, d] = ymd.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  dt.setUTCDate(dt.getUTCDate() + delta)
  const yy = dt.getUTCFullYear()
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(dt.getUTCDate()).padStart(2, '0')
  return `${yy}-${mm}-${dd}`
}

function productArrivedDate(choice: ArrivalChoice): string | null {
  const today = new Date().toISOString().slice(0, 10)
  switch (choice) {
    case 'today':
      return today
    case 'yesterday':
      return ymdAddDays(today, -1)
    case 'few_days_ago':
      return ymdAddDays(today, -3)
    case 'skip':
    default:
      return null
  }
}

/**
 * Confirmed participant: product arrived → start 21-day study clock + first check-in.
 * Body: { productArrived?: 'today' | 'yesterday' | 'few_days_ago' | 'skip' }
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
    const raw = body?.productArrived
    const choice: ArrivalChoice =
      raw === 'today' || raw === 'yesterday' || raw === 'few_days_ago' || raw === 'skip' ? raw : 'skip'

    const { data: prof, error: pErr } = await supabaseAdmin
      .from('profiles')
      .select('id, cohort_id')
      .eq('user_id', user.id)
      .maybeSingle()
    if (pErr || !prof?.id) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 400 })
    }
    const profileId = String((prof as { id: string }).id)
    const cohortSlug =
      (prof as { cohort_id?: string | null }).cohort_id != null
        ? String((prof as { cohort_id: string }).cohort_id).trim()
        : ''
    if (!cohortSlug) {
      return NextResponse.json({ error: 'No cohort' }, { status: 400 })
    }

    const { data: cohortRow, error: cErr } = await supabaseAdmin
      .from('cohorts')
      .select('id, product_name')
      .eq('slug', cohortSlug)
      .maybeSingle()
    if (cErr || !cohortRow?.id) {
      return NextResponse.json({ error: 'Cohort not found' }, { status: 400 })
    }
    const cohortUuid = String((cohortRow as { id: string }).id)
    const productName =
      (cohortRow as { product_name?: string | null }).product_name != null
        ? String((cohortRow as { product_name: string }).product_name).trim()
        : 'Study product'

    const { data: part, error: partErr } = await supabaseAdmin
      .from('cohort_participants')
      .select('id, status, confirmed_at, study_started_at')
      .eq('user_id', profileId)
      .eq('cohort_id', cohortUuid)
      .maybeSingle()

    if (partErr || !part?.id) {
      return NextResponse.json({ error: 'Not a study participant' }, { status: 400 })
    }
    const status = String((part as { status: string }).status)
    const confirmedAt = (part as { confirmed_at?: string | null }).confirmed_at
    const startedAt = (part as { study_started_at?: string | null }).study_started_at

    if (status !== 'confirmed' || !confirmedAt) {
      return NextResponse.json({ error: 'Study not confirmed yet' }, { status: 400 })
    }
    if (startedAt != null && String(startedAt).trim() !== '') {
      return NextResponse.json({ error: 'Study already started' }, { status: 400 })
    }

    const nowIso = new Date().toISOString()
    const arrived = productArrivedDate(choice)
    const patch: Record<string, unknown> = {
      study_started_at: nowIso,
    }
    if (arrived) {
      patch.product_arrived_at = arrived
    }

    const { error: upErr } = await supabaseAdmin
      .from('cohort_participants')
      .update(patch)
      .eq('id', (part as { id: string }).id)
      .is('study_started_at', null)

    if (upErr) {
      console.error('[cohort/start-study] update', upErr)
      return NextResponse.json({ error: 'Could not start study' }, { status: 500 })
    }

    const email = String(user.email || '').trim()
    if (email) {
      const r = await sendCohortStudyStartEmail({ to: email, productName })
      if (!r.success) {
        console.warn('[cohort/start-study] email', r.error)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Failed'
    console.error('[cohort/start-study]', e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
