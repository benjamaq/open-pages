import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { countCohortConfirmedParticipants, countCohortPipelineParticipants } from '@/lib/cohortRecruitment'

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
        .select('id, slug, brand_name, product_name, status, recruitment_closes_at, max_participants')
        .order('brand_name', { ascending: true })
      if (error) {
        console.error('[admin/cohorts] list:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      const base = cohorts || []
      const cohortsWithCounts = await Promise.all(
        base.map(async (c: { id: string }) => {
          const [confirmedCount, pipelineCount] = await Promise.all([
            countCohortConfirmedParticipants(c.id),
            countCohortPipelineParticipants(c.id),
          ])
          return {
            ...c,
            confirmed_participant_count: confirmedCount,
            pipeline_participant_count: pipelineCount,
          }
        })
      )
      return NextResponse.json({ cohorts: cohortsWithCounts })
    }

    const { data: parts, error: pErr } = await supabaseAdmin
      .from('cohort_participants')
      .select('enrolled_at, confirmed_at, user_id')
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
      list.map(async (p: { enrolled_at: string; confirmed_at: string | null; user_id: string }) => {
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
        return {
          display_name: prof?.display_name ?? null,
          email,
          enrolled_at: p.enrolled_at,
          confirmed_at: p.confirmed_at,
        }
      })
    )

    return NextResponse.json({ participants })
  } catch (e: any) {
    console.error('[admin/cohorts]', e)
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 })
  }
}
