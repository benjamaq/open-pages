import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

function adminDenied(req: NextRequest): NextResponse | null {
  if (process.env.NODE_ENV !== 'production') return null
  const key = req.headers.get('x-admin-key')
  if (!key || key !== process.env.ADMIN_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return null
}

/** GET /api/admin/cohorts/export?cohort_uuid= — CSV name,email for confirmed participants */
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
    if (list.length === 0) {
      const empty = 'name,email\n'
      return new NextResponse(empty, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${slug}-confirmed.csv"`,
        },
      })
    }

    const profileIds = list.map((p: { user_id: string }) => p.user_id)
    const { data: profs, error: profErr } = await supabaseAdmin
      .from('profiles')
      .select('id, display_name, user_id')
      .in('id', profileIds)

    if (profErr) {
      return NextResponse.json({ error: profErr.message }, { status: 500 })
    }

    const profById = Object.fromEntries((profs || []).map((r: any) => [r.id, r]))

    const rows: string[] = ['name,email']
    for (const p of list) {
      const prof = profById[(p as { user_id: string }).user_id] as { display_name: string | null; user_id: string } | undefined
      let email = ''
      if (prof?.user_id) {
        try {
          const { data, error: auErr } = await supabaseAdmin.auth.admin.getUserById(prof.user_id)
          if (!auErr && data?.user?.email) email = String(data.user.email)
        } catch {
          /* ignore */
        }
      }
      const name = (prof?.display_name || '').replace(/"/g, '""')
      const em = email.replace(/"/g, '""')
      rows.push(`"${name}","${em}"`)
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
