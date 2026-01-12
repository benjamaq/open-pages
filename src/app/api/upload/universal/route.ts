import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import JSZip from 'jszip'
import sax from 'sax'
import { Readable } from 'stream'
import { parseWhoopFile, parsePhysiologicalCSV, parseSleepsCSV } from '@/lib/parsers/whoop-parser'

export const runtime = 'nodejs'
export const maxDuration = 60

type Entry = {
  user_id: string
  local_date: string
  sleep_quality: number | null
  sleep_hours?: number | null
  tags: string[] | null
  journal?: string | null
  wearables?: Record<string, any>
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

    const ct = (req.headers.get('content-type') || '').toLowerCase()
    // Allow storage-based uploads for very large files
    if (ct.includes('application/json')) {
      const body = await req.json().catch(() => ({}))
      const storagePaths: string[] = Array.isArray(body?.storagePaths) ? body.storagePaths : (body?.storagePath ? [String(body.storagePath)] : [])
      const bucket = String(body?.bucket || 'uploads')
      if (!storagePaths.length) {
        return NextResponse.json({ error: 'Missing storagePath(s)' }, { status: 400 })
      }
      const results = await handleStorageFiles(user.id, bucket, storagePaths)
      return NextResponse.json(results)
    }

    // Multipart – accept multiple files
    const form = await req.formData()
    const files = form.getAll('files') as File[] || []
    if (!files.length) {
      const single = form.get('file') as File | null
      if (single) files.push(single)
    }
    if (!files.length) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    const summary: { sources: Record<string, number>, daysUpserted: number, messages: string[] } = {
      sources: {},
      daysUpserted: 0,
      messages: []
    }

    for (const f of files) {
      const name = (f.name || '').toLowerCase()
      // ZIP → try Apple Health export.xml, else scan CSVs for Whoop
      if (name.endsWith('.zip')) {
        const buf = await f.arrayBuffer()
        const zip = await JSZip.loadAsync(buf)
        let exportXML: JSZip.JSZipObject | null = null
        const whoopCSV: Array<{ path: string, obj: JSZip.JSZipObject }> = []
        zip.forEach((p, obj) => {
          if (!exportXML && /(^|\/)export\.xml$/i.test(p)) exportXML = obj
          if (/whoop|physiological|journal|sleeps/i.test(p) && p.toLowerCase().endsWith('.csv')) whoopCSV.push({ path: p, obj })
        })
        if (exportXML) {
          const stream = exportXML.nodeStream()
          const daily = await parseAppleHealthXMLStream(stream)
          const entries = buildAppleHealthEntries(user.id, daily)
          const up = await upsertDailyEntries(entries)
          summary.daysUpserted += up
          summary.sources['Apple Health'] = (summary.sources['Apple Health'] || 0) + up
          summary.messages.push(`Apple Health: ${up} day(s) imported from ZIP`)
          continue
        }
        if (whoopCSV.length) {
          let sleepRows: any[] = []
          let physRows: any[] = []
          for (const w of whoopCSV) {
            const text = await w.obj.async('text')
            const parsed = parseWhoopFile(w.path, text)
            if (parsed.type === 'sleep') sleepRows.push(...parseSleepsCSV(text))
            if (parsed.type === 'physiological') physRows.push(...parsePhysiologicalCSV(text))
          }
          const up = await upsertWhoopAsDaily(user.id, sleepRows, physRows)
          summary.daysUpserted += up
          summary.sources['Whoop'] = (summary.sources['Whoop'] || 0) + up
          summary.messages.push(`WHOOP: ${up} day(s) imported from ZIP`)
          continue
        }
        summary.messages.push(`ZIP did not contain Apple Health export.xml or recognizable WHOOP CSVs: ${name}`)
        continue
      }

      // XML → detect Apple Health by <HealthData ...>
      if (name.endsWith('.xml')) {
        const text = await f.text()
        if (/\<HealthData[\s>]/.test(text.slice(0, 2048))) {
          const daily = await parseAppleHealthXMLStream(Readable.from([text]))
          const entries = buildAppleHealthEntries(user.id, daily)
          const up = await upsertDailyEntries(entries)
          summary.daysUpserted += up
          summary.sources['Apple Health'] = (summary.sources['Apple Health'] || 0) + up
          summary.messages.push(`Apple Health: ${up} day(s) imported from XML`)
        } else {
          summary.messages.push(`XML not recognized as Apple Health (HealthData tag missing): ${name}`)
        }
        continue
      }

      // CSV → try WHOOP by header; else generic CSV → health-data importer logic
      if (name.endsWith('.csv')) {
        const text = await f.text()
        const firstLine = text.split('\n')[0] || ''
        const isWhoop = firstLine.startsWith('Cycle start time,')
        if (isWhoop) {
          const parsed = parseWhoopFile(name, text)
          let sleepRows: any[] = []
          let physRows: any[] = []
          if (parsed.type === 'sleep') sleepRows = parseSleepsCSV(text)
          if (parsed.type === 'physiological') physRows = parsePhysiologicalCSV(text)
          const up = await upsertWhoopAsDaily(user.id, sleepRows, physRows)
          summary.daysUpserted += up
          summary.sources['Whoop'] = (summary.sources['Whoop'] || 0) + up
          summary.messages.push(`WHOOP: ${up} day(s) imported`)
        } else {
          const up = await upsertGenericCSV(user.id, text)
          summary.daysUpserted += up
          summary.sources['Generic CSV'] = (summary.sources['Generic CSV'] || 0) + up
          summary.messages.push(`CSV: ${up} day(s) imported`)
        }
        continue
      }

      // JSON → try Oura-like or generic
      if (name.endsWith('.json')) {
        const text = await f.text()
        const up = await upsertGenericJSON(user.id, text)
        summary.daysUpserted += up
        summary.sources['JSON'] = (summary.sources['JSON'] || 0) + up
        summary.messages.push(`JSON: ${up} day(s) imported`)
        continue
      }

      summary.messages.push(`Unsupported file type: ${name}`)
    }

    if (summary.daysUpserted === 0) {
      return NextResponse.json({
        error: 'No recognizable data found',
        details: summary.messages.join(' • '),
        debug: summary
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: `Imported ${summary.daysUpserted} day(s)`,
      details: Object.entries(summary.sources).map(([k, v]) => `${k}: ${v}`).join(', '),
      results: summary
    })
  } catch (e: any) {
    console.error('[universal-upload] Error:', e?.message, e?.stack)
    return NextResponse.json({ error: 'Import failed', details: e?.message || 'Unknown error' }, { status: 500 })
  }
}

async function handleStorageFiles(userId: string, bucket: string, storagePaths: string[]) {
  let total = 0
  const sources: Record<string, number> = {}
  const messages: string[] = []
  for (const p of storagePaths) {
    const { data: dl, error } = await supabaseAdmin.storage.from(bucket).download(p)
    if (error || !dl) {
      messages.push(`Failed to download ${p}: ${error?.message || 'unknown'}`)
      continue
    }
    const buf = await dl.arrayBuffer()
    const name = p.toLowerCase()
    if (name.endsWith('.zip')) {
      const zip = await JSZip.loadAsync(buf)
      let exportXML: JSZip.JSZipObject | null = null
      zip.forEach((pp, obj) => { if (!exportXML && /(^|\/)export\.xml$/i.test(pp)) exportXML = obj })
      if (exportXML) {
        const daily = await parseAppleHealthXMLStream(exportXML.nodeStream())
        const entries = buildAppleHealthEntries(userId, daily)
        const up = await upsertDailyEntries(entries)
        total += up
        sources['Apple Health'] = (sources['Apple Health'] || 0) + up
        messages.push(`Apple Health: ${up} day(s) imported from ZIP`)
      } else {
        messages.push(`ZIP did not contain Apple Health export.xml: ${p}`)
      }
    } else if (name.endsWith('.xml')) {
      const text = Buffer.from(buf).toString('utf8')
      if (/\<HealthData[\s>]/.test(text.slice(0, 2048))) {
        const daily = await parseAppleHealthXMLStream(Readable.from([text]))
        const entries = buildAppleHealthEntries(userId, daily)
        const up = await upsertDailyEntries(entries)
        total += up
        sources['Apple Health'] = (sources['Apple Health'] || 0) + up
        messages.push(`Apple Health: ${up} day(s) imported from XML`)
      } else {
        messages.push(`XML not recognized as Apple Health (HealthData tag missing): ${p}`)
      }
    } else {
      messages.push(`Unsupported storage file type: ${p}`)
    }
  }
  return {
    success: total > 0,
    message: total > 0 ? `Imported ${total} day(s)` : 'No data imported',
    details: Object.entries(sources).map(([k, v]) => `${k}: ${v}`).join(', '),
    results: { sources, daysUpserted: total, messages }
  }
}

function parseDate(d: string | undefined): string | null {
  if (!d) return null
  try {
    if (/^\d{4}-\d{2}-\d{2}/.test(d)) return d.slice(0, 10)
    const dt = new Date(d)
    if (!isNaN(dt.getTime())) return dt.toISOString().slice(0, 10)
  } catch {}
  return null
}

async function parseAppleHealthXMLStream(stream: NodeJS.ReadableStream): Promise<Record<string, any>> {
  const daily: Record<string, any> = {}
  const saxStream = sax.createStream(true, { lowercase: false, trim: true })
  saxStream.on('opentag', (node: any) => {
    if (node.name !== 'Record') return
    const a = node.attributes || {}
    const type = a.type as string | undefined
    const start = a.startDate as string | undefined
    const end = a.endDate as string | undefined
    const value = a.value as string | undefined
    const date = parseDate(start || '')
    if (!date || !type) return
    daily[date] ||= {}
    if (type === 'HKCategoryTypeIdentifierSleepAnalysis' && value === 'HKCategoryValueSleepAnalysisAsleep') {
      if (start && end) {
        const s = new Date(start); const e = new Date(end)
        const hrs = (e.getTime() - s.getTime()) / 36e5
        daily[date].sleep_hours = (daily[date].sleep_hours || 0) + (isFinite(hrs) ? hrs : 0)
      }
    } else if (type === 'HKQuantityTypeIdentifierHeartRateVariabilitySDNN') {
      const v = parseFloat(String(value ?? '')); if (!isNaN(v)) daily[date].hrv = v
    } else if (type === 'HKQuantityTypeIdentifierRestingHeartRate') {
      const v = parseFloat(String(value ?? '')); if (!isNaN(v)) daily[date].resting_hr = v
    } else if (type === 'HKQuantityTypeIdentifierActiveEnergyBurned') {
      const v = parseFloat(String(value ?? '')); if (!isNaN(v)) daily[date].active_energy_kcal = v
    }
  })
  await new Promise<void>((resolve, reject) => {
    saxStream.on('end', () => resolve())
    saxStream.on('error', (err) => reject(err))
    stream.on('error', (err: any) => reject(err))
    stream.pipe(saxStream)
  })
  return daily
}

function buildAppleHealthEntries(userId: string, daily: Record<string, any>): Entry[] {
  return Object.entries(daily).map(([d, v]: any) => {
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
      journal: null,
      wearables: {
        source: 'Apple Health',
        sleep_min: typeof v.sleep_hours === 'number' ? Math.round(v.sleep_hours * 60) : undefined,
        hrv_sdnn_ms: typeof v.hrv === 'number' ? Math.round(v.hrv) : undefined,
        resting_hr_bpm: typeof v.resting_hr === 'number' ? Math.round(v.resting_hr) : undefined,
        active_energy_kcal: typeof v.active_energy_kcal === 'number' ? Math.round(v.active_energy_kcal) : undefined,
      }
    }
  })
}

async function upsertDailyEntries(entries: Entry[]): Promise<number> {
  if (!entries.length) return 0
  const supabase = await createClient()
  const { error } = await supabase.from('daily_entries').upsert(entries, { onConflict: 'user_id,local_date', ignoreDuplicates: false })
  if (error) throw new Error(error.message)
  return entries.length
}

async function upsertWhoopAsDaily(userId: string, sleepRows: any[], physRows: any[]): Promise<number> {
  // Merge by date
  const byDate = new Map<string, any>()
  for (const s of sleepRows) {
    const r = byDate.get(s.date) || {}
    r.sleep_quality = typeof s.sleep_performance === 'number' ? Math.max(1, Math.min(10, Math.round(s.sleep_performance / 10))) : null
    r.deep_sleep_min = s.deep_sleep_min ?? null
    r.rem_sleep_min = s.rem_sleep_min ?? null
    byDate.set(s.date, r)
  }
  for (const p of physRows) {
    const r = byDate.get(p.date) || {}
    r.hrv_ms = p.hrv ?? null
    r.resting_hr_bpm = p.resting_hr ?? null
    r.recovery_score = p.recovery_score ?? null
    r.strain = p.strain ?? null
    byDate.set(p.date, r)
  }
  const entries: Entry[] = Array.from(byDate.entries()).map(([d, v]) => ({
    user_id: userId,
    local_date: d,
    sleep_quality: v.sleep_quality ?? null,
    tags: [],
    wearables: {
      source: 'WHOOP',
      hrv_ms: v.hrv_ms ?? null,
      resting_hr_bpm: v.resting_hr_bpm ?? null,
      recovery_score: v.recovery_score ?? null,
      strain: v.strain ?? null,
      deep_sleep_min: v.deep_sleep_min ?? null,
      rem_sleep_min: v.rem_sleep_min ?? null,
    }
  }))
  return upsertDailyEntries(entries)
}

async function upsertGenericCSV(userId: string, text: string): Promise<number> {
  // Minimal generic CSV: date,sleep_quality,energy,hrv,resting_hr
  const lines = text.trim().split(/\r?\n/)
  if (lines.length < 2) return 0
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
  const idx = {
    date: headers.findIndex(h => h === 'date' || h.includes('date')),
    sleep: headers.findIndex(h => h === 'sleep_quality' || h.includes('sleep')),
    hrv: headers.findIndex(h => h.includes('hrv')),
    rhr: headers.findIndex(h => h.includes('resting_hr') || h.includes('rhr')),
  }
  if (idx.date === -1) return 0
  const entries: Entry[] = []
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',')
    const d = parts[idx.date]?.slice(0, 10)
    if (!d) continue
    const sleepVal = idx.sleep >= 0 ? parseFloat(parts[idx.sleep] || '') : NaN
    const hrvVal = idx.hrv >= 0 ? parseFloat(parts[idx.hrv] || '') : NaN
    const rhrVal = idx.rhr >= 0 ? parseFloat(parts[idx.rhr] || '') : NaN
    entries.push({
      user_id: userId,
      local_date: d,
      sleep_quality: Number.isFinite(sleepVal) ? Math.max(1, Math.min(10, Math.round(sleepVal))) : null,
      tags: [],
      wearables: {
        source: 'CSV',
        hrv: Number.isFinite(hrvVal) ? Math.round(hrvVal) : null,
        resting_hr_bpm: Number.isFinite(rhrVal) ? Math.round(rhrVal) : null
      }
    })
  }
  return upsertDailyEntries(entries)
}

async function upsertGenericJSON(userId: string, text: string): Promise<number> {
  let data: any
  try { data = JSON.parse(text) } catch { return 0 }
  const arr: any[] = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : [])
  if (!arr.length) return 0
  const entries: Entry[] = []
  for (const it of arr) {
    const d = (it.date || it.start || it.startTime || '').slice(0, 10)
    if (!d) continue
    const sleep = Number(it.sleep_quality ?? it.sleepScore ?? it.sleep_score ?? it.readiness)
    const hrv = Number(it.hrv ?? it.hrv_ms ?? it.hrvSdnn)
    const rhr = Number(it.resting_hr ?? it.rhr ?? it.restingHeartRate)
    entries.push({
      user_id: userId,
      local_date: d,
      sleep_quality: Number.isFinite(sleep) ? Math.max(1, Math.min(10, Math.round(sleep))) : null,
      tags: [],
      wearables: {
        source: 'JSON',
        hrv: Number.isFinite(hrv) ? Math.round(hrv) : null,
        resting_hr_bpm: Number.isFinite(rhr) ? Math.round(rhr) : null
      }
    })
  }
  return upsertDailyEntries(entries)
}


