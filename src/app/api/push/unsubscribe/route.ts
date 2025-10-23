import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(_req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
      const { error } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', user.id)

      if (error) {
        if (error.message?.includes('relation') || error.message?.includes('table')) {
          return NextResponse.json({ ok: true, note: 'push_subscriptions table missing; nothing to delete' })
        }
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    } catch (err: any) {
      if (err?.message?.includes('relation') || err?.message?.includes('table')) {
        return NextResponse.json({ ok: true, note: 'push_subscriptions table missing; nothing to delete' })
      }
      throw err
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}


