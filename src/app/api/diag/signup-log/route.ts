import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(()=>({})) as any
    const entry = {
      ts: new Date().toISOString(),
      phase: body?.phase || 'unknown',
      mode: body?.mode || 'unknown',
      email: typeof body?.email === 'string' ? body.email : undefined,
      userAgent: req.headers.get('user-agent') || body?.userAgent,
      referrer: req.headers.get('referer') || body?.referrer,
      isInApp: !!body?.isInApp,
      viewport: body?.viewport || null,
      error: body?.error || null,
    }

    // Log to server logs for immediate visibility
    console.log('[SignupDiag]', entry)

    // Attempt to persist (optional)
    try {
      const supabase = await createClient()
      await supabase
        .from('signup_diagnostics')
        .insert({
          phase: entry.phase,
          mode: entry.mode,
          email: entry.email,
          user_agent: entry.userAgent,
          referrer: entry.referrer,
          is_in_app: entry.isInApp,
          viewport: entry.viewport,
          error_message: entry.error,
          created_at: entry.ts,
        })
    } catch (e: any) {
      // Table might not exist; ignore
      if (!String(e?.message || '').includes('relation')) console.warn('[SignupDiag] persist failed', e?.message)
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}


