import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const { data, error } = await supabase
      .from('user_supplement_effect')
      .select('*')
      .eq('user_id', user.id)
      .eq('user_supplement_id', id)
      .maybeSingle()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const category = (data as any).effect_category || 'needs_more_data'
    const direction = (data as any).effect_direction || 'neutral'
    const magnitude = Number((data as any).effect_magnitude || 0)
    const confidence = Number((data as any).effect_confidence || 0)
    const analysis_mode = (data as any).analysis_mode || 'auto'

    return NextResponse.json({
      category,
      direction,
      magnitude,
      confidence,
      analysis_mode,
      explainer: undefined
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}


