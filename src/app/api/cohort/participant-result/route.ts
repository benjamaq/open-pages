import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { buildCohortParticipantResultPayload } from '@/lib/cohortParticipantResultPayload'

export const dynamic = 'force-dynamic'

/**
 * Returns the signed-in user's published cohort result (same resolution as SSR on /dashboard/cohort-result).
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

    const built = await buildCohortParticipantResultPayload(user.id)
    if (!built.ok) {
      return NextResponse.json(
        {
          error: built.reason === 'participant_dropped' ? 'Not available' : 'Not found',
          reason:
            built.reason === 'participant_dropped' ? 'participant_dropped' : 'no_published_result',
        },
        { status: 404 },
      )
    }

    return NextResponse.json(built.payload)
  } catch (e: unknown) {
    console.error('[participant-result]', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed' },
      { status: 500 },
    )
  }
}
