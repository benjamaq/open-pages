import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile, error: pErr } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()
    if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 })
    if (!profile) {
      const res404 = NextResponse.json({ error: 'Profile not found' }, { status: 404 })
      res404.cookies.set('context_education_completed', 'true', { path: '/', maxAge: 60 * 60 * 24 * 365 })
      return res404
    }

    // Try to update DB flag if column exists; if not, fall back to cookie
    let updated = false
    try {
      const { error: uErr } = await supabase
        .from('profiles')
        .update({ context_education_completed: true })
        .eq('id', (profile as any).id)
      if (!uErr) {
        updated = true
      } else if (!/does not exist/i.test(String(uErr.message || ''))) {
        return NextResponse.json({ error: uErr.message }, { status: 500 })
      }
    } catch {
      // ignore and fall back to cookie
    }
    const store = await cookies()
    store.set('context_education_completed', 'true', { path: '/', maxAge: 60 * 60 * 24 * 365 })
    return NextResponse.json({ ok: true, source: updated ? 'db' : 'cookie' })
  } catch (e: any) {
    const res = NextResponse.json({ ok: true, note: 'cookie-set-fallback-error' })
    res.cookies.set('context_education_completed', 'true', { path: '/', maxAge: 60 * 60 * 24 * 365 })
    return res
  }
}


