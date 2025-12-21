import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile, error: pErr } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()
    if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 })
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    // Fetch single pattern insight for this intervention_id
    const { data, error } = await supabase
      .from('pattern_insights')
      .select(`
        intervention_id,
        effect_size,
        confidence_score,
        status,
        sample_size,
        pre_mean,
        post_mean,
        created_at,
        stack_items:intervention_id (
          id,
          name,
          monthly_cost,
          start_date
        )
      `)
      .eq('profile_id', (profile as any).id)
      .eq('intervention_id', params.id)
      .maybeSingle()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const result = {
      id: (data as any).intervention_id as string,
      name: (data as any).stack_items?.name ?? 'Supplement',
      monthly_cost: (data as any).stack_items?.monthly_cost ?? null,
      start_date: (data as any).stack_items?.start_date ?? null,
      effect_size: Number((data as any).effect_size ?? 0),
      confidence_score: Number((data as any).confidence_score ?? 0),
      status: String((data as any).status ?? 'inconclusive'),
      sample_size: Number((data as any).sample_size ?? 0),
      pre_mean: (data as any).pre_mean,
      post_mean: (data as any).post_mean,
      created_at: (data as any).created_at
    }

    return NextResponse.json(result)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}


