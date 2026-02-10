import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    let firstName: string | null = null
    let email: string | null = null
    let userId: string | null = null

    if (!authError && user) {
      email = user.email || null
      userId = user.id
    } else {
      // Fallback: try to read auth token from Supabase client cookie
      try {
        const all = (await cookies()).getAll()
        const tokenCookie = all.find(c => c.name.startsWith('sb-') && c.name.endsWith('-auth-token'))
        if (tokenCookie?.value) {
          const parsed = JSON.parse(tokenCookie.value)
          email = parsed?.user?.email || parsed?.email || null
          userId = parsed?.user?.id || parsed?.user?.sub || null
        }
      } catch {}
      // Fallback: allow client to send localStorage token via header
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
      // Try common profile columns
      if (userId) {
        // Attempt primary profiles table first
        const { data: prof } = await supabase
          .from('profiles')
          .select('first_name, display_name, full_name')
          .eq('user_id', userId)
          .maybeSingle()
        const fromProfiles =
          (prof as any)?.first_name ||
          (prof as any)?.display_name ||
          ((prof as any)?.full_name ? String((prof as any)?.full_name).split(' ')[0] : null)
        if (fromProfiles) firstName = String(fromProfiles)
        // Fallback legacy app_user table
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
      userId
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 })
  }
}


