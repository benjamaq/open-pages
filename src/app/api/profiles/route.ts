import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

function toSlugBase(input: string) {
  const base = (input || '').trim().toLowerCase()
  const cleaned = base
    .replace(/@.*$/, '') // strip domain if email
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return cleaned || 'user'
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const user_id = String(body?.user_id || '').trim()
    const name = String(body?.name || '').trim()
    const email = typeof body?.email === 'string' ? body.email : ''

    if (!user_id) {
      return NextResponse.json({ error: 'user_id required' }, { status: 400 })
    }

    // If profile already exists, no-op
    try {
      const { data: existing } = await supabaseAdmin
        .from('profiles')
        .select('id, slug')
        .eq('user_id', user_id)
        .maybeSingle()
      if (existing) {
        return NextResponse.json({ ok: true, id: existing.id, slug: (existing as any).slug })
      }
    } catch {}

    // Generate a unique slug
    const base = toSlugBase(name || email)
    let candidate = base
    // ensure uniqueness with up to 5 attempts
    for (let i = 0; i < 5; i++) {
      const { data: clash } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('slug', candidate)
        .maybeSingle()
      if (!clash) break
      // append short suffix
      const suffix = Math.random().toString(36).slice(2, 7)
      candidate = `${base}-${suffix}`
    }

    const now = new Date().toISOString()
    const firstName = (name || '').split(' ')[0] || null

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .insert({
        user_id,
        first_name: firstName,
        display_name: name || firstName || (email ? email.split('@')[0] : 'User'),
        slug: candidate,
        public: true,
        allow_stack_follow: true,
        created_at: now,
        updated_at: now
      })
      .select('id, slug')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, id: data?.id, slug: (data as any)?.slug })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to create profile' }, { status: 500 })
  }
}


