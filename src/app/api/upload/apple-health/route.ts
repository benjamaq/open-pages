import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import JSZip from 'jszip'
import sax from 'sax'

type Entry = {
  user_id: string
  local_date: string
  sleep_quality: number | null
  sleep_hours?: number | null
  tags: string[]
  journal?: string | null
  wearables?: Record<string, any>
}

export const runtime = 'nodejs'
export const maxDuration = 60

function parseDate(d: string | undefined): string | null {
  if (!d) return null
  try {
    if (/^\d{4}-\d{2}-\d{2}/.test(d)) return d.slice(0, 10)
    const dt = new Date(d)
    if (!isNaN(dt.getTime())) return dt.toISOString().slice(0, 10)
  } catch {}
  return null
}

export async function POST(req: NextRequest) {
  let step = 'init'
  try {
    try { console.log('[apple-health] Step 1: Request received') } catch {}
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    try { console.log('[apple-health] Step 2: User authenticated:', !!user, 'userId:', (user as any)?.id || '(unknown)') } catch {}

    // Prefer JSON body with storagePath (large files uploaded directly to storage),
    // fallback to multipart/form-data with 'file' (small files).
    let zip: JSZip | null = null
    const contentType = req.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      step = 'parse-json-body'
      const body = await req.json().catch(() => ({} as any))
      const storagePath = String(body?.storagePath || body?.path || '')
      const bucket = String(body?.bucket || 'uploads')
      try { console.log('[apple-health] Using storage path mode', { storagePath, bucket }) } catch {}
      if (!storagePath) {
        return NextResponse.json({ error: 'Missing storagePath' }, { status: 400 })
      }
      step = 'download-storage-file'
      const { data: dl, error: dlErr } = await supabaseAdmin.storage.from(bucket).download(storagePath)
      if (dlErr || !dl) {
        return NextResponse.json({ error: 'Failed to download file', details: dlErr?.message || 'Unknown storage error' }, { status: 500 })
      }
      try { console.log('[apple-health] Step 6: Fetching file for processing... size:', (dl as any)?.size ?? '(n/a)') } catch {}
      step = 'load-zip'
      const arrayBuf = await dl.arrayBuffer()
      zip = await JSZip.loadAsync(arrayBuf)
    }

    if (!zip) {
      step = 'read-formdata'
      const form = await req.formData()
      const file = form.get('file') as File
      if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

      const name = (file.name || '').toLowerCase()
      try { console.log('[apple-health] Step 3: File received', { name: file.name, size: (file as any)?.size ?? '(n/a)' }) } catch {}
      if (!name.endsWith('.zip')) {
        return NextResponse.json(
          { error: 'Invalid file', details: 'This doesn’t look like a valid Apple Health export ZIP.' },
          { status: 400 }
        )
      }

      // Unzip and find export.xml
      step = 'load-zip'
      const buf = await file.arrayBuffer()
      zip = await JSZip.loadAsync(buf)
    }

    if (!zip) {
      return NextResponse.json({ error: 'Invalid ZIP' }, { status: 400 })
    }
    try {
      let fileCount = 0
      zip.forEach(() => { fileCount++ })
      console.log('[apple-health] ZIP loaded. entries:', fileCount)
    } catch {}
    let exportFile: JSZip.JSZipObject | null = null
    zip.forEach((path, zobj) => {
      if (!exportFile && /(^|\/)export\.xml$/i.test(path)) {
        exportFile = zobj
      }
    })
    if (!exportFile) {
      try { console.log('[apple-health] export.xml not found in ZIP') } catch {}
      return NextResponse.json(
        { error: 'Missing export.xml', details: 'This ZIP does not contain export.xml from Apple Health.' },
        { status: 400 }
      )
    }
    // Stream-parse export.xml to avoid huge memory usage
    step = 'parse-xml'
    try { console.log('[apple-health] Step 7: Parsing XML...') } catch {}
    const daily: Record<string, any> = {}
    const saxStream = sax.createStream(true, { lowercase: false, trim: true })
    let parsedRecords = 0
    saxStream.on('opentag', (node: any) => {
      if (node.name !== 'Record') return
      parsedRecords++
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
      }
    })
    const stream = exportFile.nodeStream()
    await new Promise<void>((resolve, reject) => {
      saxStream.on('end', () => resolve())
      saxStream.on('error', (err) => reject(err))
      stream.on('error', (err) => reject(err))
      stream.pipe(saxStream)
    })
    try { console.log('[apple-health] Step 8: XML parsed. recordTags:', parsedRecords, 'days:', Object.keys(daily).length) } catch {}

    const entries: Entry[] = Object.entries(daily).map(([d, v]: any) => {
      let q = 5
      if (v.sleep_hours >= 7 && v.sleep_hours <= 9) q += 2
      if (v.hrv >= 60) q += 2
      else if (v.hrv >= 40) q += 1
      if (v.resting_hr && v.resting_hr <= 60) q += 1
      return {
        user_id: user.id,
        local_date: d,
        sleep_quality: Math.max(1, Math.min(10, Math.round(q))),
        sleep_hours: v.sleep_hours ? Math.round(v.sleep_hours * 10) / 10 : null,
        tags: [],
        journal: null,
        wearables: {
          source: 'Apple Health',
          // Normalize common fields so downstream jobs can use them
          sleep_min: typeof v.sleep_hours === 'number' ? Math.round(v.sleep_hours * 60) : undefined,
          hrv_sdnn_ms: typeof v.hrv === 'number' ? Math.round(v.hrv) : undefined,
          resting_hr_bpm: typeof v.resting_hr === 'number' ? Math.round(v.resting_hr) : undefined
        }
      }
    })

    if (!entries.length) {
      return NextResponse.json({ error: 'No valid data found', details: 'export.xml contained no usable records' }, { status: 400 })
    }

    step = 'upsert'
    try { console.log('[apple-health] Step 9: Upserting to daily_entries...', { days: entries.length }) } catch {}
    const { error: insErr } = await supabase
      .from('daily_entries')
      .upsert(entries, { onConflict: 'user_id,local_date', ignoreDuplicates: false })
    if (insErr) {
      console.error('Apple Health upsert error:', insErr)
      return NextResponse.json({ error: 'Failed to save data', details: insErr.message }, { status: 500 })
    }

    entries.sort((a, b) => a.local_date.localeCompare(b.local_date))
    try { console.log('[apple-health] Step 10: Complete', { from: entries[0].local_date, to: entries[entries.length - 1].local_date, days: entries.length }) } catch {}
    return NextResponse.json({
      success: true,
      message: 'Successfully imported Apple Health ZIP',
      details: `${entries.length} days of data`,
      daysImported: entries.length,
      source: 'Apple Health',
      dateRange: { from: entries[0].local_date, to: entries[entries.length - 1].local_date }
    })
  } catch (e: any) {
    try { console.error('[apple-health] FAILED at step:', step, e?.message || e) } catch {}
    console.error('Apple Health ZIP import error:', e)
    return NextResponse.json(
      { error: 'Import failed', details: e?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}


