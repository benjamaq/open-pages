import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile, error: pErr } = await supabase
      .from('profiles')
      .select('id, context_education_completed')
      .eq('user_id', user.id)
      .maybeSingle()
    if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 })
    if (!profile) {
      const res404 = NextResponse.json({ error: 'Profile not found' }, { status: 404 })
      res404.cookies.set('context_education_completed', 'true', { path: '/', maxAge: 60 * 60 * 24 * 365 })
      return res404
    }

    if ((profile as any).context_education_completed === true) {
      const res = NextResponse.json({ ok: true })
      res.cookies.set('context_education_completed', 'true', { path: '/', maxAge: 60 * 60 * 24 * 365 })
      return res
    }

    const { error: uErr } = await supabase
      .from('profiles')
      .update({ context_education_completed: true })
      .eq('id', (profile as any).id)
    if (uErr) {
      const res = NextResponse.json({ ok: true, note: 'cookie-set-fallback' })
      res.cookies.set('context_education_completed', 'true', { path: '/', maxAge: 60 * 60 * 24 * 365 })
      return res
    }

    const res = NextResponse.json({ ok: true })
    res.cookies.set('context_education_completed', 'true', { path: '/', maxAge: 60 * 60 * 24 * 365 })
    return res
  } catch (e: any) {
    const res = NextResponse.json({ ok: true, note: 'cookie-set-fallback-error' })
    res.cookies.set('context_education_completed', 'true', { path: '/', maxAge: 60 * 60 * 24 * 365 })
    return res
  }
}


