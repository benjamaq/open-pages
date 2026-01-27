import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Look up profile to get profile_id for related tables
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    const profileId = (profile as any)?.id as string | undefined

    // Best-effort cleanup in application tables; ignore individual failures
    const tryDelete = async (table: string, filter: { col: string; val: any }) => {
      try {
        await supabase.from(table).delete().eq(filter.col, filter.val)
      } catch (e) {
        // swallow errors to avoid blocking user deletion
        console.warn(`[account/delete] delete ${table} failed:`, (e as any)?.message || e)
      }
    }

    // User-scoped tables
    await tryDelete('daily_entries', { col: 'user_id', val: user.id })
    await tryDelete('user_supplement', { col: 'user_id', val: user.id })
    await tryDelete('supplement_truth_reports', { col: 'user_id', val: user.id })
    await tryDelete('pattern_insights', { col: 'user_id', val: user.id })
    await tryDelete('user_supplement_effect', { col: 'user_id', val: user.id })
    await tryDelete('email_sends', { col: 'user_id', val: user.id })
    await tryDelete('notification_preferences', { col: 'user_id', val: user.id })
    await tryDelete('checkin', { col: 'user_id', val: user.id })

    // Profile-scoped tables (e.g., stack items)
    if (profileId) {
      await tryDelete('stack_items', { col: 'profile_id', val: profileId })
    }

    // Finally remove profile and the auth user
    if (profileId) {
      await tryDelete('profiles', { col: 'id', val: profileId })
    }

    // Delete auth user via service role
    try {
      await supabaseAdmin.auth.admin.deleteUser(user.id)
    } catch (e) {
      console.warn('[account/delete] auth deleteUser failed:', (e as any)?.message || e)
      // Even if this fails, we still return success to the client to avoid trapping them
    }

    // Clear auth cookie client-side by instructing redirect
    const res = NextResponse.json({ ok: true })
    res.headers.set('Cache-Control', 'no-store')
    return res
  } catch (err: any) {
    console.error('[account/delete] error:', err?.message || err)
    return NextResponse.json({ error: 'Delete failed', details: err?.message || 'unknown_error' }, { status: 500 })
  }
}


