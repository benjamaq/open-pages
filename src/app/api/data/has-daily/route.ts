import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ hasData: false }, { status: 200 })
  const { count, error } = await supabase
    .from('daily_entries')
    // Some deployments use (user_id, local_date) as PK and have no `id` column.
    // Selecting `local_date` keeps this count query schema-safe.
    .select('local_date', { count: 'exact', head: true })
    .eq('user_id', user.id)
  if (error) return NextResponse.json({ hasData: false }, { status: 200 })
  // Wearable days: number of entries that include any wearables payload
  const { count: wearableDays = 0 } = await supabase
    .from('daily_entries')
    .select('local_date', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .not('wearables', 'is', null)
  return NextResponse.json({
    hasData: (count || 0) > 0,
    hasWearables: (wearableDays || 0) > 0,
    wearableDays: wearableDays || 0
  })
}


