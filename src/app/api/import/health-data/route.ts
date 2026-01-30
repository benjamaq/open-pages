import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { parseStringPromise } from 'xml2js'
import { parse } from 'csv-parse/sync'

interface HealthDataRow {
  [key: string]: string | undefined
}

function detectSource(headers: string[]): string {
  const headerStr = headers.join(',').toLowerCase()
  if (headerStr.includes('recovery score') || headerStr.includes('strain')) return 'Whoop'
  if (headerStr.includes('readiness') || headerStr.includes('sleep performance')) return 'Oura'
  if (headerStr.includes('body battery')) return 'Garmin'
  if (headerStr.includes('sleep score') && headerStr.includes('restfulness')) return 'Fitbit'
  return 'Generic CSV'
}

function normalizeSleepScore(value: number): number {
  if (value >= 1 && value <= 10) return Math.round(value)
  if (value >= 0 && value <= 100) return Math.max(1, Math.min(10, Math.round(value / 10)))
  return 5
}

function parseDateFlexible(dateStr: string): string | null {
  try {
    if (!dateStr) return null
    if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) return dateStr.slice(0, 10)
    const d = new Date(dateStr)
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10)
  } catch {}
  return null
}

function extractValueCI(row: HealthDataRow, ...names: string[]): number | null {
  const entries = Object.entries(row)
  const lowered = names.map(n => (n || '').toLowerCase().trim())
  // Exact CI match
  for (const [k, v] of entries) {
    if (v === undefined || v === '') continue
    const key = (k || '').toLowerCase().trim()
    if (lowered.includes(key)) {
      const parsed = parseFloat(String(v))
      if (!isNaN(parsed)) return parsed
    }
  }
  // Fuzzy contains
  for (const [k, v] of entries) {
    if (v === undefined || v === '') continue
    const key = (k || '').toLowerCase()
    if (lowered.some(n => key.includes(n))) {
      const parsed = parseFloat(String(v))
      if (!isNaN(parsed)) return parsed
    }
  }
  return null
}

function getDateFromRow(row: HealthDataRow): string | null {
  // Try common explicit keys first
  const explicitOrder = [
    'date', 'Date', 'Calendar Date',
    'local_date', 'Local Date',
    'start', 'Start', 'start_time', 'Start Time', 'Start Time (Local)',
    'day', 'Day'
  ]
  for (const key of explicitOrder) {
    const val = row[key]
    if (val) {
      const d = parseDateFlexible(String(val))
      if (d) return d
    }
  }
  // Fuzzy: any key containing 'date' or 'day' or 'start'
  for (const [k, v] of Object.entries(row)) {
    if (!v) continue
    const lk = (k || '').toLowerCase()
    if (lk.includes('date') || lk.includes('day') || lk.includes('start')) {
      const d = parseDateFlexible(String(v))
      if (d) return d
    }
  }
  return null
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

    // Use authenticated user directly; profile is not required for daily_entries
    const userId = user.id

    const form = await req.formData()
    const file = form.get('file') as File
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const fileName = file.name.toLowerCase()
    const content = await file.text()

    type Entry = {
      user_id: string
      local_date: string
      sleep_quality: number | null
      sleep_hours?: number | null
      tags: string[]
      journal?: string | null
      wearables?: Record<string, any>
    }
    let entries: Entry[] = []
    let detectedSource = 'Unknown'

    if (fileName.endsWith('.xml')) {
      detectedSource = 'Apple Health'
      const xml = await parseStringPromise(content)
      const records = xml?.HealthData?.Record || []
      const daily: Record<string, any> = {}
      for (const r of records) {
        const type = r.$?.type
        const start = r.$?.startDate
        const end = r.$?.endDate
        const date = parseDateFlexible(start)
        if (!date || !type) continue
        daily[date] ||= {}
        if (type === 'HKCategoryTypeIdentifierSleepAnalysis' && r.$?.value === 'HKCategoryValueSleepAnalysisAsleep') {
          const s = new Date(start); const e = new Date(end)
          const hrs = (e.getTime() - s.getTime()) / 36e5
          daily[date].sleep_hours = (daily[date].sleep_hours || 0) + (isFinite(hrs) ? hrs : 0)
        } else if (type === 'HKQuantityTypeIdentifierHeartRateVariabilitySDNN') {
          const v = parseFloat(r.$?.value); if (!isNaN(v)) daily[date].hrv = v
        } else if (type === 'HKQuantityTypeIdentifierRestingHeartRate') {
          const v = parseFloat(r.$?.value); if (!isNaN(v)) daily[date].resting_hr = v
        }
      }
      entries = Object.entries(daily).map(([d, v]: any) => {
        let q = 5
        if (v.sleep_hours >= 7 && v.sleep_hours <= 9) q += 2
        if (v.hrv >= 60) q += 2
        else if (v.hrv >= 40) q += 1
        if (v.resting_hr && v.resting_hr <= 60) q += 1
        return {
          user_id: userId,
          local_date: d,
          sleep_quality: Math.max(1, Math.min(10, Math.round(q))),
          sleep_hours: v.sleep_hours ? Math.round(v.sleep_hours * 10) / 10 : null,
          tags: [],
          journal: `Imported from ${detectedSource}`,
          wearables: {
            source: 'Apple Health',
            sleep_min: typeof v.sleep_hours === 'number' ? Math.round(v.sleep_hours * 60) : undefined,
            hrv_sdnn_ms: typeof v.hrv === 'number' ? Math.round(v.hrv) : undefined,
            resting_hr_bpm: typeof v.resting_hr === 'number' ? Math.round(v.resting_hr) : undefined
          }
        }
      })
    } else if (fileName.endsWith('.csv')) {
      // Parse CSV, retrying with common alternate delimiters if needed
      let rows: HealthDataRow[] = []
      let attemptDelimiter: ',' | ';' | '\t' = ','
      const parseOnce = (delim: ',' | ';' | '\t') =>
        parse(content, {
          columns: true,
          skip_empty_lines: true,
          trim: true,
          relax_quotes: true,
          relax_column_count: true,
          bom: true,
          delimiter: delim
        }) as HealthDataRow[]
      rows = parseOnce(',')
      // If parsing collapsed into a single column, try semicolon and tab
      if (rows.length > 0 && Object.keys(rows[0] || {}).length <= 1) {
        if (content.includes(';')) {
          attemptDelimiter = ';'
          rows = parseOnce(';')
        } else if (content.includes('\t')) {
          attemptDelimiter = '\t'
          rows = parseOnce('\t')
        }
      }
      if (!rows.length) return NextResponse.json({ error: 'Empty CSV file' }, { status: 400 })
      const headers = Object.keys(rows[0] || {})
      detectedSource = detectSource(headers)
      // WHOOP explicit handlers (exact headers)
      if ((headers[0] || '').trim() === 'Cycle start time') {
        const hasSleepPerf = headers.includes('Sleep performance %')
        const hasRecovery = headers.includes('Recovery score %')
        const hasJournal = headers.includes('Question text') && headers.includes('Answered yes')

        // sleeps.csv
        if (hasSleepPerf && headers.includes('Asleep duration (min)')) {
          for (const row of rows) {
            const cycleStart = row['Cycle start time']
            if (!cycleStart) continue
            const d = parseDateFlexible(String(cycleStart).slice(0, 10))
            if (!d) continue
            const perf = parseFloat(String(row['Sleep performance %'] || ''))
            if (!isFinite(perf)) continue
            const asleepMin = parseFloat(String(row['Asleep duration (min)'] || ''))
            const deepMin = parseFloat(String(row['Deep (SWS) duration (min)'] || ''))
            const remMin = parseFloat(String(row['REM duration (min)'] || ''))
            const awakeMin = parseFloat(String(row['Awake duration (min)'] || ''))
            const eff = parseFloat(String(row['Sleep efficiency %'] || ''))
            const cons = parseFloat(String(row['Sleep consistency %'] || ''))
            const resp = parseFloat(String(row['Respiratory rate (rpm)'] || ''))
            entries.push({
              user_id: userId,
              local_date: d,
              sleep_quality: normalizeSleepScore(perf),
              sleep_hours: isFinite(asleepMin) ? Math.round((asleepMin / 60) * 10) / 10 : null,
              tags: [],
              journal: null,
              wearables: {
                sleep_min: isFinite(asleepMin) ? Math.round(asleepMin) : undefined,
                deep_min: isFinite(deepMin) ? Math.round(deepMin) : undefined,
                rem_min: isFinite(remMin) ? Math.round(remMin) : undefined,
                awake_min: isFinite(awakeMin) ? Math.round(awakeMin) : undefined,
                sleep_efficiency_pct: isFinite(eff) ? Math.round(eff) : undefined,
                sleep_consistency_pct: isFinite(cons) ? Math.round(cons) : undefined,
                respiratory_rate_rpm: isFinite(resp) ? Math.round(resp * 10) / 10 : undefined,
              }
            })
          }
        }

        // physiological_cycles.csv
        if (hasRecovery) {
          for (const row of rows) {
            const recStr = String(row['Recovery score %'] || '').trim()
            if (!recStr) continue
            const cycleStart = row['Cycle start time']
            if (!cycleStart) continue
            const d = parseDateFlexible(String(cycleStart).slice(0, 10))
            if (!d) continue
            const rec = parseFloat(recStr)
            const rhr = parseFloat(String(row['Resting heart rate (bpm)'] || ''))
            const hrv = parseFloat(String(row['Heart rate variability (ms)'] || ''))
            const strain = parseFloat(String(row['Day Strain'] || ''))
            const perf = parseFloat(String(row['Sleep performance %'] || ''))
            entries.push({
              user_id: userId,
              local_date: d,
              sleep_quality: isFinite(perf) ? normalizeSleepScore(perf) : null,
              tags: [],
              journal: null,
              wearables: {
                recovery_score_pct: isFinite(rec) ? Math.round(rec) : undefined,
                rhr_bpm: isFinite(rhr) ? Math.round(rhr) : undefined,
                hrv_ms: isFinite(hrv) ? Math.round(hrv) : undefined,
                day_strain: isFinite(strain) ? Math.round(strain * 10) / 10 : undefined,
              }
            })
          }
        }

        // journal_entries.csv (pivot)
        if (hasJournal) {
          const byDateTags = new Map<string, Set<string>>()
          for (const row of rows) {
            const cycleStart = row['Cycle start time']
            if (!cycleStart) continue
            const d = parseDateFlexible(String(cycleStart).slice(0, 10))
            if (!d) continue
            const q = String(row['Question text'] || '').trim()
            const ans = String(row['Answered yes'] || '').trim().toLowerCase()
            if (!q) continue
            if (ans !== 'true' && ans !== 'yes') continue
            const dateSet = byDateTags.get(d) || new Set<string>()
            // map question → tag
            const mapQ = (s: string): string | null => {
              const t = s.toLowerCase()
              if (t.includes('magnesium')) return 'supplement_magnesium'
              if (t.includes('cbd')) return 'supplement_cbd'
              if (t.includes('melatonin')) return 'supplement_melatonin'
              if (t.includes('caffeine')) return 'confound_caffeine'
              if (t.includes('alcohol')) return 'confound_alcohol'
              if (t.includes('stress')) return 'confound_stress'
              if (t.includes('plane')) return 'confound_travel'
              return null
            }
            const tag = mapQ(q)
            if (tag) dateSet.add(tag)
            byDateTags.set(d, dateSet)
          }
          for (const [d, set] of byDateTags) {
            entries.push({
              user_id: userId,
              local_date: d,
              sleep_quality: null,
              tags: Array.from(set),
              journal: null,
              wearables: {}
            })
          }
        }
      } else {
        // Generic CSV fallback
      for (const row of rows) {
        const d = getDateFromRow(row)
        if (!d) continue
        const sleepScore = extractValueCI(
          row,
          // Generic / custom
          'sleep_quality', 'sleep score', 'sleep_score', 'sleep',
          // WHOOP
          'recovery score', 'recovery score %', 'recovery', 'recovery score (%)',
          'sleep performance', 'sleep performance %', 'sleep performance (%)',
          // Oura
          'readiness', 'readiness score', 'readiness score (%)', 'total sleep score',
          // Fitbit/Garmin variants
          'sleep score', 'restfulness', 'sleep efficiency'
        )
        // Fallback: derive from sleep hours if available
        let finalSleep = sleepScore
        if (finalSleep == null) {
          // Hours-based fields
          const hours = extractValueCI(
            row,
            'sleep duration', 'sleep hours', 'total sleep', 'hours of sleep', 'time asleep (hours)', 'duration (hours)'
          )
          // Minutes-based fields
          const minutes = extractValueCI(
            row,
            'sleep duration (minutes)', 'sleep minutes', 'total sleep minutes', 'time asleep (minutes)', 'duration (minutes)'
          )
          if (hours != null && isFinite(hours)) {
            // Rough mapping from hours to score
            const h = Math.max(0, Math.min(12, hours))
            const approx = h >= 7 && h <= 9 ? 80 : h >= 6 ? 70 : h >= 5 ? 60 : 50
            finalSleep = approx
          } else if (minutes != null && isFinite(minutes)) {
            const h = Math.max(0, Math.min(12, minutes / 60))
            const approx = h >= 7 && h <= 9 ? 80 : h >= 6 ? 70 : h >= 5 ? 60 : 50
            finalSleep = approx
          } else {
            // Generic score-like fallback: any numeric field containing 'score', 'readiness', 'recovery', 'sleep', 'strain'
            for (const [k, v] of Object.entries(row)) {
              if (v == null || v === '') continue
              const key = (k || '').toLowerCase()
              if (key.includes('score') || key.includes('readiness') || key.includes('recovery') || key.includes('sleep') || key.includes('strain')) {
                const num = parseFloat(String(v))
                if (isFinite(num)) {
                  // Normalize likely 0-1 scale → 0-100
                  const normalized = num <= 1 && num >= 0 ? num * 100 : num
                  if (isFinite(normalized)) {
                    finalSleep = normalized
                    break
                  }
                }
              }
            }
          }
        }
        if (finalSleep == null) continue
        // Optional: steps (common across Fitbit/Garmin/Google Fit exports)
        const stepsVal = extractValueCI(
          row,
          'steps', 'step count', 'total steps', 'daily steps'
        )
        const stepsNum = stepsVal != null && isFinite(stepsVal) ? Math.round(stepsVal) : null
        entries.push({
          user_id: userId,
          local_date: d,
          sleep_quality: normalizeSleepScore(finalSleep),
          sleep_hours: null,
          tags: [],
          journal: null,
          wearables: (stepsNum != null ? { steps: stepsNum } : {})
        })
      }
      }
    } else if (fileName.endsWith('.json')) {
      detectedSource = 'JSON'
      const json = JSON.parse(content)
      const items: any[] = Array.isArray(json) ? json : (json?.data || [])
      for (const it of items) {
        const d = parseDateFlexible(it.date || it.startTime || it.start || it.day)
        if (!d) continue
        const score = Number(it.sleep_score ?? it.sleepScore ?? it.readiness ?? it.recoveryScore)
        if (!isFinite(score)) continue
        entries.push({
          user_id: userId,
          local_date: d,
          sleep_quality: normalizeSleepScore(score),
          sleep_hours: null,
          tags: [],
          journal: null,
          wearables: {}
        })
      }
    } else {
      return NextResponse.json({ error: 'Unsupported file format', details: 'Upload .csv or .xml (Apple Health) or JSON' }, { status: 400 })
    }

    // Merge by date: union tags, prefer higher sleep_quality, merge wearables and preserve sleep_hours if present
    const byDate = new Map<string, Entry>()
    for (const e of entries) {
      const prev = byDate.get(e.local_date)
      if (!prev) {
        byDate.set(e.local_date, e)
      } else {
        const mergedTags = Array.from(new Set([...(prev.tags || []), ...(e.tags || [])]))
        const mergedWearables = { ...(prev.wearables || {}), ...(e.wearables || {}) }
        const merged: Entry = {
          user_id: e.user_id,
          local_date: e.local_date,
          sleep_quality: (e.sleep_quality ?? null) != null && (prev.sleep_quality ?? null) != null
            ? Math.max(e.sleep_quality!, prev.sleep_quality!)
            : (e.sleep_quality ?? prev.sleep_quality ?? null),
          sleep_hours: (e.sleep_hours ?? null) != null ? e.sleep_hours! : (prev.sleep_hours ?? null),
          tags: mergedTags,
          journal: prev.journal ?? e.journal ?? null,
          wearables: mergedWearables
        }
        byDate.set(e.local_date, merged)
      }
    }
    const finalEntries = Array.from(byDate.values())
    if (!finalEntries.length) return NextResponse.json({ error: 'No valid data found', details: `File from ${detectedSource} contains no usable data` }, { status: 400 })

    const { error: insErr } = await supabase.from('daily_entries').upsert(finalEntries, { onConflict: 'user_id,local_date', ignoreDuplicates: false })
    if (insErr) {
      console.error('Insert error:', insErr)
      return NextResponse.json({ error: 'Failed to save data', details: insErr.message }, { status: 500 })
    }

    finalEntries.sort((a, b) => a.local_date.localeCompare(b.local_date))
    return NextResponse.json({
      success: true,
      message: `Successfully imported from ${detectedSource}!`,
      details: `${finalEntries.length} days of data`,
      daysImported: finalEntries.length,
      source: detectedSource,
      dateRange: { from: finalEntries[0].local_date, to: finalEntries[finalEntries.length - 1].local_date }
    })
  } catch (e: any) {
    console.error('Import error:', e)
    return NextResponse.json({ error: 'Import failed', details: e?.message || 'Unknown error' }, { status: 500 })
  }
}


