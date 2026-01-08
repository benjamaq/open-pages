import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

/**
 * Backfill daily_entries from legacy `checkin` rows.
 *
 * POST /api/admin/backfill/daily-entries?dryRun=1&userId=<uuid>
 *
 * Query params:
 * - dryRun: "1" (default) to simulate and report what would be written; "0" to actually write.
 * - userId: optional, limit to a single user. If omitted, processes all users (all rows in `profiles`).
 *
 * Security: This endpoint uses the service role client and performs writes across users.
 * Protect behind network rules or add your own auth (e.g., header token) in production.
 */
export async function POST(req: NextRequest) {
  const url = new URL(req.url)
  const dryRun = (url.searchParams.get('dryRun') ?? '1') !== '0'
  const onlyUserId = url.searchParams.get('userId') || undefined

  try {
    // Determine which users to process via profiles (source of truth for user_id)
    const { data: profiles, error: pErr } = await supabaseAdmin
      .from('profiles')
      .select('id,user_id')
      .order('id')
    if (pErr) {
      return NextResponse.json({ ok: false, error: `profiles query failed: ${pErr.message}` }, { status: 500 })
    }
    const targetUsers = (profiles || [])
      .map((p: any) => String(p.user_id))
      .filter((id) => !!id)
      .filter((id) => (onlyUserId ? id === onlyUserId : true))

    const results: Array<{
      userId: string
      checkinsFound: number
      existingDailyEntries: number
      toInsert: number
      inserted?: number
      error?: string
    }> = []

    for (const userId of targetUsers) {
      try {
        // Fetch legacy checkins for the user
        const { data: checkins, error: cErr } = await supabaseAdmin
          .from('checkin')
          .select('id, user_id, created_at, day, mood, energy, focus, intense_overtraining, new_supplement')
          .eq('user_id', userId)
        if (cErr) {
          results.push({ userId, checkinsFound: 0, existingDailyEntries: 0, toInsert: 0, error: `checkin query failed: ${cErr.message}` })
          continue
        }

        const allDates = new Set<string>()
        for (const c of checkins || []) {
          const key = (c.day ? String(c.day) : String(c.created_at)).slice(0, 10)
          if (key) allDates.add(key)
        }

        // Find which daily_entries already exist for those dates
        const dateList = Array.from(allDates)
        let existingDates = new Set<string>()
        if (dateList.length > 0) {
          const { data: existing, error: eErr } = await supabaseAdmin
            .from('daily_entries')
            .select('local_date')
            .eq('user_id', userId)
            .in('local_date', dateList)
          if (eErr) {
            results.push({ userId, checkinsFound: checkins?.length || 0, existingDailyEntries: 0, toInsert: 0, error: `daily_entries query failed: ${eErr.message}` })
            continue
          }
          existingDates = new Set((existing || []).map((r: any) => String(r.local_date).slice(0, 10)))
        }

        // Build default supplement_intake map for active user_supplement rows
        const { data: us } = await supabaseAdmin
          .from('user_supplement')
          .select('id')
          .eq('user_id', userId)
          .or('is_active.eq.true,is_active.is.null')
        const defaultIntake: Record<string, string> = {}
        for (const row of (us || [])) {
          const sid = String((row as any).id)
          if (sid) {
            defaultIntake[sid] = 'taken'
          }
        }

        const toInsert = []
        for (const c of checkins || []) {
          const key = (c.day ? String(c.day) : String(c.created_at)).slice(0, 10)
          if (!key || existingDates.has(key)) continue
          const row: any = {
            user_id: userId,
            local_date: key,
            mood: c.mood ?? null,
            energy: c.energy ?? null,
            focus: c.focus ?? null,
            // carry forward "clean day" as null tags; if you need old tags mapping, augment here
            tags: null,
            // default all active supplements to taken for that day; skipped_supplements left null
            supplement_intake: Object.keys(defaultIntake).length ? defaultIntake : null
          }
          toInsert.push(row)
        }

        let wrote = 0
        if (!dryRun && toInsert.length > 0) {
          const { error: insErr, count } = await supabaseAdmin
            .from('daily_entries')
            .upsert(toInsert, { onConflict: 'user_id,local_date', ignoreDuplicates: true, count: 'exact' })
          if (insErr) {
            results.push({
              userId,
              checkinsFound: checkins?.length || 0,
              existingDailyEntries: existingDates.size,
              toInsert: toInsert.length,
              error: `upsert failed: ${insErr.message}`
            })
            continue
          }
          wrote = (count as number) ?? toInsert.length
        }

        results.push({
          userId,
          checkinsFound: checkins?.length || 0,
          existingDailyEntries: existingDates.size,
          toInsert: toInsert.length,
          ...(dryRun ? {} : { inserted: wrote })
        })
      } catch (e: any) {
        results.push({ userId, checkinsFound: 0, existingDailyEntries: 0, toInsert: 0, error: e?.message || String(e) })
      }
    }

    return NextResponse.json({ ok: true, dryRun, processed: results.length, results })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}


