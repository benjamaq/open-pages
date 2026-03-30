import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { normalizeCohortCheckinFields } from '@/lib/cohortCheckinFields'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { countDistinctDailyEntriesSince } from '@/lib/cohortCheckinCount'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    let firstName: string | null = null
    let email: string | null = null
    let userId: string | null = null
    let tier: string | null = null
    let pro_expires_at: string | null = null
    let cohortId: string | null = null
    let checkinFields: string[] | null = null
    let cohortCheckinWelcomeRecommended = false
    let cohortStudyProductName: string | null = null

    if (!authError && user) {
      email = user.email || null
      userId = user.id
    } else {
      try {
        const all = (await cookies()).getAll()
        const tokenCookie = all.find(c => c.name.startsWith('sb-') && c.name.endsWith('-auth-token'))
        if (tokenCookie?.value) {
          const parsed = JSON.parse(tokenCookie.value)
          email = parsed?.user?.email || parsed?.email || null
          userId = parsed?.user?.id || parsed?.user?.sub || null
        }
      } catch {}
      if (!email) {
        try {
          const hdr = request.headers.get('x-supabase-auth')
          if (hdr) {
            const parsed = JSON.parse(hdr)
            email = parsed?.user?.email || parsed?.email || null
            userId = parsed?.user?.id || parsed?.user?.sub || null
          }
        } catch {}
      }
      if (!email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    try {
      if (userId) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('first_name, display_name, full_name, tier, pro_expires_at')
          .eq('user_id', userId)
          .maybeSingle()
        const fromProfiles =
          (prof as any)?.first_name ||
          (prof as any)?.display_name ||
          ((prof as any)?.full_name ? String((prof as any)?.full_name).split(' ')[0] : null)
        if (fromProfiles) firstName = String(fromProfiles)
        tier = (prof as any)?.tier ?? null
        pro_expires_at = (prof as any)?.pro_expires_at ?? null

        // Cohort: use service role so RLS never hides cohort_id / participant rows from the app.
        try {
          const { data: pAdmin } = await supabaseAdmin
            .from('profiles')
            .select('id, cohort_id')
            .eq('user_id', userId)
            .maybeSingle()
          const rawC = (pAdmin as { cohort_id?: string | null } | null)?.cohort_id
          cohortId = rawC != null && String(rawC).trim() !== '' ? String(rawC).trim() : null
          const profileId = (pAdmin as { id?: string } | null)?.id ? String((pAdmin as { id: string }).id) : null

          if (cohortId && profileId) {
            const { data: cdef } = await supabaseAdmin
              .from('cohorts')
              .select('id, checkin_fields, product_name')
              .eq('slug', cohortId)
              .maybeSingle()
            if (cdef != null && Array.isArray((cdef as { checkin_fields?: unknown }).checkin_fields)) {
              checkinFields = normalizeCohortCheckinFields(
                (cdef as { checkin_fields: unknown }).checkin_fields
              )
            }
            const pn = (cdef as { product_name?: string | null } | null)?.product_name
            cohortStudyProductName = pn != null && String(pn).trim() !== '' ? String(pn).trim() : null

            const cohortUuid = (cdef as { id?: string } | null)?.id
            if (cohortUuid) {
              const { data: part } = await supabaseAdmin
                .from('cohort_participants')
                .select('enrolled_at')
                .eq('user_id', profileId)
                .eq('cohort_id', cohortUuid)
                .maybeSingle()
              const enrolledAt = (part as { enrolled_at?: string } | null)?.enrolled_at
              if (enrolledAt) {
                const n = await countDistinctDailyEntriesSince(userId, String(enrolledAt))
                cohortCheckinWelcomeRecommended = n === 0
              }
            }
          }
        } catch {
          cohortId = null
          checkinFields = null
        }

        if (!firstName) {
          const { data: profile } = await supabase
            .from('app_user')
            .select('first_name, display_name, full_name')
            .eq('id', userId)
            .maybeSingle()
          const fromProfile =
            (profile as any)?.first_name ||
            (profile as any)?.display_name ||
            ((profile as any)?.full_name ? String((profile as any)?.full_name).split(' ')[0] : null)
          if (fromProfile) firstName = String(fromProfile)
        }
      }
    } catch {}

    if (!firstName) {
      const meta = (user as any)?.user_metadata || {}
      firstName =
        meta.first_name || meta.name ||
        (meta.full_name ? String(meta.full_name).split(' ')[0] : null) ||
        (email ? String(email).split('@')[0] : null)
    }

    return NextResponse.json({
      firstName: firstName || null,
      email,
      userId,
      tier,
      pro_expires_at,
      cohortId,
      checkinFields,
      cohortCheckinWelcomeRecommended,
      cohortStudyProductName,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 })
  }
}
