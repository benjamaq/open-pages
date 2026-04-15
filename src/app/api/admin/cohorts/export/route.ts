import { NextRequest, NextResponse } from 'next/server'
import { denyUnlessAdminApi } from '@/lib/adminApiAuth'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { authUserIdForParticipant, fetchProfilesForCohortParticipantUserIds } from '@/lib/adminCohortParticipantProfiles'
import { namesFromAuthAndProfileForShippingCsv } from '@/lib/cohortShippingExportNames'

const CSV_HEADERS = [
  'First Name',
  'Last Name',
  'Email',
  'Address Line 1',
  'Address Line 2',
  'City',
  'County/State',
  'Postcode/ZIP',
  'Country',
  'Phone',
] as const

function csvCell(value: string | null | undefined): string {
  const s = value == null ? '' : String(value)
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

/** GET /api/admin/cohorts/export?cohort_uuid= — CSV shipping list for confirmed participants */
export async function GET(request: NextRequest) {
  const denied = await denyUnlessAdminApi(request)
  if (denied) return denied

  const cohortUuid = new URL(request.url).searchParams.get('cohort_uuid')?.trim()
  if (!cohortUuid) {
    return NextResponse.json({ error: 'cohort_uuid required' }, { status: 400 })
  }

  try {
    const { data: cohort } = await supabaseAdmin.from('cohorts').select('slug').eq('id', cohortUuid).maybeSingle()
    const slug = (cohort as { slug?: string } | null)?.slug || 'cohort'

    const { data: parts, error: pErr } = await supabaseAdmin
      .from('cohort_participants')
      .select('user_id')
      .eq('cohort_id', cohortUuid)
      .eq('status', 'confirmed')

    if (pErr) {
      return NextResponse.json({ error: pErr.message }, { status: 500 })
    }

    const list = parts || []
    const headerRow = CSV_HEADERS.join(',')

    if (list.length === 0) {
      return new NextResponse(`${headerRow}\n`, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${slug}-confirmed-shipping.csv"`,
        },
      })
    }

    const participantUids = list.map((p: { user_id: string }) => p.user_id)
    const { map: profByParticipantId, error: profErr } =
      await fetchProfilesForCohortParticipantUserIds(participantUids)
    if (profErr) {
      return NextResponse.json({ error: profErr.message }, { status: 500 })
    }

    const rows: string[] = [headerRow]
    for (const p of list) {
      const prof = profByParticipantId.get((p as { user_id: string }).user_id)
      const authUid = authUserIdForParticipant(prof, (p as { user_id: string }).user_id)
      let email = ''
      let phone = ''
      let meta: Record<string, unknown> | undefined
      if (authUid) {
        try {
          const { data, error: auErr } = await supabaseAdmin.auth.admin.getUserById(authUid)
          if (!auErr && data?.user) {
            const u = data.user
            if (u.email) email = String(u.email)
            if (u.phone) phone = String(u.phone)
            meta = u.user_metadata as Record<string, unknown> | undefined
          }
        } catch {
          /* ignore */
        }
      }
      const { first, last } = namesFromAuthAndProfileForShippingCsv(
        meta,
        prof?.display_name ?? null,
        prof?.first_name ?? null,
      )
      rows.push(
        [
          csvCell(first),
          csvCell(last),
          csvCell(email),
          csvCell(prof?.shipping_address_line1),
          csvCell(prof?.shipping_address_line2),
          csvCell(prof?.shipping_city),
          csvCell(prof?.shipping_region),
          csvCell(prof?.shipping_postal_code),
          csvCell(prof?.shipping_country),
          csvCell(phone),
        ].join(','),
      )
    }

    const csv = rows.join('\n') + '\n'
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${slug}-confirmed-shipping.csv"`,
      },
    })
  } catch (e: any) {
    console.error('[admin/cohorts/export]', e)
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 })
  }
}
