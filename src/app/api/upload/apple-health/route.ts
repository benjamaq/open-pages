import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
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
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

    const form = await req.formData()
    const file = form.get('file') as File
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const name = (file.name || '').toLowerCase()
    if (!name.endsWith('.zip')) {
      return NextResponse.json(
        { error: 'Invalid file', details: 'This doesn’t look like a valid Apple Health export ZIP.' },
        { status: 400 }
      )
    }

    // Unzip and find export.xml
    const buf = await file.arrayBuffer()
    const zip = await JSZip.loadAsync(buf)
    let exportFile: JSZip.JSZipObject | null = null
    zip.forEach((path, zobj) => {
      if (!exportFile && /(^|\/)export\.xml$/i.test(path)) {
        exportFile = zobj
      }
    })
    if (!exportFile) {
      return NextResponse.json(
        { error: 'Missing export.xml', details: 'This ZIP does not contain export.xml from Apple Health.' },
        { status: 400 }
      )
    }
    // Stream-parse export.xml to avoid huge memory usage
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
      }
    })
    const stream = exportFile.nodeStream()
    await new Promise<void>((resolve, reject) => {
      saxStream.on('end', () => resolve())
      saxStream.on('error', (err) => reject(err))
      stream.on('error', (err) => reject(err))
      stream.pipe(saxStream)
    })

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
          source: 'Apple Health'
        }
      }
    })

    if (!entries.length) {
      return NextResponse.json({ error: 'No valid data found', details: 'export.xml contained no usable records' }, { status: 400 })
    }

    const { error: insErr } = await supabase
      .from('daily_entries')
      .upsert(entries, { onConflict: 'user_id,local_date', ignoreDuplicates: false })
    if (insErr) {
      console.error('Apple Health upsert error:', insErr)
      return NextResponse.json({ error: 'Failed to save data', details: insErr.message }, { status: 500 })
    }

    entries.sort((a, b) => a.local_date.localeCompare(b.local_date))
    return NextResponse.json({
      success: true,
      message: 'Successfully imported Apple Health ZIP',
      details: `${entries.length} days of data`,
      daysImported: entries.length,
      source: 'Apple Health',
      dateRange: { from: entries[0].local_date, to: entries[entries.length - 1].local_date }
    })
  } catch (e: any) {
    console.error('Apple Health ZIP import error:', e)
    return NextResponse.json(
      { error: 'Import failed', details: e?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}


