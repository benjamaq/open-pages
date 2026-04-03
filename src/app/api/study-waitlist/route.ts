import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { STUDY_COHORT_FULL_WAITLIST_SOURCE } from '@/lib/studyCohortFullWaitlistSource'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function normEmail(s: string): string {
  return String(s || '').trim().toLowerCase()
}

/**
 * Public: join study waitlist (no account).
 * Body: { cohort_slug: string, email: string, source?: string }
 * When source is set, must match STUDY_COHORT_FULL_WAITLIST_SOURCE (cohort-full capture).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const slugRaw = body?.cohort_slug
    const emailRaw = body?.email
    const sourceRaw = body?.source
    const slug = typeof slugRaw === 'string' ? slugRaw.trim().toLowerCase() : ''
    const email = typeof emailRaw === 'string' ? normEmail(emailRaw) : ''
    let source: string | null = null
    if (sourceRaw !== undefined && sourceRaw !== null && sourceRaw !== '') {
      if (typeof sourceRaw !== 'string' || sourceRaw !== STUDY_COHORT_FULL_WAITLIST_SOURCE) {
        return NextResponse.json({ error: 'Invalid source' }, { status: 400 })
      }
      source = STUDY_COHORT_FULL_WAITLIST_SOURCE
    }
    if (!slug || !email || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: 'Invalid cohort or email' }, { status: 400 })
    }

    const { data: cohort, error: cErr } = await supabaseAdmin
      .from('cohorts')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()
    if (cErr || !cohort?.id) {
      return NextResponse.json({ error: 'Study not found' }, { status: 404 })
    }

    const cohortId = String((cohort as { id: string }).id)
    const row: Record<string, unknown> = { cohort_id: cohortId, email }
    if (source) row.source = source
    const { error: insErr } = await supabaseAdmin.from('study_waitlist').insert(row)

    if (insErr) {
      if (insErr.code === '23505') {
        return NextResponse.json({ ok: true, duplicate: true })
      }
      console.error('[study-waitlist] insert:', insErr)
      return NextResponse.json({ error: 'Could not save. Try again later.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[study-waitlist]', e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
