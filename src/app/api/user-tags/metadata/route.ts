import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function normalizeTag(tag: string): string {
  try {
    return String(tag || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '')
  } catch {
    return ''
  }
}

type Section = 'food' | 'activity' | 'environment' | 'other'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const body = await req.json()
    const rawTag: string = body?.tag
    const section: Section = body?.section || 'other'
    const tag_slug = normalizeTag(rawTag)
    if (!tag_slug) return NextResponse.json({ error: 'Missing tag' }, { status: 400 })

    // Upsert metadata row (requires table user_tag_metadata)
    const { error } = await supabase
      .from('user_tag_metadata')
      .upsert({
        user_id: user.id,
        tag_slug,
        section,
        created_at: new Date().toISOString(),
      }, { onConflict: 'user_id,tag_slug' })

    if (error) {
      // If table does not exist or other error, return a soft failure so UX can continue
      return NextResponse.json({ success: false, error: error.message })
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Failed' }, { status: 500 })
  }
}


