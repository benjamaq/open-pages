import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Fetch the most recent entry by local_date (falls back to created_at if needed)
    const { data, error } = await supabase
      .from('daily_entries')
      .select('local_date, tags')
      .eq('user_id', user.id)
      .order('local_date', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows found
      // If table missing or other error, return empty gracefully
      return NextResponse.json({ previous_tags: [], previous_entry_date: null })
    }

    const previous_tags: string[] = Array.isArray((data as any)?.tags) ? (((data as any).tags as string[])) : []
    const previous_entry_date: string | null = (data as any)?.local_date || null

    return NextResponse.json({ previous_tags, previous_entry_date })
  } catch (e) {
    return NextResponse.json({ previous_tags: [], previous_entry_date: null })
  }
}


