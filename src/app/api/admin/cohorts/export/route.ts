import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

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

function namesFromAuthAndProfile(
  meta: Record<string, unknown> | null | undefined,
  displayName: string | null | undefined,
): { first: string; last: string } {
  const m = meta || {}
  const metaFirst = typeof m.first_name === 'string' ? m.first_name.trim() : ''
  const metaLast = typeof m.last_name === 'string' ? m.last_name.trim() : ''
  if (metaFirst || metaLast) return { first: metaFirst, last: metaLast }
  const combined =
    (typeof m.name === 'string' ? m.name.trim() : '') ||
    (displayName != null ? String(displayName).trim() : '')
  if (!combined) return { first: '', last: '' }
  const parts = combined.split(/\s+/).filter(Boolean)
  if (parts.length === 1) return { first: parts[0], last: '' }
  return { first: parts[0], last: parts.slice(1).join(' ') }
}

function adminDenied(req: NextRequest): NextResponse | null {
  if (process.env.NODE_ENV !== 'production') return null
  const key = req.headers.get('x-admin-key')
  if (!key || key !== process.env.ADMIN_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return null
}

/** GET /api/admin/cohorts/export?cohort_uuid= — CSV shipping list for confirmed participants */
export async function GET(request: NextRequest) {
  const denied = adminDenied(request)
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

    const profileIds = list.map((p: { user_id: string }) => p.user_id)
    const { data: profs, error: profErr } = await supabaseAdmin
      .from('profiles')
      .select(
        'id, display_name, user_id, shipping_address_line1, shipping_address_line2, shipping_city, shipping_region, shipping_postal_code, shipping_country',
      )
      .in('id', profileIds)

    if (profErr) {
      return NextResponse.json({ error: profErr.message }, { status: 500 })
    }

    type ProfileRow = {
      display_name: string | null
      user_id: string
      shipping_address_line1?: string | null
      shipping_address_line2?: string | null
      shipping_city?: string | null
      shipping_region?: string | null
      shipping_postal_code?: string | null
      shipping_country?: string | null
    }
    const profById = Object.fromEntries((profs || []).map((r: ProfileRow & { id: string }) => [r.id, r]))

    const rows: string[] = [headerRow]
    for (const p of list) {
      const prof = profById[(p as { user_id: string }).user_id] as ProfileRow | undefined
      let email = ''
      let phone = ''
      let meta: Record<string, unknown> | undefined
      if (prof?.user_id) {
        try {
          const { data, error: auErr } = await supabaseAdmin.auth.admin.getUserById(prof.user_id)
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
      const { first, last } = namesFromAuthAndProfile(meta, prof?.display_name ?? null)
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
