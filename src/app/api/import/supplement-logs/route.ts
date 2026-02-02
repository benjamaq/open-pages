import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

function parseCSV(text: string): string[][] {
  const lines = text.trim().split(/\r?\n/)
  return lines.map(line => {
    const cells: string[] = []
    let cur = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        inQuotes = !inQuotes
      } else if (ch === ',' && !inQuotes) {
        cells.push(cur.trim())
        cur = ''
      } else {
        cur += ch
      }
    }
    cells.push(cur.trim())
    return cells
  })
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const form = await req.formData()
    const file = form.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'Missing file' }, { status: 400 })

    const text = await file.text()
    const rows = parseCSV(text)
    if (rows.length < 2) return NextResponse.json({ error: 'CSV has no data' }, { status: 400 })

    const header = rows[0].map(h => h.replace(/^\uFEFF/, '').trim().toLowerCase())
    const idx = {
      supplement: header.findIndex(h => h === 'supplement' || h === 'name' || h === 'label'),
      start_date: header.findIndex(h => h === 'start_date' || h === 'start'),
      end_date: header.findIndex(h => h === 'end_date' || h === 'end'),
      dose: header.findIndex(h => h === 'dose'),
      notes: header.findIndex(h => h === 'notes'),
    }
    if (idx.supplement === -1 || idx.start_date === -1) {
      return NextResponse.json({ error: 'Missing required headers: supplement,start_date' }, { status: 400 })
    }

    let created = 0
    let updated = 0
    const errors: string[] = []

    for (let i = 1; i < rows.length; i++) {
      const r = rows[i]
      const name = (r[idx.supplement] || '').trim()
      const start = (r[idx.start_date] || '').slice(0, 10)
      const end = idx.end_date >= 0 ? (r[idx.end_date] || '').slice(0, 10) : ''
      const dose = idx.dose >= 0 ? (r[idx.dose] || '').trim() : ''
      const notes = idx.notes >= 0 ? (r[idx.notes] || '').trim() : ''
      if (!name || !start) continue

      // Try to find existing by case-insensitive name for this user
      const { data: existing } = await supabaseAdmin
        .from('user_supplement')
        .select('id,name')
        .eq('user_id', user.id)
        .ilike('name', name)
        .limit(1)
        .maybeSingle()

      if (existing?.id) {
        const { error: upErr } = await supabaseAdmin
          .from('user_supplement')
          .update({ inferred_start_at: start, dose: dose || undefined, notes: notes || undefined })
          .eq('id', existing.id)
          .eq('user_id', user.id)
        if (upErr) {
          errors.push(`Row ${i + 1}: ${upErr.message}`)
        } else {
          updated++
        }
      } else {
        const { data: ins, error: insErr } = await supabaseAdmin
          .from('user_supplement')
          .insert({
            user_id: user.id,
            name,
            inferred_start_at: start,
            dose: dose || null,
            notes: notes || null,
            is_active: true
          } as any)
          .select('id')
          .maybeSingle()
        if (insErr) {
          errors.push(`Row ${i + 1}: ${insErr.message}`)
        } else {
          created++
        }
      }
      // Optional: no-op for end_date; periods API handles ranges
    }

    const result = { created, updated, errorsCount: errors.length }
    if (errors.length > 0) {
      return NextResponse.json({ ok: true, result, errors }, { status: 207 })
    }
    return NextResponse.json({ ok: true, result })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'failed' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { parse } from 'csv-parse/sync'

interface Row { [k: string]: string | undefined }

function parseDate(d?: string): string | null {
  if (!d) return null
  const s = d.trim()
  if (!s) return null
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10)
  const dt = new Date(s)
  if (!isNaN(dt.getTime())) return dt.toISOString().slice(0, 10)
  return null
}
function getCell(r: Row, ...names: string[]): string | undefined {
  for (const n of names) {
    const v = r[n]
    if (v !== undefined && String(v).trim() !== '') return String(v).trim()
  }
  return undefined
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    const { data: profile } = await supabase.from('profiles').select('id,user_id').eq('user_id', user.id).single()
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    const form = await req.formData()
    const file = form.get('file') as File
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const text = await file.text()
    let rows: Row[] = []
    try {
      rows = parse(text, { columns: true, skip_empty_lines: true, trim: true })
    } catch {
      return NextResponse.json({ error: 'Failed to parse CSV', details: 'Ensure file is CSV with headers' }, { status: 400 })
    }
    if (!rows.length) return NextResponse.json({ error: 'Empty file', details: 'CSV must contain at least one row' }, { status: 400 })

    // load existing public supplements
    const { data: existing } = await supabase.from('supplement_profiles').select('id,name,public')
    const map = new Map<string, string>()
    for (const s of existing || []) map.set((s.name as string).toLowerCase(), s.id as string)

    const out = { created: 0, matched: 0, notFound: [] as string[], errors: [] as string[] }

    for (const r of rows) {
      try {
        const name = getCell(r, 'supplement', 'Supplement', 'name', 'Name')
        if (!name) { out.errors.push('Missing supplement name'); continue }
        const start = parseDate(getCell(r, 'start_date', 'Start Date', 'started', 'Started'))
        const end = parseDate(getCell(r, 'end_date', 'End Date', 'stopped', 'Stopped'))
        if (!start) { out.errors.push(`${name}: missing start date`); continue }

        // match or create profile
        let id = map.get(name.toLowerCase())
        if (!id) {
          for (const [n, i] of map.entries()) {
            if (n.includes(name.toLowerCase()) || name.toLowerCase().includes(n)) { id = i; break }
          }
        }
        if (!id) {
          const { data: created, error: cErr } = await supabase.from('supplement_profiles').insert({ name, public: true }).select('id').single()
          if (cErr || !created) { out.notFound.push(name); continue }
          id = created.id as string
          map.set(name.toLowerCase(), id)
        }

        // ensure in stack
        const { data: stack } = await supabase.from('stack_items').select('id').eq('profile_id', (profile as any).id).eq('supplement_profile_id', id).maybeSingle()
        if (!stack) {
          await supabase.from('stack_items').insert({
            profile_id: (profile as any).id,
            supplement_profile_id: id,
            dose: getCell(r, 'dose', 'Dose', 'dosage', 'Dosage'),
            notes: getCell(r, 'notes', 'Notes')
          })
        }

        // create daily logs
        const startDt = new Date(start)
        const endDt = end ? new Date(end) : new Date()
        const logs: any[] = []
        for (let d = new Date(startDt); d <= endDt; d.setDate(d.getDate() + 1)) {
          logs.push({
            user_id: (profile as any).user_id,
            supplement_id: id,
            local_date: d.toISOString().slice(0, 10),
            taken: true
          })
        }
        if (logs.length) {
          await supabase.from('supplement_logs').upsert(logs, { onConflict: 'user_id,supplement_id,local_date', ignoreDuplicates: true })
          out.created += logs.length
          out.matched++
        }
      } catch (e: any) {
        console.error('Row error', e)
        out.errors.push(e?.message || 'Unknown row error')
      }
    }

    if (!out.matched) return NextResponse.json({ error: 'No supplements imported', details: out.errors.join(', ') }, { status: 400 })

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${out.matched} supplements!`,
      details: `Created ${out.created} daily logs`,
      stats: { supplementsMatched: out.matched, logsCreated: out.created, notFound: out.notFound, errors: out.errors }
    })
  } catch (e: any) {
    console.error('Import error', e)
    return NextResponse.json({ error: 'Import failed', details: e?.message || 'Unknown error' }, { status: 500 })
  }
}


