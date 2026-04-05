import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { cohortParticipantUserIdCandidatesSync } from '@/lib/cohortParticipantUserId'

export const dynamic = 'force-dynamic'

/**
 * Returns only the signed-in user’s published cohort result for their current profile cohort (no cohort-wide payloads).
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser()
    if (authErr || !user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: prof, error: pErr } = await supabaseAdmin
      .from('profiles')
      .select('id, cohort_id')
      .eq('user_id', user.id)
      .maybeSingle()
    if (pErr) {
      console.error('[participant-result] profile', pErr.message)
      return NextResponse.json({ error: 'Failed to load profile' }, { status: 500 })
    }

    const cohortSlug =
      prof && typeof (prof as { cohort_id?: unknown }).cohort_id === 'string'
        ? String((prof as { cohort_id: string }).cohort_id).trim()
        : ''
    if (!cohortSlug) {
      return NextResponse.json({ error: 'No cohort' }, { status: 404 })
    }

    const { data: cdef, error: cErr } = await supabaseAdmin
      .from('cohorts')
      .select('id, product_name, brand_name')
      .eq('slug', cohortSlug)
      .maybeSingle()
    if (cErr || !cdef?.id) {
      return NextResponse.json({ error: 'Cohort not found' }, { status: 404 })
    }

    const cohortUuid = String((cdef as { id: string }).id)

    const { data: row, error: rErr } = await supabase
      .from('cohort_participant_results')
      .select('result_json, result_version, published_at, status')
      .eq('cohort_id', cohortUuid)
      .maybeSingle()

    if (rErr) {
      console.error('[participant-result] result', rErr.message)
      return NextResponse.json({ error: 'Failed to load result' }, { status: 500 })
    }

    const publishedAt = (row as { published_at?: string | null } | null)?.published_at
    const status = String((row as { status?: string } | null)?.status || '')
    if (
      !row ||
      status !== 'published' ||
      publishedAt == null ||
      String(publishedAt).trim() === ''
    ) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const productName =
      (cdef as { product_name?: string | null }).product_name != null &&
      String((cdef as { product_name: string }).product_name).trim() !== ''
        ? String((cdef as { product_name: string }).product_name).trim()
        : null
    const brandName =
      (cdef as { brand_name?: string | null }).brand_name != null &&
      String((cdef as { brand_name: string }).brand_name).trim() !== ''
        ? String((cdef as { brand_name: string }).brand_name).trim()
        : null

    const profileId =
      prof && typeof (prof as { id?: unknown }).id === 'string'
        ? String((prof as { id: string }).id).trim()
        : ''
    const cpUserIds = cohortParticipantUserIdCandidatesSync(profileId, user.id)

    let pro_reward: {
      has_row: boolean
      claimed: boolean
      claim_token: string | null
    } = { has_row: false, claimed: false, claim_token: null }

    const { data: cpRow } = await supabaseAdmin
      .from('cohort_participants')
      .select('id')
      .eq('cohort_id', cohortUuid)
      .in('user_id', cpUserIds)
      .maybeSingle()

    const cpId = (cpRow as { id?: string } | null)?.id
    if (cpId) {
      const { data: claimRow } = await supabaseAdmin
        .from('cohort_reward_claims')
        .select('token, claimed_at')
        .eq('cohort_participant_id', cpId)
        .maybeSingle()
      const cl = claimRow as { token?: string; claimed_at?: string | null } | null
      if (cl) {
        const claimed = cl.claimed_at != null && String(cl.claimed_at).trim() !== ''
        pro_reward = {
          has_row: true,
          claimed,
          claim_token:
            !claimed && cl.token != null && String(cl.token).trim() !== ''
              ? String(cl.token).trim()
              : null,
        }
      }
    }

    return NextResponse.json({
      result_json: (row as { result_json: unknown }).result_json,
      result_version: (row as { result_version: number }).result_version,
      published_at: publishedAt,
      product_name: productName,
      brand_name: brandName,
      pro_reward,
    })
  } catch (e: unknown) {
    console.error('[participant-result]', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed' },
      { status: 500 },
    )
  }
}
