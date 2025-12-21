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

type WhoopFileType = 'sleeps' | 'physiological' | 'journal' | 'workouts' | 'unknown'

function detectFileType(firstLine: string): WhoopFileType {
  // All Whoop files start with "Cycle start time"
  if (!firstLine.startsWith('Cycle start time')) {
    return 'unknown'
  }
  
  // Differentiate by unique columns
  if (firstLine.includes('Question text')) return 'journal'
  if (firstLine.includes('Workout start time')) return 'workouts'
  if (firstLine.includes('Recovery score %')) return 'physiological'
  if (firstLine.includes('Sleep performance %')) return 'sleeps'
  
  return 'unknown'
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
  const iDate = h.indexOf('Cycle start time')
  const iPerf = h.indexOf('Sleep performance %')
  const iDeep = h.indexOf('Deep (SWS) duration (min)')
  const iRem = h.indexOf('REM duration (min)')
  const iEff = h.indexOf('Sleep efficiency %')
  
  if (iDate === -1 || iPerf === -1) {
    console.log('[Whoop] sleeps.csv: missing columns. Headers:', h.slice(0, 8))
    return []
  }
  
  const result: SleepRow[] = []
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i]
    const date = toDate(r[iDate])
    if (!date) continue
    
    result.push({
      date,
      sleep_performance: toNum(r[iPerf]),
      deep_min: iDeep >= 0 ? toNum(r[iDeep]) : null,
      rem_min: iRem >= 0 ? toNum(r[iRem]) : null,
      efficiency: iEff >= 0 ? toNum(r[iEff]) : null,
    })
  }
  
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
  const iDate = h.indexOf('Cycle start time')
  const iRec = h.indexOf('Recovery score %')
  const iHrv = h.indexOf('Heart rate variability (ms)')
  const iRhr = h.indexOf('Resting heart rate (bpm)')
  const iStrain = h.indexOf('Day Strain')
  
  if (iDate === -1) {
    console.log('[Whoop] physiological.csv: missing date column')
    return []
  }
  
  const result: PhysRow[] = []
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i]
    const date = toDate(r[iDate])
    if (!date) continue
    
    // Skip empty rows (many in this file)
    const recovery = iRec >= 0 ? toNum(r[iRec]) : null
    if (recovery === null) continue
    
    result.push({
      date,
      recovery,
      hrv: iHrv >= 0 ? toNum(r[iHrv]) : null,
      rhr: iRhr >= 0 ? toNum(r[iRhr]) : null,
      strain: iStrain >= 0 ? toNum(r[iStrain]) : null,
    })
  }
  
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
  const iDate = h.indexOf('Cycle start time')
  const iQ = h.indexOf('Question text')
  const iA = h.indexOf('Answered yes')
  
  if (iDate === -1 || iQ === -1 || iA === -1) {
    console.log('[Whoop] journal.csv: missing columns')
    return []
  }
  
  const result: JournalRow[] = []
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i]
    const date = toDate(r[iDate])
    if (!date) continue
    
    result.push({
      date,
      question: r[iQ] || '',
      yes: r[iA]?.toLowerCase() === 'true',
    })
  }
  
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
      console.log(`[Whoop Upload] Processing: ${file.name} (${file.size} bytes)`)
      
      const text = await file.text()
      
      if (!text || text.trim().length === 0) {
        results.errors.push(`${file.name}: Empty file`)
        continue
      }
      
      const firstLine = text.split('\n')[0] || ''
      console.log(`[Whoop Upload] First line preview: ${firstLine.substring(0, 100)}...`)
      
      const fileType = detectFileType(firstLine)
      console.log(`[Whoop Upload] Detected type: ${fileType}`)
      
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
          console.log(`[Whoop Upload] Parsed ${data.length} sleep entries`)
          break
        }
        
        case 'physiological': {
          const data = parsePhysiological(text)
          physRows.push(...data)
          results.physiological += data.length
          results.files_processed.push(`${file.name}: ${data.length} recovery/HRV entries`)
          console.log(`[Whoop Upload] Parsed ${data.length} physiological entries`)
          break
        }
        
        case 'journal': {
          const data = parseJournal(text)
          results.journal += data.length
          results.files_processed.push(`${file.name}: ${data.length} journal entries`)
          console.log(`[Whoop Upload] Parsed ${data.length} journal entries`)
          break
        }
        
        case 'workouts': {
          results.files_processed.push(`${file.name}: Skipped (workouts not needed)`)
          break
        }
      }
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
    const upserts = Array.from(byDate.entries()).map(([date, v]) => {
      const rawPerf = v.sleep_performance != null ? Math.round(v.sleep_performance) : null
      // Map 0–100 → 1–10 to satisfy daily_entries.check constraint
      const scaledQuality =
        rawPerf != null ? Math.max(1, Math.min(10, Math.round(rawPerf / 10))) : null
      return {
        user_id: user!.id,
        local_date: date,
        sleep_quality: scaledQuality,
        wearables: {
          sleep_performance_pct: rawPerf,
          hrv: v.hrv ?? null,
          resting_hr: v.rhr ?? null,
          recovery_score: v.recovery ?? null,
          strain: v.strain ?? null,
          deep_sleep_min: v.deep_min ?? null,
          rem_sleep_min: v.rem_min ?? null,
        }
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
    
    return NextResponse.json({
      message: `Successfully imported ${totalParsed} entries`,
      details: [...results.files_processed, `Upserts: ${results.upserts}`].join(', '),
      results,
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


