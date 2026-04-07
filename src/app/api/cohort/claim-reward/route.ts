import { NextRequest, NextResponse } from 'next/server'
import { addMonths } from 'date-fns'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { runCohortHandoffAfterProClaim } from '@/lib/cohortEnrollment'

export const dynamic = 'force-dynamic'

const MONTHS_GRANTED = 3

/** Public: validate token exists and whether it is still claimable. */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')?.trim() || ''
  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 })
  }

  try {
    const { data: row, error } = await supabaseAdmin
      .from('cohort_reward_claims')
      .select('id, claimed_at, reward_type')
      .eq('token', token)
      .maybeSingle()

    if (error) {
      console.error('[claim-reward] GET', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    if (!row) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const claimed = (row as { claimed_at?: string | null }).claimed_at != null
    return NextResponse.json({
      ok: true,
      claimed,
      reward_type: String((row as { reward_type?: string }).reward_type || 'pro_3_months'),
    })
  } catch (e: unknown) {
    console.error('[claim-reward] GET', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed' },
      { status: 500 },
    )
  }
}

/**
 * POST body: { token }
 * Single-use: first successful claim sets user_id + claimed_at and extends profiles.pro_expires_at.
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

    const body = (await request.json().catch(() => ({}))) as { token?: string }
    const token = String(body?.token || '').trim()
    if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 })
    }

    const { data: claimedRows, error: claimErr } = await supabaseAdmin
      .from('cohort_reward_claims')
      .update({
        user_id: user.id,
        claimed_at: new Date().toISOString(),
      })
      .eq('token', token)
      .is('claimed_at', null)
      .select('id, user_id, cohort_participant_id')

    if (claimErr) {
      console.error('[claim-reward] claim update', claimErr.message)
      return NextResponse.json({ error: claimErr.message }, { status: 500 })
    }

    const updated = Array.isArray(claimedRows) ? claimedRows[0] : claimedRows
    if (!updated?.id) {
      const { data: existing } = await supabaseAdmin
        .from('cohort_reward_claims')
        .select('user_id, claimed_at, cohort_participant_id')
        .eq('token', token)
        .maybeSingle()
      const ex = existing as {
        user_id?: string | null
        claimed_at?: string | null
        cohort_participant_id?: string | null
      } | null
      if (ex?.claimed_at && ex.user_id === user.id) {
        const cpid = String(ex.cohort_participant_id || '').trim()
        if (cpid) {
          await runCohortHandoffAfterProClaim({
            authUserId: user.id,
            cohortParticipantId: cpid,
          })
        }
        return NextResponse.json({
          ok: true,
          already_claimed: true,
        })
      }
      if (ex?.claimed_at) {
        return NextResponse.json({ error: 'This reward has already been claimed' }, { status: 409 })
      }
      return NextResponse.json({ error: 'Invalid token' }, { status: 404 })
    }

    const { data: prof, error: profErr } = await supabaseAdmin
      .from('profiles')
      .select('pro_expires_at')
      .eq('user_id', user.id)
      .maybeSingle()
    if (profErr) {
      console.error('[claim-reward] profile read', profErr.message)
      await rollbackClaim(token, user.id)
      return NextResponse.json({ error: profErr.message }, { status: 500 })
    }

    const baseMs = (() => {
      try {
        const ms = (prof as { pro_expires_at?: string | null } | null)?.pro_expires_at
          ? Date.parse(String((prof as { pro_expires_at: string }).pro_expires_at))
          : NaN
        if (Number.isFinite(ms) && ms > Date.now()) return ms
      } catch {
        /* ignore */
      }
      return Date.now()
    })()

    const newExpiry = addMonths(new Date(baseMs), MONTHS_GRANTED).toISOString()

    const { data: upRows, error: upErr } = await supabaseAdmin
      .from('profiles')
      .update({ pro_expires_at: newExpiry } as Record<string, unknown>)
      .eq('user_id', user.id)
      .select('user_id, pro_expires_at')

    if (upErr) {
      console.error('[claim-reward] profile update', upErr.message)
      await rollbackClaim(token, user.id)
      return NextResponse.json({ error: upErr.message }, { status: 500 })
    }

    const wrote = Array.isArray(upRows) ? upRows.length > 0 : Boolean((upRows as { user_id?: string })?.user_id)
    if (!wrote) {
      await rollbackClaim(token, user.id)
      return NextResponse.json(
        { error: 'Could not update your profile. Complete signup, then try again.' },
        { status: 500 },
      )
    }

    const cohortParticipantId = String(
      (updated as { cohort_participant_id?: string | null }).cohort_participant_id || '',
    ).trim()
    if (cohortParticipantId) {
      await runCohortHandoffAfterProClaim({
        authUserId: user.id,
        cohortParticipantId,
      })
    }

    return NextResponse.json({
      ok: true,
      already_claimed: false,
      pro_expires_at: newExpiry,
    })
  } catch (e: unknown) {
    console.error('[claim-reward] POST', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed' },
      { status: 500 },
    )
  }
}

async function rollbackClaim(token: string, userId: string): Promise<void> {
  try {
    await (supabaseAdmin as any)
      .from('cohort_reward_claims')
      .update({ user_id: null, claimed_at: null })
      .eq('token', token)
      .eq('user_id', userId)
  } catch {
    /* best-effort */
  }
}
