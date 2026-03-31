import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import {
  cohortHealthStatusLabel,
  countCohortConfirmedParticipants,
  countCohortEnrollmentsLast24h,
  countCohortStatusParticipants,
} from '@/lib/cohortRecruitment'
import { isQualificationResponseVisuallyShort } from '@/lib/qualificationFreeText'

function adminDenied(req: NextRequest): NextResponse | null {
  if (process.env.NODE_ENV !== 'production') return null
  const key = req.headers.get('x-admin-key')
  if (!key || key !== process.env.ADMIN_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return null
}

/** GET /api/admin/cohorts — list cohorts. GET /api/admin/cohorts?cohort_uuid= — confirmed participants. */
export async function GET(request: NextRequest) {
  const denied = adminDenied(request)
  if (denied) return denied

  const { searchParams } = new URL(request.url)
  const cohortUuid = searchParams.get('cohort_uuid')?.trim() || null

  try {
    if (!cohortUuid) {
      const { data: cohorts, error } = await supabaseAdmin
        .from('cohorts')
        .select('id, slug, brand_name, product_name, status, max_participants, min_participants, display_capacity')
        .order('brand_name', { ascending: true })
      if (error) {
        console.error('[admin/cohorts] list:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      const base = cohorts || []
      const cohortsWithCounts = await Promise.all(
        base.map(async (c: { id: string; max_participants?: number | null; min_participants?: number | null }) => {
          const [appliedCount, confirmedCount, droppedCount, new24] = await Promise.all([
            countCohortStatusParticipants(c.id, 'applied'),
            countCohortConfirmedParticipants(c.id),
            countCohortStatusParticipants(c.id, 'dropped'),
            countCohortEnrollmentsLast24h(c.id),
          ])
          const maxP = c.max_participants != null ? Number(c.max_participants) : null
          const confirmedPctOfMax =
            maxP != null && Number.isFinite(maxP) && maxP > 0
              ? Math.round((confirmedCount / maxP) * 1000) / 10
              : null
          const health = cohortHealthStatusLabel({
            minParticipants: c.min_participants != null ? Number(c.min_participants) : null,
            maxParticipants: maxP,
            confirmedCount,
            newEnrollmentsLast24h: new24,
          })
          return {
            ...c,
            applied_participant_count: appliedCount,
            confirmed_participant_count: confirmedCount,
            dropped_participant_count: droppedCount,
            confirmed_pct_of_max: confirmedPctOfMax,
            new_enrollments_24h: new24,
            health_status: health,
          }
        })
      )
      return NextResponse.json({ cohorts: cohortsWithCounts })
    }

    const { data: parts, error: pErr } = await supabaseAdmin
      .from('cohort_participants')
      .select('enrolled_at, confirmed_at, user_id, qualification_response')
      .eq('cohort_id', cohortUuid)
      .eq('status', 'confirmed')
      .order('confirmed_at', { ascending: true })

    if (pErr) {
      console.error('[admin/cohorts] participants:', pErr)
      return NextResponse.json({ error: pErr.message }, { status: 500 })
    }

    const list = parts || []
    if (list.length === 0) {
      return NextResponse.json({ participants: [] })
    }

    const profileIds = list.map((p: { user_id: string }) => p.user_id)
    const { data: profs, error: profErr } = await supabaseAdmin
      .from('profiles')
      .select('id, display_name, user_id')
      .in('id', profileIds)

    if (profErr) {
      console.error('[admin/cohorts] profiles:', profErr)
      return NextResponse.json({ error: profErr.message }, { status: 500 })
    }

    const profById = Object.fromEntries((profs || []).map((r: any) => [r.id, r]))

    const participants = await Promise.all(
      list.map(
        async (p: {
          enrolled_at: string
          confirmed_at: string | null
          user_id: string
          qualification_response?: string | null
        }) => {
          const prof = profById[p.user_id] as { display_name: string | null; user_id: string } | undefined
          let email = ''
          if (prof?.user_id) {
            try {
              const { data, error: auErr } = await supabaseAdmin.auth.admin.getUserById(prof.user_id)
              if (!auErr && data?.user?.email) email = String(data.user.email)
            } catch {
              /* ignore */
            }
          }
          const q = p.qualification_response != null ? String(p.qualification_response) : ''
          return {
            display_name: prof?.display_name ?? null,
            email,
            enrolled_at: p.enrolled_at,
            confirmed_at: p.confirmed_at,
            qualification_short: isQualificationResponseVisuallyShort(q),
          }
        },
      )
    )

    const { data: appliedRows, error: aErr } = await supabaseAdmin
      .from('cohort_participants')
      .select('enrolled_at, user_id, qualification_response')
      .eq('cohort_id', cohortUuid)
      .eq('status', 'applied')
      .order('enrolled_at', { ascending: false })

    if (aErr) {
      console.error('[admin/cohorts] applied participants:', aErr)
      return NextResponse.json({ error: aErr.message }, { status: 500 })
    }

    const appliedList = appliedRows || []
    let applied_participants: typeof participants = []
    if (appliedList.length > 0) {
      const appliedProfileIds = appliedList.map((r: { user_id: string }) => r.user_id)
      const { data: appliedProfs, error: apErr } = await supabaseAdmin
        .from('profiles')
        .select('id, display_name, user_id')
        .in('id', appliedProfileIds)
      if (apErr) {
        console.error('[admin/cohorts] applied profiles:', apErr)
        return NextResponse.json({ error: apErr.message }, { status: 500 })
      }
      const apById = Object.fromEntries((appliedProfs || []).map((r: any) => [r.id, r]))
      applied_participants = await Promise.all(
        appliedList.map(
          async (p: { enrolled_at: string; user_id: string; qualification_response?: string | null }) => {
            const prof = apById[p.user_id] as { display_name: string | null; user_id: string } | undefined
            let email = ''
            if (prof?.user_id) {
              try {
                const { data, error: auErr } = await supabaseAdmin.auth.admin.getUserById(prof.user_id)
                if (!auErr && data?.user?.email) email = String(data.user.email)
              } catch {
                /* ignore */
              }
            }
            const q = p.qualification_response != null ? String(p.qualification_response) : ''
            return {
              display_name: prof?.display_name ?? null,
              email,
              enrolled_at: p.enrolled_at,
              confirmed_at: null as string | null,
              qualification_short: isQualificationResponseVisuallyShort(q),
            }
          },
        )
      )
    }

    return NextResponse.json({ participants, applied_participants })
  } catch (e: any) {
    console.error('[admin/cohorts]', e)
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 })
  }
}
