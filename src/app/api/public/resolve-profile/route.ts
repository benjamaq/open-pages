import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')
    if (!slug) return NextResponse.json({ error: 'Missing slug' }, { status: 400 })

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('slug', slug)
      .single()

    if (error || !data) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    return NextResponse.json({ user_id: (data as any).user_id })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}


