import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: Request) {
  // DIAGNOSTIC: Log that the endpoint was hit
  try { console.log('[wearable-status] === ENDPOINT HIT ===') } catch {}
  try {
    const supabase = await createClient()
    
    // DIAGNOSTIC: Check auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    try {
      console.log('[wearable-status] Auth result:', { 
        hasUser: !!user, 
        userId: user?.id || 'NO USER',
        authError: authError?.message || 'none'
      })
    } catch {}
    
    if (!user) {
      try { console.log('[wearable-status] No user - returning false') } catch {}
      return NextResponse.json({ 
        wearable_connected: false,
        debug_reason: 'no_authenticated_user'
      })
    }

    // DIAGNOSTIC: Run the exact query and log everything
    try { console.log('[wearable-status] Querying daily_entries for user:', user.id) } catch {}
    
    const { data, error, count } = await supabase
      .from('daily_entries')
      .select('local_date, wearables', { count: 'exact' })
      .eq('user_id', user.id)
      .not('wearables', 'is', null)
      .order('local_date', { ascending: true })

    try {
      console.log('[wearable-status] Query result:', {
        error: error?.message || 'none',
        errorDetails: (error as any)?.details || 'none',
        errorHint: (error as any)?.hint || 'none',
        rowCount: data?.length || 0,
        exactCount: count,
        firstRow: data?.[0] || 'NO DATA',
        lastRow: data?.[data?.length - 1] || 'NO DATA'
      })
    } catch {}

    if (error) {
      try { console.error('[wearable-status] Query error:', error) } catch {}
      return NextResponse.json({ 
        wearable_connected: false,
        debug_reason: 'query_error',
        debug_error: error.message
      })
    }

    const rowCount = data?.length || 0
    try { console.log('[wearable-status] Final count:', rowCount) } catch {}

    if (rowCount === 0) {
      // DIAGNOSTIC: Check if ANY rows exist for this user (without wearables filter)
      const { count: totalRows } = await supabase
        .from('daily_entries')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
      
      try { console.log('[wearable-status] Total rows for user (no filter):', totalRows) } catch {}
      
      // DIAGNOSTIC: Check what's in wearables column
      const { data: sampleRows } = await supabase
        .from('daily_entries')
        .select('local_date, wearables')
        .eq('user_id', user.id)
        .limit(3)
      
      try { console.log('[wearable-status] Sample rows:', JSON.stringify(sampleRows, null, 2)) } catch {}
      
      return NextResponse.json({ 
        wearable_connected: false,
        debug_reason: 'zero_wearable_rows',
        debug_total_rows: totalRows,
        debug_sample: sampleRows
      })
    }

    // Success case
    const minDate = (data as any)[0].local_date
    const maxDate = (data as any)[rowCount - 1].local_date

    // Get sources
    const sources = new Set<string>()
    for (const row of (data as any)) {
      if ((row as any)?.wearables?.source) {
        sources.add(String((row as any).wearables.source))
      }
    }

    const response = {
      wearable_connected: true,
      wearable_days_imported: rowCount,
      wearable_sources: Array.from(sources),
      wearable_date_range_start: minDate,
      wearable_date_range_end: maxDate,
      debug_user_id: user.id
    }
    
    try { console.log('[wearable-status] Success response:', response) } catch {}
    return NextResponse.json(response)

  } catch (e: any) {
    try { console.error('[wearable-status] Unexpected error:', e) } catch {}
    return NextResponse.json({ 
      wearable_connected: false,
      debug_reason: 'exception',
      debug_error: e?.message 
    })
  }
}


