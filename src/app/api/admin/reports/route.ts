import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * GET /api/admin/reports
 *
 * Query params:
 * - cohort_id: optional — filter participants by cohort
 * - date_from: optional ISO date — filter daily_entries by local_date >=
 * - date_to: optional ISO date — filter daily_entries by local_date <=
 *
 * Returns:
 * - cohortIds: distinct cohort_ids from profiles (for dropdown)
 * - participantCount: number of profiles with selected cohort
 * - participants: array of { user_id, display_name, days_completed, first_entry, last_entry }
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const cohortId = searchParams.get('cohort_id')?.trim() || null
    const dateFrom = searchParams.get('date_from')?.trim() || null
    const dateTo = searchParams.get('date_to')?.trim() || null

    // 1. Get distinct cohort_ids for dropdown
    const { data: cohortRows, error: cohortErr } = await supabaseAdmin
      .from('profiles')
      .select('cohort_id')
      .not('cohort_id', 'is', null)

    if (cohortErr) {
      console.error('[admin/reports] cohort_ids error:', cohortErr)
      return NextResponse.json({ error: 'Failed to fetch cohort IDs' }, { status: 500 })
    }

    const cohortIds = [...new Set((cohortRows || []).map((r: { cohort_id: string }) => r.cohort_id).filter(Boolean))].sort()

    // 2. If no cohort selected, return just cohort list
    if (!cohortId) {
      return NextResponse.json({
        cohortIds,
        participantCount: 0,
        participants: [],
      })
    }

    // 3. Get profiles for this cohort
    let profilesQuery = supabaseAdmin
      .from('profiles')
      .select('user_id, display_name')
      .eq('cohort_id', cohortId)

    const { data: profiles, error: profilesErr } = await profilesQuery

    if (profilesErr) {
      console.error('[admin/reports] profiles error:', profilesErr)
      return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 })
    }

    if (!profiles?.length) {
      return NextResponse.json({
        cohortIds,
        participantCount: 0,
        participants: [],
      })
    }

    const userIds = profiles.map((p: { user_id: string }) => p.user_id)
    const profileByUser = Object.fromEntries(profiles.map((p: { user_id: string; display_name: string }) => [p.user_id, p.display_name]))

    // 4. Count daily_entries per user (optionally filtered by date range)
    const { data: entries } = await supabaseAdmin
      .from('daily_entries')
      .select('user_id, local_date')
      .in('user_id', userIds)

    let filteredEntries = entries || []
    if (dateFrom) {
      const from = new Date(dateFrom).toISOString().slice(0, 10)
      filteredEntries = filteredEntries.filter((e: { local_date: string }) => String(e.local_date).slice(0, 10) >= from)
    }
    if (dateTo) {
      const to = new Date(dateTo).toISOString().slice(0, 10)
      filteredEntries = filteredEntries.filter((e: { local_date: string }) => String(e.local_date).slice(0, 10) <= to)
    }

    const daysByUser: Record<string, { count: number; dates: string[] }> = {}
    for (const e of filteredEntries) {
      const uid = e.user_id
      if (!daysByUser[uid]) daysByUser[uid] = { count: 0, dates: [] }
      daysByUser[uid].count++
      daysByUser[uid].dates.push(String(e.local_date).slice(0, 10))
    }

    const participants = userIds.map((uid) => {
      const d = daysByUser[uid] || { count: 0, dates: [] }
      const sorted = [...d.dates].sort()
      return {
        user_id: uid,
        display_name: profileByUser[uid] || null,
        days_completed: d.count,
        first_entry: sorted[0] || null,
        last_entry: sorted[sorted.length - 1] || null,
      }
    })

    // Sort by days_completed desc
    participants.sort((a, b) => b.days_completed - a.days_completed)

    return NextResponse.json({
      cohortIds,
      participantCount: participants.length,
      participants,
    })
  } catch (err) {
    console.error('[admin/reports] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
