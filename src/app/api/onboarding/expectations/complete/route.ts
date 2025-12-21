import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile, error: pErr } = await supabase
      .from('profiles')
      .select('id, expectations_onboarding_completed')
      .eq('user_id', user.id)
      .maybeSingle()
    if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 })
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    if ((profile as any).expectations_onboarding_completed === true) {
      const res = NextResponse.json({ ok: true })
      res.cookies.set('expectations_onboarding_completed', 'true', { path: '/', maxAge: 60 * 60 * 24 * 365 })
      return res
    }

    const { error: uErr } = await supabase
      .from('profiles')
      .update({ expectations_onboarding_completed: true })
      .eq('id', (profile as any).id)
    if (uErr) {
      // Even if DB update fails (e.g., column missing), set a cookie to allow progress
      const res = NextResponse.json({ ok: true, note: 'cookie-set-fallback' })
      res.cookies.set('expectations_onboarding_completed', 'true', { path: '/', maxAge: 60 * 60 * 24 * 365 })
      return res
    }

    const res = NextResponse.json({ ok: true })
    res.cookies.set('expectations_onboarding_completed', 'true', { path: '/', maxAge: 60 * 60 * 24 * 365 })
    return res
  } catch (e: any) {
    // On unexpected error, still set cookie to avoid blocking the user
    const res = NextResponse.json({ ok: true, note: 'cookie-set-fallback-error' })
    res.cookies.set('expectations_onboarding_completed', 'true', { path: '/', maxAge: 60 * 60 * 24 * 365 })
    return res
  }
}


