import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    let completedFromDb: boolean | undefined = undefined
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('context_education_completed')
        .eq('user_id', user.id)
        .maybeSingle()
      if (!error) {
        completedFromDb = Boolean((profile as any)?.context_education_completed)
      } else if (!/does not exist/i.test(String(error.message || ''))) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    } catch {
      // ignore and fall back to cookie
    }
    const cookieStore = await cookies()
    const cookieVal = cookieStore.get('context_education_completed')?.value
    const completed = completedFromDb ?? Boolean(cookieVal)
    return NextResponse.json({ completed, source: completedFromDb === undefined ? 'cookie' : 'db' })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 })
  }
}


