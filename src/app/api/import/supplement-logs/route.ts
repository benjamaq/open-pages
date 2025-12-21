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


