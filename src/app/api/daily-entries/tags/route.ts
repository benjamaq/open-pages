import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type Body = {
  tag: string
  taken: boolean
  local_date?: string // YYYY-MM-DD; optional (defaults to today)
}

function normalizeTag(tag: string): string {
  return (tag || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const body = (await req.json()) as Body
    const tag = normalizeTag(body.tag)
    if (!tag) return NextResponse.json({ error: 'Missing tag' }, { status: 400 })

    const today = new Date().toISOString().split('T')[0]
    const localDate = body.local_date || today

    // Fetch or create the daily_entries row for this user/date
    const { data: existing, error: selErr } = await supabase
      .from('daily_entries')
      .select('id, tags')
      .eq('user_id', user.id)
      .eq('local_date', localDate)
      .maybeSingle()

    let entryId = (existing as any)?.id as string | undefined
    let tags: string[] = Array.isArray((existing as any)?.tags) ? ((existing as any).tags as string[]) : []

    if (!entryId) {
      // Create the entry if it doesn't exist
      const { data: inserted, error: insErr } = await (supabase as any)
        .from('daily_entries')
        .insert({ user_id: user.id, local_date: localDate, tags: [] } as any)
        .select('id, tags')
        .single()
      if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 })
      entryId = (inserted as any)!.id
      tags = (inserted as any)!.tags || []
    }

    // Add or remove the tag
    const has = tags.includes(tag)
    const nextTags = body.taken ? (has ? tags : [...tags, tag]) : (has ? tags.filter(t => t !== tag) : tags)

    const { error: updErr } = await (supabase as any)
      .from('daily_entries')
      .update({ tags: nextTags } as any)
      .eq('id', entryId!)

    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 })

    return NextResponse.json({ success: true, local_date: localDate, tags: nextTags })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}


