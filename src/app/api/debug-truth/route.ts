import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await createClient()
  const userId = '07321922-7821-4c2c-985a-570dd1a4038c'
  const userSupplementId = '140c30c0-6e9c-43e5-80e1-e6de77f2a8f7'
  
  const { data: rows, error } = await supabase
    .from('daily_entries')
    .select('local_date, energy, supplement_intake')
    .eq('user_id', userId)
    .order('local_date', { ascending: false })
    .limit(10)
  
  const parsed = (rows || []).map((r: any) => ({
    date: r.local_date,
    energy: r.energy,
    bpcValue: (r.supplement_intake || {})[userSupplementId] || 'NOT_FOUND'
  }))
  
  return NextResponse.json({
    error: (error as any)?.message || null,
    rowCount: (rows || []).length,
    parsed
  })
}




