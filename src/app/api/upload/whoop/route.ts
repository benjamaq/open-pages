/**
 * MINIMAL WHOOP UPLOAD ROUTE
 * 
 * Put this at: src/app/api/upload/whoop/route.ts
 * 
 * Test URL: POST /api/upload/whoop
 * 
 * This is a standalone route - no dependencies on other parsers.
 * I tested this exact parsing logic against Ben's actual Whoop files.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import JSZip from 'jszip'

// ============================================
// PARSING HELPERS - TESTED AND WORKING
// ============================================

function parseCSV(text: string): string[][] {
  const lines = text.trim().split('\n')
  return lines.map(line => {
    const result: string[] = []
    let current = ''
    let inQuotes = false
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    result.push(current.trim())
    return result
  })
}

function norm(s: string): string {
  return String(s || '').replace(/^\uFEFF/, '').trim().toLowerCase().replace(/^"+|"+$/g, '')
}

function idxOf(h: string[], candidates: string[]): number {
  const H = h.map(norm)
  for (const cand of candidates) {
    const j = H.indexOf(norm(cand))
    if (j !== -1) return j
  }
  return -1
}

function toDate(dateStr: string): string {
  // "2025-09-12 22:43:24" -> "2025-09-12"
  if (!dateStr || dateStr.length < 10) return ''
  return dateStr.substring(0, 10)
}

function toNum(val: string): number | null {
  if (!val || val.trim() === '') return null
  const n = parseFloat(val)
  return isNaN(n) ? null : n
}

// ============================================
// FILE TYPE DETECTION
// ============================================

type WhoopType = 'sleeps' | 'physiological' | 'journal' | 'workouts' | 'unknown'

function detectFileType(firstLine: string): WhoopType {
  // Normalize header: strip BOM, trim, lowercase, remove quotes
  const header = firstLine.replace(/^\uFEFF/, '').trim().toLowerCase().replace(/"/g, '')
  // Must contain cycle start time somewhere in header row to be a WHOOP CSV
  if (!header.includes('cycle start time')) return 'unknown'
  // Decide specific WHOOP file type by distinctive column names
  if (header.includes('question text')) return 'journal'
  if (header.includes('workout start')) return 'workouts'
  if (header.includes('recovery score')) return 'physiological'
  if (header.includes('sleep performance')) return 'sleeps'
  // Default to sleeps if it's clearly a WHOOP CSV but unknown variant
  return 'sleeps'
}

// ============================================
// PARSERS FOR EACH FILE TYPE
// ============================================

interface SleepRow {
  date: string
  sleep_performance: number | null
  deep_min: number | null
  rem_min: number | null
  efficiency: number | null
}

function parseSleeps(text: string): SleepRow[] {
  const rows = parseCSV(text)
  if (rows.length < 2) return []
  
  const h = rows[0]
  const iDate = idxOf(h, ['Cycle start time', 'cycle start time'])
  const iPerf = idxOf(h, ['Sleep performance %', 'sleep performance %'])
  const iDeep = idxOf(h, ['Deep (SWS) duration (min)', 'deep (sws) duration (min)', 'deep sleep (min)', 'deep minutes'])
  const iRem = idxOf(h, ['REM duration (min)', 'rem duration (min)', 'rem sleep (min)', 'rem minutes'])
  const iEff = idxOf(h, ['Sleep efficiency %', 'sleep efficiency %'])
  
  if (iDate === -1 || iPerf === -1) {
    console.log('[Whoop] sleeps.csv: missing columns. Headers:', h.slice(0, 8))
    return []
  }
  
  const result: SleepRow[] = []
  let totalRows = 0, skippedNoDate = 0
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i]
    totalRows++
    const date = toDate(r[iDate])
    if (!date) { skippedNoDate++; continue }
    
    result.push({
      date,
      sleep_performance: toNum(r[iPerf]),
      deep_min: iDeep >= 0 ? toNum(r[iDeep]) : null,
      rem_min: iRem >= 0 ? toNum(r[iRem]) : null,
      efficiency: iEff >= 0 ? toNum(r[iEff]) : null,
    })
  }
  
  try {
    const uniq = new Set(result.map(r => r.date)).size
    console.log(`[Whoop] sleeps parsed: rows=${totalRows}, kept=${result.length}, unique_dates=${uniq}, skipped_no_date=${skippedNoDate}`)
  } catch {}
  return result
}

interface PhysRow {
  date: string
  recovery: number | null
  hrv: number | null
  rhr: number | null
  strain: number | null
}

function parsePhysiological(text: string): PhysRow[] {
  const rows = parseCSV(text)
  if (rows.length < 2) return []
  
  const h = rows[0]
  const iDate = idxOf(h, ['Cycle start time', 'cycle start time'])
  const iRec = idxOf(h, ['Recovery score %', 'recovery score %'])
  const iHrv = idxOf(h, ['Heart rate variability (ms)', 'heart rate variability (ms)', 'hrv (ms)', 'hrv'])
  const iRhr = idxOf(h, ['Resting heart rate (bpm)', 'resting heart rate (bpm)', 'rhr (bpm)', 'resting heart rate'])
  const iStrain = idxOf(h, ['Day Strain', 'day strain', 'strain'])
  
  if (iDate === -1) {
    console.log('[Whoop] physiological.csv: missing date column')
    return []
  }
  
  const result: PhysRow[] = []
  let totalRows = 0, skippedNoDate = 0, skippedNoMetrics = 0
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i]
    totalRows++
    const date = toDate(r[iDate])
    if (!date) { skippedNoDate++; continue }
    
    // Keep row if at least one metric present (don’t require recovery)
    const recovery = iRec >= 0 ? toNum(r[iRec]) : null
    const hrv = iHrv >= 0 ? toNum(r[iHrv]) : null
    const rhr = iRhr >= 0 ? toNum(r[iRhr]) : null
    const strain = iStrain >= 0 ? toNum(r[iStrain]) : null
    if (recovery === null && hrv === null && rhr === null && strain === null) { skippedNoMetrics++; continue }
    
    result.push({
      date,
      recovery,
      hrv,
      rhr,
      strain,
    })
  }
  
  try {
    const uniq = new Set(result.map(r => r.date)).size
    console.log(`[Whoop] physiological parsed: rows=${totalRows}, kept=${result.length}, unique_dates=${uniq}, skipped_no_date=${skippedNoDate}, skipped_no_metrics=${skippedNoMetrics}`)
  } catch {}
  return result
}

interface JournalRow {
  date: string
  question: string
  yes: boolean
}

function parseJournal(text: string): JournalRow[] {
  const rows = parseCSV(text)
  if (rows.length < 2) return []
  
  const h = rows[0]
  const iDate = idxOf(h, ['Cycle start time', 'cycle start time'])
  const iQ = idxOf(h, ['Question text', 'question text'])
  const iA = idxOf(h, ['Answered yes', 'answered yes', 'answered true'])
  
  if (iDate === -1 || iQ === -1 || iA === -1) {
    console.log('[Whoop] journal.csv: missing columns')
    return []
  }
  
  const result: JournalRow[] = []
  let totalRows = 0, skippedNoDate = 0
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i]
    totalRows++
    const date = toDate(r[iDate])
    if (!date) { skippedNoDate++; continue }
    
    result.push({
      date,
      question: r[iQ] || '',
      yes: r[iA]?.toLowerCase() === 'true',
    })
  }
  
  try {
    const uniq = new Set(result.map(r => r.date)).size
    console.log(`[Whoop] journal parsed: rows=${totalRows}, kept=${result.length}, unique_dates=${uniq}, skipped_no_date=${skippedNoDate}`)
  } catch {}
  return result
}

// ============================================
// MAIN ROUTE HANDLER
// ============================================

export async function POST(request: NextRequest) {
  console.log('[Whoop Upload] Request received')
  
  try {
    // Auth (required for user_id)
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.log('[Whoop Upload] Unauthorized')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    
    console.log('[Whoop Upload] Files received:', files.length)
    
    if (!files || files.length === 0) {
      console.log('[Whoop Upload] No files in request')
      return NextResponse.json({ error: 'No files uploaded' }, { status: 400 })
    }
    
    const results = {
      sleeps: 0,
      physiological: 0,
      journal: 0,
      files_processed: [] as string[],
      errors: [] as string[],
      upserts: 0,
    }
    const sleepRows: SleepRow[] = []
    const physRows: PhysRow[] = []
    
    for (const file of files) {
      console.log(`[Whoop Upload] Processing: ${file.name} (${(file as any)?.size ?? 0} bytes)`)
      const lower = (file.name || '').toLowerCase()
      const isZip = lower.endsWith('.zip')
      const isCsv = lower.endsWith('.csv')
      if (isZip) {
        // Accept WHOOP ZIP export (best UX). Extract CSVs and parse.
        try {
          const buf = await file.arrayBuffer()
          const zip = await JSZip.loadAsync(buf)
          const entries = Object.values(zip.files) as JSZip.JSZipObject[]
          if (!entries.length) {
            results.errors.push(`${file.name}: ZIP is empty`)
            continue
          }
          for (const ent of entries) {
            if (!ent.name.toLowerCase().endsWith('.csv')) continue
            const text = await ent.async('string')
            const firstLine = text.split('\n')[0] || ''
            const fileType = detectFileType(firstLine)
            if (fileType === 'sleeps') {
              const data = parseSleeps(text)
              sleepRows.push(...data)
              results.sleeps += data.length
              results.files_processed.push(`${ent.name}: ${data.length} sleep entries`)
            } else if (fileType === 'physiological') {
              const data = parsePhysiological(text)
              physRows.push(...data)
              results.physiological += data.length
              results.files_processed.push(`${ent.name}: ${data.length} recovery/HRV entries`)
            } else if (fileType === 'journal') {
              const data = parseJournal(text)
              results.journal += data.length
              results.files_processed.push(`${ent.name}: ${data.length} journal entries`)
            } else if (fileType === 'workouts') {
              results.files_processed.push(`${ent.name}: Skipped (workouts not needed)`)
            } else {
              // Ignore unrelated CSVs inside the ZIP
              results.files_processed.push(`${ent.name}: Unrecognized WHOOP CSV — skipped`)
            }
          }
          continue
        } catch (e: any) {
          console.error('[Whoop Upload] ZIP parse failed:', e?.message || e)
          results.errors.push(`${file.name}: Failed to read ZIP`)
          continue
        }
      }
      
      if (isCsv) {
        const text = await file.text()
        if (!text || text.trim().length === 0) {
          results.errors.push(`${file.name}: Empty file`)
          continue
        }
        const firstLine = text.split('\n')[0] || ''
        const fileType = detectFileType(firstLine)
        if (fileType === 'unknown') {
          results.errors.push(`${file.name}: Not a recognized Whoop CSV (first header must be "Cycle start time")`)
          continue
        }
        switch (fileType) {
          case 'sleeps': {
            const data = parseSleeps(text)
            sleepRows.push(...data)
            results.sleeps += data.length
            results.files_processed.push(`${file.name}: ${data.length} sleep entries`)
            break
          }
          case 'physiological': {
            const data = parsePhysiological(text)
            physRows.push(...data)
            results.physiological += data.length
            results.files_processed.push(`${file.name}: ${data.length} recovery/HRV entries`)
            break
          }
          case 'journal': {
            const data = parseJournal(text)
            results.journal += data.length
            results.files_processed.push(`${file.name}: ${data.length} journal entries`)
            break
          }
          case 'workouts': {
            results.files_processed.push(`${file.name}: Skipped (workouts not needed)`)
            break
          }
        }
        continue
      }
      
      results.errors.push(`${file.name}: Unsupported file type (upload WHOOP ZIP or CSV)`)
    }

    // Merge by date and upsert into daily_entries
    console.log('[Whoop Upload] Merging by date for upsert…')
    type Merged = {
      sleep_performance?: number | null
      deep_min?: number | null
      rem_min?: number | null
      hrv?: number | null
      rhr?: number | null
      recovery?: number | null
      strain?: number | null
    }
    const byDate = new Map<string, Merged>()
    for (const s of sleepRows) {
      const m = byDate.get(s.date) || {}
      if (s.sleep_performance != null) m.sleep_performance = s.sleep_performance
      if (s.deep_min != null) m.deep_min = s.deep_min
      if (s.rem_min != null) m.rem_min = s.rem_min
      byDate.set(s.date, m)
    }
    for (const p of physRows) {
      const m = byDate.get(p.date) || {}
      if (p.hrv != null) m.hrv = p.hrv
      if (p.rhr != null) m.rhr = p.rhr
      if (p.recovery != null) m.recovery = p.recovery
      if (p.strain != null) m.strain = p.strain
      byDate.set(p.date, m)
    }
    const allDates = Array.from(byDate.keys())
    allDates.sort()
    const dateRange = allDates.length > 0 ? { start: allDates[0], end: allDates[allDates.length - 1] } : null
    console.log('[Whoop Upload] Unique dates to upsert:', byDate.size, 'range:', dateRange)

    // Fetch existing rows for merge-by-date behavior (do not drop prior sources/metrics)
    let existingMap = new Map<string, { wearables: any; sleep_quality: number | null }>()
    if (allDates.length > 0) {
      const { data: existing, error: exErr } = await supabase
        .from('daily_entries')
        .select('local_date, wearables, sleep_quality')
        .eq('user_id', user!.id)
        .in('local_date', allDates)
      if (exErr) {
        console.warn('[Whoop Upload] Existing rows query failed (merge will still proceed, may overwrite):', exErr.message)
      } else {
        for (const r of existing || []) {
          existingMap.set(String((r as any).local_date).slice(0,10), { wearables: (r as any).wearables || {}, sleep_quality: (r as any).sleep_quality ?? null })
        }
      }
    }

    const upserts = Array.from(byDate.entries()).map(([date, v]) => {
      const rawPerf = v.sleep_performance != null ? Math.round(v.sleep_performance) : null
      // Map 0–100 → 1–10 to satisfy daily_entries.check constraint
      const scaledQuality =
        rawPerf != null ? Math.max(1, Math.min(10, Math.round(rawPerf / 10))) : null
      const prev = existingMap.get(date) || { wearables: {}, sleep_quality: null }
      const newWearables = {
        source: 'WHOOP',
        sleep_performance_pct: rawPerf,
        hrv: v.hrv ?? null,
        resting_hr: v.rhr ?? null,
        recovery_score: v.recovery ?? null,
        strain: v.strain ?? null,
        deep_sleep_min: v.deep_min ?? null,
        rem_sleep_min: v.rem_min ?? null,
      }
      const mergedWearables = { ...(prev.wearables || {}), ...newWearables }
      const mergedSleepQuality = prev.sleep_quality != null ? prev.sleep_quality : scaledQuality
      return {
        user_id: user!.id,
        local_date: date,
        sleep_quality: mergedSleepQuality,
        wearables: mergedWearables
      }
    })
    console.log('[Whoop Upload] Upserting rows:', upserts.length)
    if (upserts.length > 0) {
      const { error: insErr } = await supabase
        .from('daily_entries')
        .upsert(upserts, { onConflict: 'user_id,local_date', ignoreDuplicates: false })
      if (insErr) {
        console.error('[Whoop Upload] Upsert error:', insErr)
        return NextResponse.json(
          { error: `Failed to save data: ${insErr.message}`, details: insErr, debug: { counts: results, attempted: upserts.length } },
          { status: 500 }
        )
      }
      results.upserts = upserts.length
    }
    
    const totalParsed = results.sleeps + results.physiological + results.journal
    
    console.log(`[Whoop Upload] Total parsed: ${totalParsed}`)
    console.log(`[Whoop Upload] Errors: ${results.errors.length}`)
    
    if (totalParsed === 0 && results.errors.length > 0) {
      return NextResponse.json(
        { 
          error: 'No valid data found', 
          details: results.errors.join('; '),
          debug: results 
        },
        { status: 400 }
      )
    }
    
    if (totalParsed === 0) {
      return NextResponse.json(
        { 
          error: 'No valid data found',
          details: 'Files were processed but no data was extracted. Check file format.',
          debug: results
        },
        { status: 400 }
      )
    }
    
    // Report sources breakdown so UI can show correct provider
    const sources: Record<string, number> = {}
    if (byDate.size > 0) sources['WHOOP'] = byDate.size

    return NextResponse.json({
      message: `Successfully imported ${totalParsed} entries`,
      details: [...results.files_processed, `Upserts: ${results.upserts}`].join(', '),
      results: { ...results, sources },
      debugSummary: {
        sleep_rows: results.sleeps,
        phys_rows: results.physiological,
        journal_rows: results.journal,
        merged_unique_dates: byDate.size,
        date_range: dateRange
      }
    })
    
  } catch (error) {
    console.error('[Whoop Upload] Error:', error)
    return NextResponse.json(
      { 
        error: 'Import failed', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    )
  }
}


